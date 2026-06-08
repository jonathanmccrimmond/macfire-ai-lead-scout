/**
 * LinkedIn scraper
 *
 * Monitors LinkedIn for two high-value lead signals:
 *
 *  1. Job postings — a company hiring a Fire Safety Manager, Fire Risk Assessor
 *     or similar role almost always indicates new or expanding premises that
 *     will need a fire risk assessment and potentially MacFire's services.
 *
 *  2. Company updates — posts announcing new offices, venues, care homes or
 *     hospitality premises across Central Scotland.
 *
 * Requires:
 *   LINKEDIN_CLIENT_ID     — LinkedIn app client ID
 *   LINKEDIN_CLIENT_SECRET — LinkedIn app client secret
 *   LINKEDIN_ACCESS_TOKEN  — OAuth 2 access token with r_liteprofile + r_emailaddress + w_member_social
 *
 * API: LinkedIn Jobs Search API (v2) + UGC Posts API
 * Note: LinkedIn restricts API access — ensure your app has the correct products enabled.
 */

import type { SocialLead } from './index';

// Geographic codes for LinkedIn location filtering (LinkedIn uses region URNs)
// urn:li:geo:102299470 = Scotland
const SCOTLAND_GEO_URN = 'urn:li:geo:102299470';

// Job title keywords that strongly indicate a fire-safety opportunity
const FIRE_SAFETY_JOB_TITLES = [
  'Fire Safety Manager',
  'Fire Risk Assessor',
  'Fire Safety Consultant',
  'Head of Facilities',
  'Facilities Manager',
  'Health and Safety Manager',
  'HSE Manager',
  'Building Safety Manager',
  'Compliance Manager',
];

// Sectors to watch (LinkedIn industry codes)
const TARGET_INDUSTRIES = [
  'Hospitality',
  'Food & Beverages',
  'Health, Wellness & Fitness',
  'Hospitals & Health Care',
  'Real Estate',
  'Construction',
  'Warehousing',
];

// Keywords to look for in company update posts
const VENUE_KEYWORDS = [
  'new premises', 'new location', 'new office', 'new site', 'new venue',
  'opening soon', 'grand opening', 'under construction', 'fit-out', 'fit out',
  'planning approved', 'planning granted', 'planning permission',
  'new build', 'refurbishment', 'renovation',
];

export interface LinkedInLead extends SocialLead {
  linkedInUrl: string;
  companyName: string;
  companyLinkedInId?: string;
  leadType: 'job-posting' | 'company-update';
  jobTitle?: string;
}

interface LinkedInJobResult {
  id: string;
  title: string;
  description: string;
  company: { name: string; id: string; };
  location: string;
  listedAt: number;
  applyUrl?: string;
}

interface LinkedInUgcPost {
  id: string;
  author: string;
  created: { time: number; };
  specificContent: {
    'com.linkedin.ugc.ShareContent': {
      shareCommentary: { text: string; };
    };
  };
}

function scoreJobPosting(title: string, description: string): number {
  const combined = `${title} ${description}`.toLowerCase();
  let score = 55;

  // Direct fire safety roles are the highest signal
  if (combined.includes('fire safety')) score += 30;
  if (combined.includes('fire risk'))   score += 25;

  // Facilities / H&S roles at new venues
  if (combined.includes('new build') || combined.includes('new development')) score += 20;
  if (combined.includes('opening') || combined.includes('launch')) score += 15;
  if (combined.includes('hotel') || combined.includes('hospitality')) score += 10;
  if (combined.includes('care home') || combined.includes('healthcare')) score += 10;
  if (combined.includes('warehouse') || combined.includes('distribution')) score += 8;
  if (combined.includes('gym') || combined.includes('leisure')) score += 8;

  return Math.min(100, score);
}

function scoreCompanyUpdate(text: string): number {
  const lower = text.toLowerCase();
  let score = 40;

  VENUE_KEYWORDS.forEach(kw => { if (lower.includes(kw)) score += 12; });

  if (lower.includes('fire') || lower.includes('safety')) score += 20;
  if (lower.includes('scotland') || lower.includes('glasgow') || lower.includes('edinburgh')) score += 8;

  return Math.min(100, Math.max(0, score));
}

