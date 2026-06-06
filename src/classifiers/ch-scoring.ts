import type { ChCompany, DirectorInfo } from '../scrapers/companies-house/types';

// ── SIC metadata ─────────────────────────────────────────────────────────────

export interface SicMeta {
  sector: string;
  priority: 'High' | 'Medium' | 'Low';
  score: number;
  trigger: string;
}

export const SIC_META: Record<number, SicMeta> = {
  55100: { sector: 'Hospitality', priority: 'High',   score: 90, trigger: 'New hotel / accommodation operator' },
  55201: { sector: 'Hospitality', priority: 'High',   score: 88, trigger: 'New B&B / guest house' },
  55202: { sector: 'Hospitality', priority: 'High',   score: 85, trigger: 'New holiday letting operator' },
  55209: { sector: 'Hospitality', priority: 'High',   score: 82, trigger: 'New accommodation business' },
  55300: { sector: 'Leisure',     priority: 'High',   score: 78, trigger: 'New camping / caravan site' },
  55900: { sector: 'Hospitality', priority: 'Medium', score: 65, trigger: 'New accommodation provider' },
  56101: { sector: 'Hospitality', priority: 'High',   score: 92, trigger: 'New restaurant registration' },
  56102: { sector: 'Hospitality', priority: 'High',   score: 88, trigger: 'New unlicensed restaurant' },
  56103: { sector: 'Hospitality', priority: 'High',   score: 85, trigger: 'New takeaway / fast food operator' },
  56210: { sector: 'Hospitality', priority: 'High',   score: 80, trigger: 'New event catering company' },
  56290: { sector: 'Hospitality', priority: 'Medium', score: 70, trigger: 'New catering business' },
  56301: { sector: 'Hospitality', priority: 'High',   score: 93, trigger: 'New licensed bar / pub' },
  56302: { sector: 'Hospitality', priority: 'High',   score: 90, trigger: 'New nightclub / members club' },
  52100: { sector: 'Warehousing', priority: 'High',   score: 88, trigger: 'New warehousing operation' },
  52101: { sector: 'Warehousing', priority: 'High',   score: 88, trigger: 'New cold storage facility' },
  52102: { sector: 'Warehousing', priority: 'High',   score: 85, trigger: 'New self-storage facility' },
  52103: { sector: 'Warehousing', priority: 'High',   score: 82, trigger: 'New general warehousing operator' },
  52211: { sector: 'Warehousing', priority: 'Medium', score: 65, trigger: 'New vehicle storage / parking' },
  52219: { sector: 'Warehousing', priority: 'Medium', score: 60, trigger: 'New transport depot' },
  52220: { sector: 'Warehousing', priority: 'Medium', score: 60, trigger: 'New freight logistics company' },
  52290: { sector: 'Warehousing', priority: 'Medium', score: 55, trigger: 'New storage / logistics business' },
  47110: { sector: 'Retail',      priority: 'High',   score: 82, trigger: 'New supermarket / food store' },
  47190: { sector: 'Retail',      priority: 'High',   score: 78, trigger: 'New general retail store' },
  47210: { sector: 'Retail',      priority: 'Medium', score: 65, trigger: 'New specialist food retailer' },
  47300: { sector: 'Retail',      priority: 'Medium', score: 65, trigger: 'New petrol station / forecourt' },
  47520: { sector: 'Retail',      priority: 'High',   score: 72, trigger: 'New hardware / DIY retailer' },
  47730: { sector: 'Retail',      priority: 'High',   score: 75, trigger: 'New pharmacy / dispensary' },
  47782: { sector: 'Retail',      priority: 'High',   score: 70, trigger: 'New gun / ammunition retailer' },
  86101: { sector: 'Healthcare',  priority: 'High',   score: 90, trigger: 'New hospital / clinic' },
  86102: { sector: 'Healthcare',  priority: 'High',   score: 88, trigger: 'New mental health facility' },
  86103: { sector: 'Healthcare',  priority: 'High',   score: 85, trigger: 'New specialist medical centre' },
  86210: { sector: 'Healthcare',  priority: 'High',   score: 82, trigger: 'New GP / dental / medical practice' },
  86220: { sector: 'Healthcare',  priority: 'High',   score: 80, trigger: 'New specialist medical practice' },
  86230: { sector: 'Healthcare',  priority: 'High',   score: 78, trigger: 'New dental practice' },
  86900: { sector: 'Healthcare',  priority: 'High',   score: 80, trigger: 'New allied health business' },
  87100: { sector: 'Healthcare',  priority: 'High',   score: 95, trigger: 'New nursing home / care home' },
  87200: { sector: 'Healthcare',  priority: 'High',   score: 92, trigger: 'New mental health residential care' },
  87300: { sector: 'Healthcare',  priority: 'High',   score: 90, trigger: 'New elderly / disability care home' },
  87900: { sector: 'Healthcare',  priority: 'High',   score: 88, trigger: 'New other residential care facility' },
  93110: { sector: 'Leisure',     priority: 'High',   score: 85, trigger: 'New sports facility / stadium' },
  93120: { sector: 'Leisure',     priority: 'High',   score: 80, trigger: 'New sports club' },
  93130: { sector: 'Leisure',     priority: 'High',   score: 85, trigger: 'New gym / fitness centre' },
  93191: { sector: 'Leisure',     priority: 'High',   score: 80, trigger: 'New equestrian facility' },
  93199: { sector: 'Leisure',     priority: 'High',   score: 75, trigger: 'New other sports organisation' },
  93210: { sector: 'Leisure',     priority: 'High',   score: 88, trigger: 'New amusement / theme park' },
  93290: { sector: 'Leisure',     priority: 'High',   score: 82, trigger: 'New leisure / entertainment facility' },
  41100: { sector: 'Construction', priority: 'Medium', score: 65, trigger: 'New building development company' },
  41201: { sector: 'Construction', priority: 'Medium', score: 60, trigger: 'New commercial building contractor' },
  41202: { sector: 'Construction', priority: 'Medium', score: 58, trigger: 'New domestic building contractor' },
  85100: { sector: 'Education',   priority: 'High',   score: 88, trigger: 'New nursery / early years setting' },
  85200: { sector: 'Education',   priority: 'High',   score: 85, trigger: 'New primary school' },
  85310: { sector: 'Education',   priority: 'High',   score: 85, trigger: 'New secondary school' },
  85320: { sector: 'Education',   priority: 'High',   score: 82, trigger: 'New technical / vocational college' },
  85410: { sector: 'Education',   priority: 'High',   score: 80, trigger: 'New post-16 education provider' },
  85420: { sector: 'Education',   priority: 'High',   score: 82, trigger: 'New higher education institution' },
  85510: { sector: 'Education',   priority: 'High',   score: 80, trigger: 'New sports / recreation education provider' },
  85520: { sector: 'Education',   priority: 'High',   score: 78, trigger: 'New cultural education provider' },
  85590: { sector: 'Education',   priority: 'High',   score: 78, trigger: 'New other education provider' },
  85600: { sector: 'Education',   priority: 'Medium', score: 65, trigger: 'New educational support services' },
};

