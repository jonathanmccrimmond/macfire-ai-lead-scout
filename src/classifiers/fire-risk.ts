import Anthropic from '@anthropic-ai/sdk';
import type { IdoxApplication } from '../scrapers/idox/types';

export interface ClassificationResult {
  score: number;
  confidence: number;
  flags: string[];
  reasoning?: string;
}

const HIGH_RISK_PATTERNS: Array<[RegExp, string]> = [
  [/change\s+of\s+use/i,                             'change-of-use'],
  [/\bclass\s*3\b/i,                                 'class-3-food-drink'],
  [/restaurant|caf[eé]|canteen/i,                    'food-and-drink'],
  [/takeaway|hot[\s-]food/i,                         'hot-food-takeaway'],
  [/\bbar\b|\bpub\b|nightclub|licensed\s+premises/i, 'licensed-premises'],
  [/hotel|hostel|bed\s+and\s+breakfast|\bb&b\b/i,    'sleeping-accommodation'],
  [/gym|leisure\s+cent|fitness\s+cent/i,             'leisure-assembly'],
  [/cinema|theatre|concert\s+hall|assembly\s+hall/i, 'assembly-venue'],
];

const MEDIUM_RISK_PATTERNS: Array<[RegExp, string]> = [
  [/\bretail\b|\bshop\b|\bstore\b/i, 'retail'],
  [/\boffice\b/i,                    'office'],
  [/warehouse|storage\s+unit/i,      'storage'],
  [/fit[\s-]out|internal\s+alt/i,    'fit-out'],
  [/\bextension\b/i,                 'extension'],
  [/new\s+build|erect\s+a/i,         'new-build'],
];

export function classifyFireRisk(app: IdoxApplication): ClassificationResult {
  const text = `${app.proposal} ${app.appType}`;
  const flags: string[] = [];
  let score = 0;

  for (const [re, flag] of HIGH_RISK_PATTERNS) {
    if (re.test(text)) {
      flags.push(flag);
      score += 25;
    }
  }

  for (const [re, flag] of MEDIUM_RISK_PATTERNS) {
    if (re.test(text)) {
      flags.push(flag);
      score += 10;
    }
  }

  score = Math.min(score, 100);

  const confidence = score >= 50 ? 0.9 : score >= 25 ? 0.7 : 0.5;

  return { score, confidence, flags };
}

// Called only for borderline cases (score 20-45) to sharpen confidence.
// Model is read from AI_MODEL env var so it can be swapped without code changes.
export async function classifyWithAI(
  app: IdoxApplication,
  client: Anthropic
): Promise<ClassificationResult> {
  const base = classifyFireRisk(app);

  if (base.score >= 50 || base.score === 0) return base;

  const model = process.env.AI_MODEL ?? 'claude-haiku-4-5-20251001';

  const prompt = `You are assessing planning applications for a fire protection company (fire extinguishers, alarms, risk assessments).

Application:
Address: ${app.address}
Proposal: ${app.proposal}
Application Type: ${app.appType}

Does this represent a likely new customer? Score 0-100 and list key signals.

Respond with JSON only: {"score": number, "flags": string[], "reasoning": string}`;

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return base;

    const parsed = JSON.parse(jsonMatch[0]) as {
      score?: number;
      flags?: string[];
      reasoning?: string;
    };

    return {
      score: parsed.score ?? base.score,
      confidence: 0.85,
      flags: [...new Set([...base.flags, ...(parsed.flags ?? [])])],
      reasoning: parsed.reasoning,
    };
  } catch {
    return base;
  }
}

// Keep old export name for backwards compatibility
export { classifyWithAI as classifyWithHaiku };
