import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../db/client';
import { classifyFireRisk, classifyWithHaiku } from '../classifiers/fire-risk';
import { scrapeGlasgowWeeklyList } from '../scrapers/idox/glasgow';
import type { Signal, SignalResult, ScoredLead } from './base';

const MIN_SCORE = 20;

export class PlanningApplicationsSignal implements Signal {
  readonly name = 'planning-applications';

  constructor(private readonly anthropic?: Anthropic) {}

  async run(): Promise<SignalResult> {
    // Create audit record
    const { data: runRow, error: runErr } = await supabase
      .from('pipeline_runs')
      .insert({ source: 'planning', council: 'glasgow', records_fetched: 0, records_classified: 0, status: 'success' })
      .select('id')
      .single();

    if (runErr) throw runErr;
    const runId = (runRow as { id: string }).id;

    let applications;
    try {
      applications = await scrapeGlasgowWeeklyList();
    } catch (err) {
      await supabase
        .from('pipeline_runs')
        .update({ status: 'error', error_message: String(err) })
        .eq('id', runId);
      throw err;
    }

    const leads: ScoredLead[] = [];

    for (const app of applications) {
      const result = this.anthropic
        ? await classifyWithHaiku(app, this.anthropic)
        : classifyFireRisk(app);

      if (result.score < MIN_SCORE) continue;

      // Store raw application
      const { data: rawRow } = await supabase
        .from('raw_applications')
        .insert({
          run_id: runId,
          source: 'planning',
          council: 'glasgow',
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

      // Store scored lead
      await supabase.from('leads').insert({
        raw_application_id: rawId,
        source: 'planning:glasgow',
        address: app.address,
        postcode: app.postcode,
        description: app.proposal,
        score: result.score,
        flags: result.flags,
        confidence: result.confidence,
        status: 'new',
      });

      leads.push({
        source: 'planning:glasgow',
        address: app.address,
        postcode: app.postcode,
        description: app.proposal,
        score: result.score,
        flags: result.flags,
        confidence: result.confidence,
        rawData: app as unknown as Record<string, unknown>,
      });
    }

    await supabase
      .from('pipeline_runs')
      .update({ records_fetched: applications.length, records_classified: leads.length })
      .eq('id', runId);

    return { leads, runId, source: this.name, recordsFetched: applications.length, recordsClassified: leads.length };
  }
}