async function searchJobs(accessToken: string): Promise<LinkedInLead[]> {
  const leads: LinkedInLead[] = [];

  for (const title of FIRE_SAFETY_JOB_TITLES) {
    const url = new URL('https://api.linkedin.com/v2/jobSearch');
    url.searchParams.set('keywords', title);
    url.searchParams.set('locationId', SCOTLAND_GEO_URN);
    url.searchParams.set('count', '25');
    url.searchParams.set('start', '0');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'LinkedIn-Version': '202401',
      },
    });

    if (!res.ok) {
      console.error(`[linkedin] Job search failed for "${title}": ${res.status}`);
      continue;
    }

    const data = await res.json();
    for (const job of (data.elements ?? []) as LinkedInJobResult[]) {
      const score = scoreJobPosting(job.title, job.description ?? '');
      if (score < 55) continue;

      const flags = extractJobFlags(job.title, job.description ?? '');

      leads.push({
        id:               `li-job-${job.id}`,
        source:           'linkedin',
        sourceLabel:      'LinkedIn',
        address:          job.location || 'Scotland',
        proposal:         `Job posting: "${job.title}" at ${job.company.name}. ${job.description ? job.description.slice(0, 220) + '...' : ''}`,
        score,
        flags,
        date:             new Date(job.listedAt).toISOString().slice(0, 10),
        status:           'new',
        contact:          {
          director: job.company.name,
          email:    null,
          phone:    null,
          website:  null,
        },
        ref:              `LI-JOB-${job.id.slice(-8)}`,
        linkedInUrl:      job.applyUrl ?? `https://www.linkedin.com/jobs/view/${job.id}`,
        companyName:      job.company.name,
        companyLinkedInId: job.company.id,
        leadType:         'job-posting',
        jobTitle:         job.title,
      });
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  return leads;
}

async function searchCompanyUpdates(accessToken: string): Promise<LinkedInLead[]> {
  // UGC Posts API — fetch recent posts from target company pages
  // In practice, build a list of Scottish hospitality/care/leisure company LinkedIn IDs to monitor
  const leads: LinkedInLead[] = [];

  // Placeholder: in production, populate this list from a config file or Supabase
  const companyIds: string[] = [];

  for (const companyId of companyIds) {
    const url = `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn:li:organization:${companyId})&count=10`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}`, 'LinkedIn-Version': '202401' },
    });

    if (!res.ok) continue;
    const data = await res.json();

    for (const post of (data.elements ?? []) as LinkedInUgcPost[]) {
      const text = post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text ?? '';
      if (!text) continue;

      const score = scoreCompanyUpdate(text);
      if (score < 55) continue;

      leads.push({
        id:           `li-post-${post.id.replace(/[^a-z0-9]/gi, '')}`,
        source:       'linkedin',
        sourceLabel:  'LinkedIn',
        address:      extractLocation(text) ?? 'Scotland (location unconfirmed)',
        proposal:     text.slice(0, 350) + (text.length > 350 ? '...' : ''),
        score,
        flags:        extractPostFlags(text),
        date:         new Date(post.created.time).toISOString().slice(0, 10),
        status:       'new',
        contact:      null,
        ref:          `LI-POST-${post.id.slice(-8)}`,
        linkedInUrl:  `https://www.linkedin.com/feed/update/${post.id}`,
        companyName:  '',
        leadType:     'company-update',
      });
    }
  }

  return leads;
}

export async function scrapeLinkedIn(): Promise<LinkedInLead[]> {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn('[linkedin] LINKEDIN_ACCESS_TOKEN not set — skipping LinkedIn scrape');
    return [];
  }

  const [jobLeads, updateLeads] = await Promise.all([
    searchJobs(accessToken),
    searchCompanyUpdates(accessToken),
  ]);

  return [...jobLeads, ...updateLeads].sort((a, b) => b.score - a.score);
}

function extractLocation(text: string): string | null {
  const towns = ['Glasgow', 'Edinburgh', 'Stirling', 'Ayr', 'Paisley', 'Falkirk', 'Motherwell',
    'Hamilton', 'Irvine', 'Kilmarnock', 'Clydebank', 'Linlithgow'];
  for (const t of towns) {
    if (text.includes(t)) return t;
  }
  return null;
}

function extractJobFlags(title: string, desc: string): string[] {
  const lower = `${title} ${desc}`.toLowerCase();
  const flags: string[] = [];
  if (lower.includes('fire safety') || lower.includes('fire risk')) flags.push('fire-safety-hiring');
  if (lower.includes('hotel') || lower.includes('hospitality'))    flags.push('hotel');
  if (lower.includes('care') || lower.includes('healthcare'))      flags.push('care-home');
  if (lower.includes('warehouse') || lower.includes('distribution')) flags.push('warehouse');
  if (lower.includes('gym') || lower.includes('leisure'))          flags.push('sports-leisure');
  if (lower.includes('new build') || lower.includes('new development')) flags.push('new-build');
  if (lower.includes('opening'))                                    flags.push('opening-soon');
  return flags.length ? flags : ['job-posting'];
}

function extractPostFlags(text: string): string[] {
  const lower = text.toLowerCase();
  const flags: string[] = [];
  if (lower.includes('hotel'))                                      flags.push('hotel');
  if (lower.includes('restaurant') || lower.includes('food'))       flags.push('food-and-drink');
  if (lower.includes('care home') || lower.includes('care village')) flags.push('care-home');
  if (lower.includes('gym') || lower.includes('leisure'))           flags.push('sports-leisure');
  if (lower.includes('warehouse'))                                  flags.push('warehouse');
  if (lower.includes('planning'))                                   flags.push('planning-approved');
  if (lower.includes('new build') || lower.includes('new premises')) flags.push('new-build');
  if (lower.includes('refurb') || lower.includes('fit-out'))        flags.push('refurbishment');
  return flags.length ? flags : ['company-update'];
}
