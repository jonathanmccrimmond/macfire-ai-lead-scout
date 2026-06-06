export interface CouncilConfig {
  name: string;
  portalBase: string;
  enabled: boolean;
}

// All confirmed Idox Public Access portals. Disable a council by setting enabled: false.
// Note: selectors are uniform across Idox portals but page structure may vary slightly.
// If a council scraper returns 0 results, check the portal manually and adjust parse.ts if needed.
export const COUNCILS: CouncilConfig[] = [
  // ── Core Central Scotland ──────────────────────────────────────────────────
  {
    name: 'glasgow',
    portalBase: 'https://publicaccess.glasgow.gov.uk/online-applications',
    enabled: true,
  },
  {
    name: 'edinburgh',
    portalBase: 'https://citydev-portal.edinburgh.gov.uk/idoxpa-web',
    enabled: true,
  },
  {
    name: 'fife',
    portalBase: 'https://planning.fife.gov.uk/online',
    enabled: true,
  },
  {
    name: 'north-lanarkshire',
    portalBase: 'https://eplanning.north-lanarkshire.gov.uk/online',
    enabled: true,
  },
  {
    name: 'south-lanarkshire',
    portalBase: 'https://planning.southlanarkshire.gov.uk/online-applications',
    enabled: true,
  },
  // ── Stirling / Forth Valley ────────────────────────────────────────────────
  {
    name: 'stirling',
    portalBase: 'https://pabs.stirling.gov.uk/online-applications',
    enabled: true,
  },
  {
    name: 'falkirk',
    portalBase: 'https://edevelopment.falkirk.gov.uk/online',
    enabled: true,
  },
  {
    name: 'clackmannanshire',
    portalBase: 'https://publicaccess.clacks.gov.uk/publicaccess',
    enabled: true,
  },
  // ── Ayrshire ──────────────────────────────────────────────────────────────
  {
    name: 'north-ayrshire',
    portalBase: 'https://www.eplanning.north-ayrshire.gov.uk/OnlinePlanning',
    enabled: true,
  },
  {
    name: 'south-ayrshire',
    portalBase: 'https://publicaccess.south-ayrshire.gov.uk/online-applications',
    enabled: true,
  },
  {
    name: 'east-ayrshire',
    portalBase: 'https://eplanning.east-ayrshire.gov.uk/online',
    enabled: true,
  },
  // ── West / Inverclyde ─────────────────────────────────────────────────────
  {
    name: 'inverclyde',
    portalBase: 'https://planning.inverclyde.gov.uk/Online',
    enabled: true,
  },
  // ── Lothian ───────────────────────────────────────────────────────────────
  {
    name: 'west-lothian',
    portalBase: 'https://planning.westlothian.gov.uk/publicaccess',
    enabled: true,
  },
  // ── Portal URL unconfirmed — enable once verified ──────────────────────────
  {
    name: 'east-renfrewshire',
    portalBase: '',
    enabled: false,
  },
  {
    name: 'renfrewshire',
    portalBase: '',
    enabled: false,
  },
];
