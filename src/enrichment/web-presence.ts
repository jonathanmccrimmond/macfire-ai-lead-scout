import axios from 'axios';

export interface WebPresenceResult {
  found: boolean;
  domain: string;
  websiteUrl: string;
}

export async function checkWebPresence(companyName: string): Promise<WebPresenceResult> {
  const empty: WebPresenceResult = { found: false, domain: '', websiteUrl: '' };

  // Build slug from company name
  let slug = companyName
    .replace(/\b(ltd|limited|llp|plc|cic|lbg|scotland|group|uk)\b/gi, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (slug.length < 3) return empty;

  const candidates = [`https://${slug}.co.uk`, `https://www.${slug}.co.uk`];

  for (const url of candidates) {
    try {
      const resp = await axios.head(url, {
        timeout: 4_000,
        maxRedirects: 5,
        headers: { 'User-Agent': 'Mozilla/5.0' },
        validateStatus: s => s < 500,
      });
      if (resp.status < 400) {
        const domain = url.replace('https://', '').replace('https://www.', '');
        return { found: true, domain, websiteUrl: url };
      }
    } catch {
      // try next
    }
  }

  return empty;
}

export async function extractEmailFromWebsite(siteUrl: string): Promise<string> {
  const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const SKIP = new Set(['noreply', 'no-reply', 'donotreply', 'webmaster', 'postmaster',
    'mailer-daemon', 'bounce', 'admin', 'privacy', 'legal', 'gdpr', 'unsubscribe', 'hello', 'info', 'support']);

  function bestEmail(text: string): string {
    const matches = text.match(EMAIL_RE) ?? [];
    for (const email of matches) {
      const prefix = email.split('@')[0].toLowerCase();
      if (!SKIP.has(prefix)) return email.toLowerCase();
    }
    return '';
  }

  const base = siteUrl.replace(/\/$/, '');
  for (const path of ['', '/contact', '/contact-us']) {
    try {
      const resp = await axios.get(`${base}${path}`, {
        timeout: 5_000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
        validateStatus: s => s < 400,
      });
      const email = bestEmail(resp.data as string);
      if (email) return email;
    } catch {
      // try next
    }
  }
  return '';
}
