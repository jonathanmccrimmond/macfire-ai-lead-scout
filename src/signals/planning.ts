import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../db/client';
import { classifyFireRisk, classifyWithAI } from '../classifiers/fire-risk';
import { scrapeIdoxWeeklyList } from '../scrapers/idox/client';
import { COUNCILS } from '../scrapers/idox/councils';
import type { Signal, SignalResult, ScoredLead } from './base';

const MIN_SCORE = 20;

export class PlanningApplicationsSignal implements Signal {
  readonly name = 'planning-applications';

  constructor(private readonly anthropic?: Anthropic) {}

  async run(): Promise<SignalResult> {
    const allLeads: ScoredLead[] = [];
    let totalFetched = 0;
    let totalClassified = 0;

    const enabledCouncils = COUNCILS.filter(c => c.enabled);
    console.log(`[planning] Running ${enabledCouncils.length} councils`);

    for (const council of enabledCouncils) {
      try {
        const { leads, fetched, classified } = await this.runCouncil(council.name, council.portalBase);
        allLeads.push(...leads);
        totalFetched += fetched;
        totalClassified += classified;
      } catch (err) {
        console.error(`[planning] ${council.name} failed:`, err);
        // One failing council must not stop the rest
      }
    }

    return {
      leads: allLeads,
      runId: 'planning-multi',
      source: this.name,
      recordsFetched: totalFetched,
      recordsClassified: totalClassified,
    };
  }

  private async runCouncil(
    councilName: string,
    portalBase: string
  ): Promise<{ leads: ScoredLead[]; fetched: number; classified: number }> {
    const { data: runRow, error: runErr } = await supabase
      .from('pipeline_runs')
      .insert({ source: 'planning', council: councilName, records_fetched: 0, records_classified: 0, status: 'success' })
      .select('id')
      .single();

    if (runErr) throw runErr;
    const runId = (runRow as { id: string }).id;

    let applications;
    try {
      applications = await scrapeIdoxWeeklyList(portalBase, councilName);
    } catch (err) {
      await supabase.from('pipeline_runs').update({ status: 'error', error_message: String(err) }).eq('id', runId);
      throw err;
    }

    const leads: ScoredLead[] = [];

    for (const app of applications) {
      const result = this.anthropic
        ? await classifyWithAI(app, this.anthropic)
        : classifyFireRisk(app);

      if (result.score < MIN_SCORE) continue;

      const { data: rawRow } = await supabase
        .from('raw_applications')
        .insert({
          run_id: runId,
          source: 'planning',
          council: councilName,
          reference: app.reference,
          address: app.address,
          postcode: app.postcode,
          proposal: app.proposal,
          app_type: app.appType,
          validated_date: app.validatedDate,
          raw_data: app as unknown as Record<string, unknown>,
        })
        .select('id')
        .single();

      const rawId = (rawRow as { id: string } | null)?.id;

      await supabase.from('leads').insert({
        raw_application_id: rawId,
        source: `planning:${councilName}`,
        address: app.address,
        postcode: app.postcode,
        description: app.proposal,
        score: result.score,
        flags: result.flags,
        confidence: result.confidence,
        status: 'new',
      });

      leads.push({
        source: `planning:${councilName}`,
        address: app.address,
        postcode: app.postcode,
        description: app.proposal,
        score: result.score,
        flags: result.flags,
        confidence: result.confidence,
        rawData: app as unknown as Record<string, unknown>,
      });
    }

    await supabase.from('pipeline_runs').update({
      records_fetched: applications.length,
      records_classified: leads.length,
    }).eq('id', runId);

    console.log(`[planning] ${councilName}: ${applications.length} fetched, ${leads.length} qualified`);
    return { leads, fetched: applications.length, classified: leads.length };
  }
}
