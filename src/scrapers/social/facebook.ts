/**
 * Facebook scraper
 *
 * Monitors public Facebook Pages for Scottish businesses announcing new premises,
 * fit-outs, refurbishments, or venue openings that signal a fire safety need.
 *
 * Approach:
 *  1. Keyword search across public posts (Facebook Graph API /search endpoint).
 *  2. Monitor a curated list of Scottish business page IDs for recent posts.
 *
 * Requires:
 *   FB_APP_ID       — Facebook App ID
 *   FB_APP_SECRET   — Facebook App Secret
 *   FB_ACCESS_TOKEN — User or Page access token with pages_read_engagement scope
 *
 * Note: Facebook's Search API for public content requires the `pages_search` permission
 * which is available on approved apps. Page monitoring requires pages you manage
 * or public pages accessible via the Pages API.
 */

import type { SocialLead } from './index';

const GRAPH_BASE = 'https://graph.facebook.com/v19.0';

// Search terms to find relevant public posts
const SEARCH_TERMS: string[] = [
  'new bar opening Scotland',
  'new restaurant opening Scotland',
  'new hotel Scotland',
  'new gym Scotland',
  'new care home Scotland',
  'new warehouse Scotland',
  'planning approved Scotland new',
  'new venue Scotland',
  'fit-out Scotland',
  'grand opening Scotland',
];

// Scottish local business group / page IDs to monitor for posts
// In production, populate this from a config file or Supabase table
const MONITORED_PAGE_IDS: string[] = [
  // Example: add page IDs here, e.g. '123456789' for a Scottish business directory page
];

// Keywords that lift the lead score
const POSITIVE_KEYWORDS = [
  'new premises', 'new location', 'opening soon', 'grand opening', 'soft launch',
  'fit-out', 'fit out', 'refurb', 'renovation', 'under construction',
  'planning approved', 'planning granted', 'planning permission',
  'new build', 'new development', 'new venue', 'new bar', 'new restaurant',
  'new hotel', 'new gym', 'new care home', 'new warehouse', 'new office',
];

const NEGATIVE_KEYWORDS = [
  'menu', 'booking', 'reservation', 'live music', 'quiz', 'event tonight',
  'happy hour', 'brunch', 'special offer', 'discount',
];

export interface FacebookLead extends SocialLead {
  pageId: string;
  pageName: string;
  postId: string;
  postUrl: string;
}

interface GraphPost {
  id: string;
  message?: string;
  story?: string;
  created_time: string;
  from?: { id: string; name: string; };
}

function scorePost(text: string): number {
  const lower = text.toLowerCase();
  let score = 35;

  POSITIVE_KEYWORDS.forEach(kw => { if (lower.includes(kw)) score += 10; });
  NEGATIVE_KEYWORDS.forEach(kw => { if (lower.includes(kw)) score -= 12; });

  if (lower.includes('fire safety') || lower.includes('fire risk')) score += 25;
  if (lower.includes('scotland') || isScottishLocation(lower))      score += 5;

  return Math.min(100, Math.max(0, score));
}

async function searchPublicPosts(term: string, accessToken: string): Promise<FacebookLead[]> {
  const url = new URL(`${GRAPH_BASE}/search`);
  url.searchParams.set('q', term);
  url.searchParams.set('type', 'post');
  url.searchParams.set('fields', 'id,message,story,created_time,from');
  url.searchParams.set('limit', '25');
  url.searchParams.set('access_token', accessToken);

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error(`[facebook] Search failed for "${term}": ${res.status} ${await res.text()}`);
    return [];
  }

  const data = await res.json();
  const leads: FacebookLead[] = [];

  for (const post of (data.data ?? []) as GraphPost[]) {
    const text = post.message || post.story || '';
    if (!text) continue;

    const score = scorePost(text);
    if (score < 50) continue;

    const pageId   = post.from?.id ?? '';
    const pageName = post.from?.name ?? 'Unknown page';
    const postId   = post.id;

    leads.push({
      id:          `fb-${postId.replace(/[^a-z0-9]/gi, '')}`,
      source:      'facebook',
      sourceLabel: 'Facebook',
      address:     extractLocation(text) ?? 'Scotland (location unconfirmed)',
      proposal:    `"${pageName}": "${text.slice(0, 280)}${text.length > 280 ? '...' : ''}" [public post]`,
      score,
      flags:       extractFlags(text),
      date:        post.created_time.slice(0, 10),
      status:      'new',
      contact:     { director: pageName, email: null, phone: null, website: null },
      ref:         `FB-${postId.slice(-10)}`,
      pageId,
      pageName,
      postId,
      postUrl:     `https://www.facebook.com/${postId.replace('_', '/posts/')}`,
    });
  }

  return leads;
}

