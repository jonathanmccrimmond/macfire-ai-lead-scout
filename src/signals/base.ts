export interface ScoredLead {
  source: string;
  address: string;
  postcode?: string;
  description: string;
  score: number;
  flags: string[];
  confidence: number;
  rawData: Record<string, unknown>;
  // CH-specific (optional)
  companyNumber?: string;
  companyName?: string;
  sector?: string;
  trigger?: string;
  directorName?: string;
  directorCount?: number;
  websiteUrl?: string;
  websiteDomain?: string;
  emailAddress?: string;
  phoneNumber?: string;
  mapsUrl?: string;
  streetviewUrl?: string;
  placesStatus?: string;
  emailDraft?: string;
  reasoning?: string;
  premisesConfidence?: number;
  operationalConfidence?: number;
  complianceConfidence?: number;
  contactabilityConfidence?: number;
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
