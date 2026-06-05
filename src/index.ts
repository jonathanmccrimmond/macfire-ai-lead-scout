import Anthropic from '@anthropic-ai/sdk';
import { PlanningApplicationsSignal } from './signals/planning';
import { sendWeeklyDigest } from './email/digest';

async function main(): Promise<void> {
  console.log('[scout] Pipeline started');

  const anthropic = process.env.ANTHROPIC_API_KEY
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : undefined;

  if (!anthropic) {
    console.log('[scout] ANTHROPIC_API_KEY not set — using regex classifier only');
  }

  const planning = new PlanningApplicationsSignal(anthropic);

  try {
    const result = await planning.run();
    console.log(
      `[scout] Planning done: ${result.recordsFetched} fetched, ${result.recordsClassified} classified`
    );

    if (result.leads.length > 0) {
      await sendWeeklyDigest(result.leads);
      console.log(`[scout] Digest sent — ${result.leads.length} lead${result.leads.length === 1 ? '' : 's'}`);
    } else {
      console.log('[scout] No leads above threshold — no digest sent');
    }
  } catch (err) {
    console.error('[scout] Pipeline failed:', err);
    process.exit(1);
  }
}

main();
