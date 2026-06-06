export interface ChCompany {
  company_number: string;
  company_name: string;
  company_status: string;
  company_type: string;
  date_of_creation: string;
  sic_codes: string[];
  registered_office_address: {
    address_line_1?: string;
    address_line_2?: string;
    locality?: string;
    region?: string;
    postal_code?: string;
    country?: string;
    care_of?: string;
  };
}

export interface DirectorInfo {
  firstName: string | null;
  fullName: string | null;
  directorCount: number;
  totalAppointments: number | null;
  dissolvedCount: number | null;
}

export interface ChSearchResponse {
  items: ChCompany[];
  total_results: number;
}

export interface ChOfficersResponse {
  items: ChOfficer[];
  total_results: number;
}

export interface ChOfficer {
  name: string;
  officer_role: string;
  resigned_on?: string;
  links?: {
    officer?: {
      appointments?: string;
    };
  };
}

export interface ChAppointmentsResponse {
  total_results: number;
  items: Array<{
    company_status?: string;
    appointed_to?: { company_number?: string };
  }>;
}
