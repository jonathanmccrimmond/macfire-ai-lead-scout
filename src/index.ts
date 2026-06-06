import Anthropic from '@anthropic-ai/sdk';
import { PlanningApplicationsSignal } from './signals/planning';
import { CompaniesHouseSignal } from './signals/companies-house';
import { sendWeeklyDigest } from './email/digest';
import type { ScoredLead } from './signals/base';

async function main(): Promise<void> {
  console.log('[scout] Pipeline started');

  const anthropic = process.env.ANTHROPIC_API_KEY
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : undefined;

  if (!anthropic) {
    console.log('[scout] ANTHROPIC_API_KEY not set — using regex classifier for planning');
  }

  const chApiKey = process.env.CH_API_KEY;
  const googleApiKey = process.env.GOOGLE_API_KEY;

  if (!chApiKey) {
    console.log('[scout] CH_API_KEY not set — skipping Companies House signal');
  }
  if (!googleApiKey) {
    console.log('[scout] GOOGLE_API_KEY not set — Google Places enrichment disabled');
  }

  const allLeads: ScoredLead[] = [];
  const errors: string[] = [];

  // ── Companies House signal ─────────────────────────────────────────────────
  if (chApiKey) {
    try {
      const chSignal = new CompaniesHouseSignal(chApiKey, googleApiKey);
      const chResult = await chSignal.run();
      console.log(`[scout] CH done: ${chResult.recordsFetched} fetched, ${chResult.recordsClassified} qualified`);
      allLeads.push(...chResult.leads);
    } catch (err) {
      const msg = `CH signal failed: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`[scout] ${msg}`);
      errors.push(msg);
    }
  }

  // ── Planning applications signal ───────────────────────────────────────────
  try {
    const planning = new PlanningApplicationsSignal(anthropic);
    const planResult = await planning.run();
    console.log(
      `[scout] Planning done: ${planResult.recordsFetched} fetched, ${planResult.recordsClassified} qualified`
    );
    allLeads.push(...planResult.leads);
  } catch (err) {
    const msg = `Planning signal failed: ${err instanceof Error ? err.message : String(err)}`;
    console.error(`[scout] ${msg}`);
    errors.push(msg);
  }

  // ── Digest ─────────────────────────────────────────────────────────────────
  if (allLeads.length > 0) {
    await sendWeeklyDigest(allLeads);
    console.log(`[scout] Digest: ${allLeads.length} total lead${allLeads.length === 1 ? '' : 's'}`);
  } else {
    console.log('[scout] No leads this week — no digest sent');
  }

  if (errors.length > 0) {
    console.error(`[scout] ${errors.length} signal(s) failed — check logs above`);
    process.exit(1);
  }
}

main();