export const SIC_CODES = Object.keys(SIC_META).map(Number);

// ── Discard filters ───────────────────────────────────────────────────────────

const DISCARD_KEYWORDS = [
  'software', 'digital', 'tech', 'web design', 'online', 'it services', 'consulting',
  'consultancy', 'finance', 'financial', 'accounting', 'accountant', 'insurance',
  'legal', 'solicitor', 'law firm', 'holding', 'holdings', 'investment', 'venture',
  'marketing', 'media', 'advertising', 'publishing', 'seo', 'ecommerce', 'e-commerce',
];

const DISCARD_PATTERNS = [
  /\bmanagement\s+(group|company|services|solutions|co)\b/i,
  /\bholdings?\b/i,
  /\bproperties\b/i,
  /\bventures?\b/i,
  /\bonline\b/i,
  /\bvirtual\b/i,
  /\be[\-\s]?commerce\b/i,
  /\basset\s+management\b/i,
  /\bproperty\s+(group|management|investment)\b/i,
  /\binvestments?\b/i,
];

// ── Address intelligence ──────────────────────────────────────────────────────

const RESIDENTIAL_PATTERNS = [
  /^\d+\/\d+[\s,]/,
  /^flat\b/i,
  /^apartment\b/i,
  /\bflat\s+\d+\b/i,
  /\bapartment\s+\d+\b/i,
  /\b\d+(st|nd|rd|th)\s+floor\s+flat\b/i,
  /^top\s+floor\b/i,
  /^ground\s+floor\s+flat\b/i,
  /^cottage\b/i,
  /^bungalow\b/i,
  /^maisonette\b/i,
  /^studio\s+flat\b/i,
  /^basement\s+flat\b/i,
  /^lower\s+ground\s+flat\b/i,
  /^garden\s+flat\b/i,
  /\bcottage,\s/i,
];

