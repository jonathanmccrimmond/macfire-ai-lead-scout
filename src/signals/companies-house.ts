import { supabase } from '../db/client';
import {
  fetchCompaniesBySic,
  fetchDirector,
  isScottishPostcode,
  sleep,
} from '../scrapers/companies-house/client';
import {
  classifyBySic,
  analyseAddress,
  buildAddressString,
  geographyModifier,
  directorModifier,
  nameMatchesSector,
  scoreToLabel,
  SIC_CODES,
} from '../classifiers/ch-scoring';
import { enrichWithGooglePlaces } from '../enrichment/google-places';
import { checkWebPresence, extractEmailFromWebsite } from '../enrichment/web-presence';
import { enrichContacts } from '../enrichment/contacts';
import { generateEmailDraft } from '../email/templates';
import type { Signal, SignalResult, ScoredLead } from './base';

const MIN_SCORE = 50;

// Query companies incorporated in the last N days
const LOOKBACK_DAYS = 8;

function dateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function lookbackRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - LOOKBACK_DAYS);
  return { from: dateString(from), to: dateString(to) };
}

async function isAlreadySeen(companyNumber: string): Promise<boolean> {
  const { data } = await supabase
    .from('leads')
    .select('id')
    .eq('company_number', companyNumber)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export class CompaniesHouseSignal implements Signal {
  readonly name = 'companies-house';
  private readonly apiKey: string;
  private readonly googleApiKey: string | undefined;

  constructor(apiKey: string, googleApiKey?: string) {
    this.apiKey = apiKey;
    this.googleApiKey = googleApiKey;
  }

  async run(): Promise<SignalResult> {
    const { from, to } = lookbackRange();
    console.log(`[ch] Querying ${SIC_CODES.length} SIC codes from ${from} to ${to}`);

    const { data: runRow, error: runErr } = await supabase
      .from('pipeline_runs')
      .insert({ source: 'companies_house', records_fetched: 0, records_classified: 0, status: 'success' })
      .select('id')
      .single();

    if (runErr) throw runErr;
    const runId = (runRow as { id: string }).id;

    try {
      const result = await this.process(runId, from, to);
      await supabase.from('pipeline_runs').update({
        records_fetched: result.recordsFetched,
        records_classified: result.recordsClassified,
      }).eq('id', runId);
      return result;
    } catch (err) {
      await supabase.from('pipeline_runs').update({ status: 'error', error_message: String(err) }).eq('id', runId);
      throw err;
    }
  }

  private async process(runId: string, from: string, to: string): Promise<SignalResult> {
    const leads: ScoredLead[] = [];
    const seenInRun = new Set<string>();
    let totalFetched = 0;

    for (const sicCode of SIC_CODES) {
      const companies = await fetchCompaniesBySic(sicCode, from, to, this.apiKey);
      await sleep(300); // CH rate limit: stay within 600 req/5 min

      for (const company of companies) {
        totalFetched++;
        const postcode = company.registered_office_address?.postal_code;
        if (!isScottishPostcode(postcode)) continue;
        if (company.company_status !== 'active') continue;
        if (seenInRun.has(company.company_number)) continue;
        seenInRun.add(company.company_number);

        // Dedup against Supabase
        if (await isAlreadySeen(company.company_number)) {
          console.log(`[ch] Skipping ${company.company_name} (already in DB)`);
          continue;
        }

        // SIC classification
        const classification = classifyBySic(company);
        if (!classification) continue;

        const addr = company.registered_office_address;
        const address = buildAddressString(addr);
        const addrFlags = analyseAddress(addr);

        // Base score from SIC
        let score = classification.baseScore;
        const flags: string[] = [];

        // Address quality adjustments
        if (addrFlags.isFormationAgent) {
          score -= 20;
          flags.push('formation agent address');
        } else if (addrFlags.isResidential) {
          score -= 15;
          flags.push('residential address');
        } else if (addrFlags.isSharedBuilding) {
          score -= 10;
          flags.push('shared building: landlord may cover fire compliance');
        }

        // Geography
        const geoAdj = geographyModifier(postcode);
        if (geoAdj !== 0) {
          score += geoAdj;
          flags.push(`geography: ${postcode?.slice(0, 2) ?? ''} area`);
        }

        // Director enrichment
        const director = await fetchDirector(company.company_number, this.apiKey);
        await sleep(200);

        const { adjustment: dirAdj, flags: dirFlags } = directorModifier(director, addrFlags.isResidential);
        score += dirAdj;
        flags.push(...dirFlags);

        // Name–sector match
        if (nameMatchesSector(company.company_name, classification.sector)) {
          score += 3;
          flags.push('name matches sector');
        }

        score = Math.min(Math.max(score, 0), 100);
        if (score < MIN_SCORE) continue;

        // Google Places enrichment (optional)
        let mapsUrl = '';
        let streetviewUrl = '';
        let placesStatus = '';
        let phoneNumber = '';

        if (this.googleApiKey) {
          const places = await enrichWithGooglePlaces(address, postcode, this.googleApiKey);
          score = Math.min(Math.max(score + places.scoreAdj, 0), 100);
          if (places.placesFlag) flags.push(places.placesFlag);
          mapsUrl = places.mapsUrl;
          streetviewUrl = places.streetviewUrl;
          placesStatus = places.placesStatus;
          phoneNumber = places.phoneNumber;

          // Force to Low if Google confirms non-business residential
          if (places.placesFlag === 'google: residential/non-business address') {
            score = Math.min(score, 45);
          }
        }

        // Web presence check
        let websiteUrl = '';
        let websiteDomain = '';
        let emailAddress = '';

        const webPresence = await checkWebPresence(company.company_name);
        if (webPresence.found) {
          score = Math.min(score + 5, 100);
          flags.push('web presence confirmed');
          websiteUrl = webPresence.websiteUrl;
          websiteDomain = webPresence.domain;
          // Try to extract email from website
          emailAddress = await extractEmailFromWebsite(websiteUrl);
        }

        // Contact enrichment (Yell + DuckDuckGo)
        const contacts = await enrichContacts(company.company_name, postcode, phoneNumber, emailAddress);
        phoneNumber = contacts.phone || phoneNumber;
        emailAddress = contacts.email || emailAddress;

        // Confidence calculation
        const premisesConfidence = Math.min(
          50 +
          (mapsUrl ? 10 : 0) +
          (placesStatus === 'OPERATIONAL' ? 25 : 0) +
          (postcode ? 5 : 0) +
          (/\b(street|road|lane|avenue|place|court|drive|way)\b/i.test(address) ? 10 : 0),
          100
        );
        const operationalConfidence = Math.min(
          30 +
          (websiteUrl ? 15 : 0) +
          (placesStatus === 'OPERATIONAL' ? 20 : 0) +
          (phoneNumber ? 10 : 0),
          100
        );
        const complianceConfidence = 50 + (classification.baseScore >= 80 ? 30 : 10);
        const contactabilityConfidence = Math.min(
          (emailAddress ? 40 : 0) + (phoneNumber ? 30 : 0) + (websiteUrl ? 20 : 0),
          100
        );

        const confidence = Math.min((score / 100) * 0.7 + (premisesConfidence / 100) * 0.3, 1);

        // Email draft
        const emailDraft = generateEmailDraft(
          company.company_name,
          classification.sector,
          director.firstName
        );

        // Store raw application
        const { data: rawRow } = await supabase
          .from('raw_applications')
          .insert({
            run_id: runId,
            source: 'companies_house',
            address,
            postcode,
            company_number: company.company_number,
            company_name: company.company_name,
            company_status: company.company_status,
            company_type: company.company_type,
            sic_codes: company.sic_codes,
            incorporated_date: company.date_of_creation,
            director_name: director.fullName ?? undefined,
            director_count: director.directorCount,
            total_appointments: director.totalAppointments ?? undefined,
            dissolved_count: director.dissolvedCount ?? undefined,
            raw_data: company as unknown as Record<string, unknown>,
          })
          .select('id')
          .single();

        const rawId = (rawRow as { id: string } | null)?.id;

        // Store lead
        await supabase.from('leads').insert({
          raw_application_id: rawId,
          source: `companies-house`,
          address,
          postcode,
          description: classification.trigger,
          score,
          flags,
          confidence,
          status: 'new',
          company_number: company.company_number,
          company_name: company.company_name,
          sector: classification.sector,
          trigger: classification.trigger,
          director_name: director.fullName ?? undefined,
          director_count: director.directorCount,
          website_url: websiteUrl || undefined,
          website_domain: websiteDomain || undefined,
          email_address: emailAddress || undefined,
          phone_number: phoneNumber || undefined,
          maps_url: mapsUrl || undefined,
          streetview_url: streetviewUrl || undefined,
          places_status: placesStatus || undefined,
          email_draft: emailDraft,
          premises_confidence: premisesConfidence,
          operational_confidence: operationalConfidence,
          compliance_confidence: complianceConfidence,
          contactability_confidence: contactabilityConfidence,
        });

        const lead: ScoredLead = {
          source: 'companies-house',
          address,
          postcode,
          description: classification.trigger,
          score,
          flags,
          confidence,
          rawData: company as unknown as Record<string, unknown>,
          companyNumber: company.company_number,
          companyName: company.company_name,
          sector: classification.sector,
          trigger: classification.trigger,
          directorName: director.fullName ?? undefined,
          directorCount: director.directorCount,
          websiteUrl: websiteUrl || undefined,
          websiteDomain: websiteDomain || undefined,
          emailAddress: emailAddress || undefined,
          phoneNumber: phoneNumber || undefined,
          mapsUrl: mapsUrl || undefined,
          streetviewUrl: streetviewUrl || undefined,
          placesStatus: placesStatus || undefined,
          emailDraft,
          premisesConfidence,
          operationalConfidence,
          complianceConfidence,
          contactabilityConfidence,
        };

        leads.push(lead);
        console.log(
          `[ch] ✓ ${company.company_name} | ${classification.sector} | score: ${score} | ${flags.join(', ')}`
        );
      }
    }

    console.log(`[ch] Done: ${totalFetched} fetched, ${leads.length} qualified leads`);
    return {
      leads,
      runId,
      source: this.name,
      recordsFetched: totalFetched,
      recordsClassified: leads.length,
    };
  }
}
