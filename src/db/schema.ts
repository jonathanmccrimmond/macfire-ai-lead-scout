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
  council?: string;
  // Planning
  reference?: string;
  address: string;
  postcode?: string;
  proposal?: string;
  app_type?: string;
  validated_date?: string;
  // Companies House
  company_number?: string;
  company_name?: string;
  company_status?: string;
  company_type?: string;
  sic_codes?: string[];
  incorporated_date?: string;
  director_name?: string;
  director_count?: number;
  total_appointments?: number;
  dissolved_count?: number;
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
  // CH-specific
  company_number?: string;
  company_name?: string;
  sector?: string;
  trigger?: string;
  director_name?: string;
  director_count?: number;
  // Enrichment
  website_url?: string;
  website_domain?: string;
  email_address?: string;
  phone_number?: string;
  maps_url?: string;
  streetview_url?: string;
  places_status?: string;
  email_draft?: string;
  reasoning?: string;
  // Confidence dimensions
  premises_confidence?: number;
  operational_confidence?: number;
  compliance_confidence?: number;
  contactability_confidence?: number;
}
