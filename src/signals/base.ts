export interface ScoredLead {
  source: string;
  address: string;
  postcode?: string;
  description: string;
  score: number;
  flags: string[];
  confidence: number;
  rawData: Record<string, unknown>;
}

export interface SignalResult {
  leads: ScoredLead[];
  runId: string;
  source: string;
  recordsFetched: number;
  recordsClassified: number;
}

export interface Signal {
  readonly name: string;
  run(): Promise<SignalResult>;
}
