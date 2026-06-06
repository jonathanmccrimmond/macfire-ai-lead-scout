// Sector-specific personalised outreach email templates for Companies House leads.
// These are stored in Supabase on the lead record so Dougie can send them manually.

const FOOTER = '\n\nWarm regards,\nThe MacFire Team\nmacfiresafety.co.uk';

const TEMPLATES: Record<string, (name: string, salutation: string) => string> = {
  Hospitality: (name, sal) =>
    `Subject: Fire Safety Compliance for ${name} — Free Risk Assessment from MacFire\n\n` +
    `Dear ${sal},\n\n` +
    `Congratulations on the recent registration of ${name}! As a new hospitality business operating in Scotland, ` +
    `you'll be required under the Regulatory Reform (Fire Safety) Order 2005 to carry out a suitable and sufficient ` +
    `fire risk assessment before you open your doors to the public — and to keep it regularly reviewed. ` +
    `For hospitality premises, this includes ensuring compliant fire detection to BS 5839-1, adequate means of escape, ` +
    `emergency lighting, and appropriate fire suppression where cooking equipment is involved.\n\n` +
    `At MacFire Fire Safety Solutions, we work exclusively with commercial clients across Central Scotland, providing ` +
    `fire risk assessments, alarm system installation and servicing, suppression systems, and compliance certification. ` +
    `We'd love to offer you a free initial fire safety consultation to help you start on the right foot — no obligation, ` +
    `just expert local advice.\n\n` +
    `Please get in touch at your convenience and we'll arrange a time that suits you.` +
    FOOTER,

  Warehousing: (name, sal) =>
    `Subject: Fire Safety Compliance for ${name} — Free Risk Assessment from MacFire\n\n` +
    `Dear ${sal},\n\n` +
    `Congratulations on the recent registration of ${name}! As a new warehousing or storage operation in Scotland, ` +
    `your premises will be subject to the Regulatory Reform (Fire Safety) Order 2005, which requires a current fire risk ` +
    `assessment and appropriate detection. For warehouses over 2,000m², sprinkler systems are strongly recommended and ` +
    `often required by insurers and Scottish Building Standards.\n\n` +
    `MacFire Fire Safety Solutions provides commercial fire risk assessments, BS 5839 alarm systems, sprinkler installation, ` +
    `and extinguisher servicing across Central Scotland. We'd be delighted to offer a free consultation to help you ` +
    `understand your obligations and get compliant from day one.\n\n` +
    `Get in touch and we'll arrange a convenient time to visit your site.` +
    FOOTER,

  Retail: (name, sal) =>
    `Subject: Fire Safety Compliance for ${name} — Free Risk Assessment from MacFire\n\n` +
    `Dear ${sal},\n\n` +
    `Congratulations on the registration of ${name}! Retail premises open to the public are covered by the ` +
    `Regulatory Reform (Fire Safety) Order 2005, which places a legal duty on the responsible person to maintain a ` +
    `current fire risk assessment, appropriate detection and warning systems, and trained staff. Getting this right ` +
    `from the outset protects your customers, your team, and your business.\n\n` +
    `MacFire Fire Safety Solutions is a Scotland-based commercial fire safety company offering fire risk assessments, ` +
    `alarm system installation, emergency lighting, and extinguisher supply and servicing. We'd love to offer you a ` +
    `free fire safety consultation — no strings attached — so you can open with confidence.\n\n` +
    `Do get in touch and we'll find a time to suit you.` +
    FOOTER,

  Healthcare: (name, sal) =>
    `Subject: Fire Safety Compliance for ${name} — Free Risk Assessment from MacFire\n\n` +
    `Dear ${sal},\n\n` +
    `Congratulations on the recent registration of ${name}! Healthcare and residential care premises are among ` +
    `the most stringently regulated under fire safety law. Under the Regulatory Reform (Fire Safety) Order 2005 and ` +
    `Scottish Health Technical Memorandum HTM 05-03, you'll need a comprehensive fire risk assessment, a BS 5839-1 ` +
    `Category L1 alarm system, and — for residential care — sprinkler provision is now expected under Scottish Building ` +
    `Regulations for new and substantially altered premises.\n\n` +
    `MacFire Fire Safety Solutions specialises in commercial fire safety for healthcare and care home operators across ` +
    `Scotland. We offer fire risk assessments, compliant alarm system design and installation, suppression systems, and ` +
    `ongoing maintenance contracts. We'd be glad to offer a free initial consultation to walk you through your obligations.\n\n` +
    `Please get in touch at your earliest convenience.` +
    FOOTER,

  Leisure: (name, sal) =>
    `Subject: Fire Safety Compliance for ${name} — Free Risk Assessment from MacFire\n\n` +
    `Dear ${sal},\n\n` +
    `Congratulations on the registration of ${name}! Leisure and sports facilities that are open to the public ` +
    `must comply with the Regulatory Reform (Fire Safety) Order 2005, including maintaining a current fire risk ` +
    `assessment, appropriate fire detection to BS 5839-1, emergency lighting, and clearly marked means of escape. ` +
    `Getting these in place before you open is both a legal requirement and a duty of care to your members and visitors.\n\n` +
    `MacFire Fire Safety Solutions provides commercial fire safety services to leisure operators across Central Scotland — ` +
    `from gyms and sports clubs to entertainment venues. We'd love to offer a free consultation to help you understand ` +
    `your obligations and plan your compliance from the start.\n\n` +
    `Get in touch and we'll arrange a time that suits you.` +
    FOOTER,

  Construction: (name, sal) =>
    `Subject: Fire Safety Planning for ${name} — Advice from MacFire\n\n` +
    `Dear ${sal},\n\n` +
    `Congratulations on the registration of ${name}! As a new construction or building company operating in ` +
    `Scotland, fire safety on site is a critical obligation under the Construction (Design and Management) Regulations ` +
    `2015 and the Regulatory Reform (Fire Safety) Order 2005 for your offices and welfare facilities. Beyond that, ` +
    `many of the buildings you work on will require fire safety installations that need to be designed and certified correctly.\n\n` +
    `MacFire Fire Safety Solutions works with construction companies across Central Scotland, providing compliant alarm ` +
    `systems, suppression installation, fire risk assessments, and certification for handover. We'd welcome the chance ` +
    `to discuss how we can support your projects.\n\n` +
    `Please get in touch at your convenience.` +
    FOOTER,

  Education: (name, sal) =>
    `Subject: Fire Safety Compliance for ${name} — Free Risk Assessment from MacFire\n\n` +
    `Dear ${sal},\n\n` +
    `Congratulations on the registration of ${name}! Educational establishments — from nurseries and schools ` +
    `to colleges — are subject to strict fire safety requirements under the Regulatory Reform (Fire Safety) Order 2005. ` +
    `You'll need a current fire risk assessment, a compliant BS 5839-1 fire detection and alarm system, emergency ` +
    `lighting, regular drills, and documented procedures before you welcome pupils or students.\n\n` +
    `MacFire Fire Safety Solutions works with schools, nurseries, and educational providers across Scotland, providing ` +
    `fire risk assessments, alarm system installation and servicing, emergency lighting, and staff training. We'd love ` +
    `to offer you a free initial consultation so you can get your compliance in order from day one.\n\n` +
    `Do get in touch — we're always happy to help new educational settings start safely.` +
    FOOTER,

  Other: (name, sal) =>
    `Subject: Fire Safety Compliance for ${name} — Free Risk Assessment from MacFire\n\n` +
    `Dear ${sal},\n\n` +
    `Congratulations on the recent registration of ${name}! As a new business operating commercial premises ` +
    `in Scotland, you'll be required under the Regulatory Reform (Fire Safety) Order 2005 to maintain a current fire ` +
    `risk assessment and appropriate fire safety measures — including detection, emergency lighting, and trained staff.\n\n` +
    `MacFire Fire Safety Solutions provides commercial fire risk assessments, BS 5839 alarm systems, extinguisher ` +
    `supply and servicing, and compliance certification to businesses across Central Scotland. We'd be delighted to ` +
    `offer a free initial consultation to help you understand your obligations.\n\n` +
    `Please get in touch at your convenience.` +
    FOOTER,
};

export function generateEmailDraft(
  companyName: string,
  sector: string,
  directorFirstName: string | null
): string {
  const salutation = directorFirstName ?? 'there';
  const templateFn = TEMPLATES[sector] ?? TEMPLATES['Other'];
  return templateFn(companyName, salutation);
}
