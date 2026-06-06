export interface CouncilConfig {
  name: string;
  portalBase: string;
  enabled: boolean;
}

// All confirmed Idox Public Access portals. Disable a council by setting enabled: false.
// Note: selectors are uniform across Idox portals but page structure may vary slightly.
// If a council scraper returns 0 results, check the portal manually and adjust parse.ts if needed.
export const COUNCILS: CouncilConfig[] = [
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
  {
    name: 'aberdeen',
    portalBase: 'https://publicaccess.aberdeencity.gov.uk/online-applications',
    enabled: true,
  },
];