const FORMATION_AGENT_PATTERNS = [
  /\bc\/o\b/i,
  /\bcare\s+of\b/i,
  /\bsuite\b/i,
  /\bpo\s+box\b/i,
  /\bp\.o\.\s*box\b/i,
  /\bwework\b/i,
  /\bregus\b/i,
  /\bservcorp\b/i,
  /\biwg\b/i,
];

const KNOWN_FORMATION_ADDRESSES = [
  '27 old gloucester street', '71-75 shelton street', '86-90 paul street',
  '124 city road', '128 city road', 'kemp house', '1 northumberland avenue',
  '20-22 wenlock road', '85 great portland street', '33 cavendish square',
  '71 queen victoria street', '5 new street square', 'office village',
  'melrose house', 'exchange place', '2 woodside terrace', 'summit house',
  '272 bath street', '249 west george street', '7 west nile street',
  '1 blythswood square', '24 blythswood square', '100 west regent street',
  '80 bothwell street', '100 queen street', '180 st vincent street',
  '29 st vincent place', '5 st vincent street', '3 ardgowan street',
];

const PROFESSIONAL_FIRM_ADDRESSES = [
  'premier accounting', 'talking numbers', 'johnston carmichael',
  'french duncan', 'scott-moncrieff', 'chiene + tait', 'chiene+tait',
  'saffery champness', 'azets', 'pkf', 'wright, johnston',
  'shepherd and wedderburn', 'maclay murray', 'brodies llp', 'thorntons law',
  'meston reid', 'yellowpath', 'raeburn allison',
  'formations house', '1st formations', 'companies made simple',
  'rapid formations', 'quality formations', 'the company warehouse',
];

const SHARED_BUILDING_KEYWORDS = [
  'business centre', 'business center', 'enterprise centre', 'enterprise center',
  'innovation centre', 'innovation center', 'innovation hub', 'enterprise hub',
  'managed workspace', 'managed offices', 'serviced offices', 'serviced office',
  'technology park', 'science park', 'commercial centre', 'commercial center',
];

const GEOGRAPHY_MODIFIERS: Record<string, number> = {
  AB: -20,
  DD: -10,
  PH: -5,
};

const SECTOR_NAME_KEYWORDS: Record<string, string[]> = {
  Hospitality:  ['restaurant', 'bistro', 'cafe', 'café', 'bar', 'pub', 'hotel', 'inn', 'lodge',
                 'kitchen', 'grill', 'brasserie', 'tavern', 'eatery', 'diner', 'canteen', 'pizzeria',
                 'curry', 'sushi', 'takeaway', 'kebab', 'chippy', 'burger', 'pasta', 'steakhouse',
                 'bakery', 'patisserie', 'buffet'],
  Healthcare:   ['clinic', 'dental', 'dentist', 'health', 'medical', 'care', 'therapy', 'physio',
                 'pharmacy', 'aesthetic', 'cosmetic', 'skin', 'wellness', 'nurse', 'doctor',
                 'surgery', 'optician', 'podiatry', 'osteopath', 'chiropractic', 'audiology'],
  Retail:       ['shop', 'store', 'mart', 'retail', 'market', 'boutique', 'emporium', 'outlet',
                 'gallery', 'supplies'],
  Leisure:      ['gym', 'fitness', 'sport', 'wrestling', 'boxing', 'yoga', 'pilates', 'club',
                 'arena', 'leisure', 'swim', 'dance', 'martial', 'crossfit', 'climbing', 'squash'],
  Education:    ['academy', 'school', 'training', 'education', 'learning', 'tuition', 'college',
                 'institute', 'skills', 'coaching', 'tutoring', 'nursery', 'childcare'],
  Warehousing:  ['storage', 'warehouse', 'logistics', 'distribution', 'haulage', 'freight',
                 'courier', 'transport', 'removals'],
  Construction: ['construction', 'building', 'build', 'brickwork', 'joinery', 'plumbing',
                 'electrical', 'roofing', 'groundwork', 'civil', 'scaffolding', 'flooring'],
};

// ── Classification ────────────────────────────────────────────────────────────

export interface ChClassificationResult {
  sector: string;
  priority: 'High' | 'Medium' | 'Low';
  baseScore: number;
  trigger: string;
  matchedSicCodes: number[];
}

