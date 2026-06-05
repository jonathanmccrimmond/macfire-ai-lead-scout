export interface PipelineRun {
  id?: string;
  created_at?: string;
  source: string;
  council?: string;
  records_fetched: number;
  records_classified: number;
  status: 'success' | 'error';
  error_message?: string;
}

export interface RawApplication {
  id?: string;
  created_at?: string;
  run_id: string;
  source: 'planning' | 'companies_house';
  council: string;
  reference: string;
  address: string;
  postcode?: string;
  proposal?: string;
  app_type?: string;
  validated_date?: string;
  raw_data: Record<string, unknown>;
}

export interface Lead {
  id?: string;
  created_at?: string;
  raw_application_id?: string;
  source: string;
  address: string;
  postcode?: string;
  description?: string;
  score: number;
  flags: string[];
  confidence: number;
  status: 'new' | 'contacted' | 'won' | 'dead';
}
