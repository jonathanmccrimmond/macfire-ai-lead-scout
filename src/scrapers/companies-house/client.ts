import axios from 'axios';
import type { ChCompany, ChSearchResponse, DirectorInfo, ChOfficersResponse, ChAppointmentsResponse } from './types';

const CH_BASE_URL = 'https://api.company-information.service.gov.uk/advanced-search/companies';
const CH_COMPANY_URL = 'https://api.company-information.service.gov.uk/company';
const CH_BASE_OFFICER_URL = 'https://api.company-information.service.gov.uk';

const SCOTTISH_PREFIXES = ['PA', 'KA', 'EH', 'FK', 'PH'];

export function isScottishPostcode(postcode: string | undefined): boolean {
  const pc = (postcode ?? '').trim().toUpperCase();
  if (SCOTTISH_PREFIXES.some(p => pc.startsWith(p))) return true;
  if (pc.length >= 2 && pc[0] === 'G' && /\d/.test(pc[1])) return true;
  // ML, KY, KA also common Central Scotland postcodes
  if (pc.startsWith('ML') || pc.startsWith('KY')) return true;
  return false;
}

export async function fetchCompaniesBySic(
  sicCode: number,
  incorporatedFrom: string,
  incorporatedTo: string,
  apiKey: string
): Promise<ChCompany[]> {
  try {
    const response = await axios.get<ChSearchResponse>(CH_BASE_URL, {
      params: {
        sic_codes: String(sicCode),
        incorporated_from: incorporatedFrom,
        incorporated_to: incorporatedTo,
        size: 100,
      },
      auth: { username: apiKey, password: '' },
      timeout: 20_000,
    });
    return response.data.items ?? [];
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 404) return [];
    console.warn(`[ch] SIC ${sicCode}: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

export async function fetchDirector(companyNumber: string, apiKey: string): Promise<DirectorInfo> {
  const empty: DirectorInfo = { firstName: null, fullName: null, directorCount: 0, totalAppointments: null, dissolvedCount: null };

  try {
    const resp = await axios.get<ChOfficersResponse>(
      `${CH_COMPANY_URL}/${companyNumber}/officers`,
      { params: { items_per_page: 20 }, auth: { username: apiKey, password: '' }, timeout: 15_000 }
    );

    const officers = resp.data.items ?? [];
    const activeDirectors = officers.filter(
      o => !o.resigned_on && o.officer_role.toLowerCase().includes('director')
    );
    const directorCount = activeDirectors.length || officers.filter(o => !o.resigned_on).length;

    if (!activeDirectors.length) return { ...empty, directorCount };

    const officer = activeDirectors[0];
    const rawName = (officer.name ?? '').trim();
    if (!rawName) return { ...empty, directorCount };

    let firstName: string | null = null;
    let fullName: string | null = null;

    // CH format: "SURNAME, Firstname Middlename"
    if (rawName.includes(',')) {
      const [surnamePart, forenamePart] = rawName.split(',', 2);
      const surname = surnamePart.trim().replace(/\b\w/g, c => c.toUpperCase());
      const forenames = (forenamePart ?? '').trim().replace(/\b\w/g, c => c.toUpperCase());
      firstName = forenames.split(' ')[0] ?? null;
      fullName = `${forenames} ${surname}`.trim();
    } else {
      const parts = rawName.replace(/\b\w/g, c => c.toUpperCase()).split(' ');
      firstName = parts[0] ?? null;
      fullName = rawName.replace(/\b\w/g, c => c.toUpperCase());
    }

    // Follow appointments link for director history
    let totalAppointments: number | null = null;
    let dissolvedCount: number | null = null;

    const apptPath = officer.links?.officer?.appointments;
    if (apptPath) {
      try {
        const ra = await axios.get<ChAppointmentsResponse>(
          `${CH_BASE_OFFICER_URL}${apptPath}`,
          { params: { items_per_page: 50 }, auth: { username: apiKey, password: '' }, timeout: 10_000 }
        );
        // Subtract 1 to exclude the current company
        totalAppointments = Math.max(0, (ra.data.total_results ?? 1) - 1);
        dissolvedCount = (ra.data.items ?? []).filter(item => {
          const status = (item.company_status ?? '').toLowerCase();
          return ['dissolved', 'liquidation', 'receivership', 'administration'].includes(status)
            && item.appointed_to?.company_number !== companyNumber;
        }).length;
      } catch {
        // non-fatal
      }
    }

    return { firstName, fullName, directorCount, totalAppointments, dissolvedCount };
  } catch {
    return empty;
  }
}

// Delay helper for CH rate limiting (600 req / 5 min)
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
