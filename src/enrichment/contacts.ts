import axios from 'axios';

const PHONE_RE = /(?:\+44\s?|0)(?:\d\s?){9,10}/g;
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

export interface ContactInfo {
  phone: string;
  email: string;
}

async function scrapeText(url: string): Promise<string> {
  try {
    const resp = await axios.get(url, { timeout: 10_000, headers: { 'User-Agent': UA }, validateStatus: s => s < 400 });
    return resp.data as string;
  } catch {
    return '';
  }
}

function extractContact(text: string): ContactInfo {
  const phones = text.match(PHONE_RE) ?? [];
  const emails = text.match(EMAIL_RE) ?? [];
  return {
    phone: phones[0]?.trim() ?? '',
    email: emails[0]?.trim() ?? '',
  };
}

export async function yellSearch(companyName: string, postcode: string): Promise<ContactInfo> {
  const q = companyName.replace(/\s+/g, '-');
  const pc = postcode.split(' ')[0];
  const url = `https://www.yell.com/s/${encodeURIComponent(q)}/${encodeURIComponent(pc)}/`;
  const text = await scrapeText(url);
  return extractContact(text);
}

export async function duckduckgoSearch(companyName: string, postcode: string): Promise<ContactInfo> {
  const query = `"${companyName}" ${postcode} contact phone`;
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const text = await scrapeText(url);
  return extractContact(text);
}

export async function enrichContacts(
  companyName: string,
  postcode: string | undefined,
  existingPhone: string,
  existingEmail: string
): Promise<ContactInfo> {
  let phone = existingPhone;
  let email = existingEmail;

  if (!phone || !email) {
    const yell = await yellSearch(companyName, postcode ?? '');
    if (!phone && yell.phone) phone = yell.phone;
    if (!email && yell.email) email = yell.email;
  }

  if (!phone || !email) {
    const ddg = await duckduckgoSearch(companyName, postcode ?? '');
    if (!phone && ddg.phone) phone = ddg.phone;
    if (!email && ddg.email) email = ddg.email;
  }

  return { phone, email };
}