export function classifyBySic(company: ChCompany): ChClassificationResult | null {
  const name = company.company_name ?? '';
  if (isDiscardedName(name)) return null;

  let bestMeta: SicMeta | null = null;
  let bestScore = -1;
  const matched: number[] = [];

  for (const raw of company.sic_codes ?? []) {
    const sic = parseInt(raw, 10);
    if (isNaN(sic)) continue;
    const meta = SIC_META[sic];
    if (!meta) continue;
    matched.push(sic);
    if (meta.score > bestScore) {
      bestScore = meta.score;
      bestMeta = meta;
    }
  }

  if (!bestMeta) return null;

  return {
    sector: bestMeta.sector,
    priority: bestMeta.priority,
    baseScore: bestMeta.score,
    trigger: bestMeta.trigger,
    matchedSicCodes: matched,
  };
}

function isDiscardedName(name: string): boolean {
  const lower = name.toLowerCase();
  if (DISCARD_KEYWORDS.some(kw => lower.includes(kw))) return true;
  if (DISCARD_PATTERNS.some(re => re.test(lower))) return true;
  return false;
}

// ── Score adjustments ─────────────────────────────────────────────────────────

export interface AddressFlags {
  isResidential: boolean;
  isFormationAgent: boolean;
  isSharedBuilding: boolean;
}

export function analyseAddress(addr: ChCompany['registered_office_address']): AddressFlags {
  const line1 = (addr.address_line_1 ?? '').trim();
  const full = [addr.address_line_1, addr.address_line_2, addr.locality]
    .filter(Boolean).join(' ').toLowerCase();

  const isResidential = RESIDENTIAL_PATTERNS.some(re => re.test(line1));

  const isFormationAgent =
    !!(addr.care_of?.trim()) ||
    FORMATION_AGENT_PATTERNS.some(re => re.test(full)) ||
    KNOWN_FORMATION_ADDRESSES.some(a => full.includes(a)) ||
    PROFESSIONAL_FIRM_ADDRESSES.some(a => full.includes(a));

  const isSharedBuilding = !isFormationAgent &&
    SHARED_BUILDING_KEYWORDS.some(kw => full.includes(kw));

  return { isResidential, isFormationAgent, isSharedBuilding };
}

export function geographyModifier(postcode: string | undefined): number {
  const pc = (postcode ?? '').trim().toUpperCase();
  for (const [prefix, adj] of Object.entries(GEOGRAPHY_MODIFIERS)) {
    if (pc.startsWith(prefix)) return adj;
  }
  return 0;
}

export function directorModifier(
  director: DirectorInfo,
  isResidential: boolean
): { adjustment: number; flags: string[] } {
  const flags: string[] = [];
  let adj = 0;

  if (director.directorCount === 0) {
    adj -= 10;
    flags.push('no directors found');
  } else if (director.directorCount === 1 && isResidential) {
    adj -= 5;
    flags.push('sole director: residential address');
  }

  if (director.totalAppointments !== null) {
    if (director.totalAppointments >= 10) {
      adj -= 15;
      flags.push('serial director (10+ appointments)');
    } else if (director.totalAppointments >= 5) {
      adj -= 7;
      flags.push('experienced director (5–9 appointments)');
    } else if (director.totalAppointments <= 1) {
      adj += 3;
      flags.push('first-time director');
    }
  }

  if (director.dissolvedCount !== null) {
    if (director.dissolvedCount >= 3) {
      adj -= 10;
      flags.push('dissolved company history (3+)');
    } else if (director.dissolvedCount >= 1) {
      adj -= 4;
      flags.push('dissolved company history (1–2)');
    }
  }

  return { adjustment: adj, flags };
}

export function nameMatchesSector(companyName: string, sector: string): boolean {
  const lower = companyName.toLowerCase();
  return (SECTOR_NAME_KEYWORDS[sector] ?? []).some(kw => lower.includes(kw));
}

export function scoreToLabel(score: number): 'High' | 'Medium' | 'Low' {
  if (score >= 75) return 'High';
  if (score >= 50) return 'Medium';
  return 'Low';
}

// ── Address string builder ────────────────────────────────────────────────────

export function buildAddressString(addr: ChCompany['registered_office_address']): string {
  return [addr.address_line_1, addr.locality, addr.region]
    .filter(Boolean).join(', ');
}