async function monitorPages(pageIds: string[], accessToken: string): Promise<FacebookLead[]> {
  if (!pageIds.length) return [];

  const leads: FacebookLead[] = [];

  for (const pageId of pageIds) {
    const url = new URL(`${GRAPH_BASE}/${pageId}/posts`);
    url.searchParams.set('fields', 'id,message,story,created_time,from');
    url.searchParams.set('limit', '15');
    url.searchParams.set('access_token', accessToken);

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error(`[facebook] Page ${pageId} fetch failed: ${res.status}`);
      continue;
    }

    const data = await res.json();
    for (const post of (data.data ?? []) as GraphPost[]) {
      const text = post.message || post.story || '';
      if (!text) continue;

      const score = scorePost(text);
      if (score < 50) continue;

      const pageName = post.from?.name ?? pageId;

      leads.push({
        id:          `fb-page-${post.id.replace(/[^a-z0-9]/gi, '')}`,
        source:      'facebook',
        sourceLabel: 'Facebook',
        address:     extractLocation(text) ?? 'Scotland (location unconfirmed)',
        proposal:    `"${pageName}": "${text.slice(0, 280)}${text.length > 280 ? '...' : ''}" [monitored page]`,
        score,
        flags:       extractFlags(text),
        date:        post.created_time.slice(0, 10),
        status:      'new',
        contact:     { director: pageName, email: null, phone: null, website: null },
        ref:         `FB-${post.id.slice(-10)}`,
        pageId,
        pageName,
        postId:      post.id,
        postUrl:     `https://www.facebook.com/${post.id.replace('_', '/posts/')}`,
      });
    }

    await new Promise(r => setTimeout(r, 800));
  }

  return leads;
}

export async function scrapeFacebook(): Promise<FacebookLead[]> {
  const accessToken = process.env.FB_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn('[facebook] FB_ACCESS_TOKEN not set — skipping Facebook scrape');
    return [];
  }

  const searchLeads: FacebookLead[] = [];
  for (const term of SEARCH_TERMS) {
    const results = await searchPublicPosts(term, accessToken);
    searchLeads.push(...results);
    await new Promise(r => setTimeout(r, 1000));
  }

  const pageLeads = await monitorPages(MONITORED_PAGE_IDS, accessToken);

  // Deduplicate by postId
  const seen = new Set<string>();
  const all: FacebookLead[] = [];
  for (const lead of [...searchLeads, ...pageLeads]) {
    if (!seen.has(lead.postId)) { seen.add(lead.postId); all.push(lead); }
  }

  return all.sort((a, b) => b.score - a.score);
}

function isScottishLocation(text: string): boolean {
  return ['glasgow', 'edinburgh', 'stirling', 'ayrshire', 'falkirk', 'lanarkshire',
    'renfrewshire', 'inverclyde', 'paisley', 'hamilton', 'motherwell', 'ayr',
    'irvine', 'kilmarnock', 'linlithgow', 'clackmannanshire', 'scotland'].some(t => text.includes(t));
}

function extractLocation(text: string): string | null {
  const towns = ['Glasgow', 'Edinburgh', 'Stirling', 'Ayr', 'Paisley', 'Falkirk',
    'Motherwell', 'Hamilton', 'Irvine', 'Kilmarnock', 'Clydebank', 'Linlithgow'];
  for (const t of towns) { if (text.includes(t)) return t; }
  return null;
}

function extractFlags(text: string): string[] {
  const lower = text.toLowerCase();
  const flags: string[] = [];
  if (lower.includes('hotel'))                                       flags.push('hotel');
  if (lower.includes('restaurant') || lower.includes('bar') || lower.includes('food')) flags.push('food-and-drink');
  if (lower.includes('care home'))                                   flags.push('care-home');
  if (lower.includes('gym') || lower.includes('leisure'))            flags.push('sports-leisure');
  if (lower.includes('warehouse'))                                   flags.push('warehouse');
  if (lower.includes('market') || lower.includes('events'))          flags.push('events-venue');
  if (lower.includes('refurb') || lower.includes('fit-out') || lower.includes('renovation')) flags.push('refurbishment');
  if (lower.includes('new premises') || lower.includes('new location') || lower.includes('new build')) flags.push('new-premises');
  if (lower.includes('planning'))                                    flags.push('planning-approved');
  if (lower.includes('opening'))                                     flags.push('opening-soon');
  return flags.length ? flags : ['social-signal'];
}
