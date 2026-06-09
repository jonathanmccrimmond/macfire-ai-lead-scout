/**
 * Instagram scraper
 *
 * Finds public Instagram signals for Scottish businesses announcing new venues,
 * fit-outs, refurbishments, openings, or other premises changes.
 *
 * Instagram does not provide an open keyword search API. This module therefore
 * supports the compliant Graph API routes available to an Instagram Business or
 * Creator account:
 *
 *  1. Hashtag discovery + recent media for configured hashtags.
 *  2. Business discovery for configured public Instagram usernames.
 *
 * Requires:
 *   IG_ACCESS_TOKEN          — Facebook/Instagram Graph API access token
 *   IG_BUSINESS_ACCOUNT_ID   — Instagram Business Account ID used for queries
 *
 * Optional:
 *   IG_HASHTAGS              — comma-separated hashtags to monitor
 *   IG_MONITORED_USERNAMES   — comma-separated public usernames to monitor
 */

import type { SocialLead } from './index';

const GRAPH_BASE = 'https://graph.facebook.com/v20.0';

const DEFAULT_HASHTAGS = [
  'scotlandbusiness',
  'glasgowbusiness',
  'edinburghbusiness',
  'newrestaurant',
  'newbar',
  'openingsoon',
  'fitout',
  'refurbishment',
  'newpremises',
];

const POSITIVE_KEYWORDS = [
  'new premises', 'new location', 'opening soon', 'grand opening', 'soft launch',
  'fit-out', 'fit out', 'refurb', 'refurbishment', 'renovation',
  'under construction', 'new venue', 'new bar', 'new restaurant',
  'new hotel', 'new gym', 'new care home', 'new warehouse', 'new site',
  'launching', 'we are opening', 'coming soon',
];

const NEGATIVE_KEYWORDS = [
  'giveaway', 'competition', 'discount', 'offer', 'menu', 'booking',
  'tonight', 'live music', 'dj set', 'quiz night',
];

export interface InstagramLead extends SocialLead {
  instagramUrl: string;
  mediaId: string;
  username: string;
  likeCount?: number;
  commentsCount?: number;
}

interface InstagramMedia {
  id: string;
  caption?: string;
  timestamp?: string;
  permalink?: string;
  username?: string;
  like_count?: number;
  comments_count?: number;
}

function envList(name: string, fallback: string[]): string[] {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw.split(',').map(item => item.trim()).filter(Boolean);
}

async function graphGet(path: string, params: Record<string, string>): Promise<any> {
  const url = new URL(`${GRAPH_BASE}/${path.replace(/^\/+/, '')}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Instagram Graph API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function hashtagId(hashtag: string, businessAccountId: string, accessToken: string): Promise<string | null> {
  const data = await graphGet('ig_hashtag_search', {
    user_id: businessAccountId,
    q: hashtag.replace(/^#/, ''),
    access_token: accessToken,
  });
  return data.data?.[0]?.id ?? null;
}

async function recentHashtagMedia(hashtag: string, businessAccountId: string, accessToken: string): Promise<InstagramMedia[]> {
  const id = await hashtagId(hashtag, businessAccountId, accessToken);
  if (!id) return [];
  const data = await graphGet(`${id}/recent_media`, {
    user_id: businessAccountId,
    fields: 'id,caption,timestamp,permalink,username,like_count,comments_count',
    limit: '25',
    access_token: accessToken,
  });
  return data.data ?? [];
}

async function userMedia(username: string, businessAccountId: string, accessToken: string): Promise<InstagramMedia[]> {
  const data = await graphGet(`${businessAccountId}`, {
    fields: `business_discovery.username(${username}){media.limit(12){id,caption,timestamp,permalink,username,like_count,comments_count}}`,
    access_token: accessToken,
  });
  return data.business_discovery?.media?.data ?? [];
}

function scoreCaption(text: string): number {
  const lower = text.toLowerCase();
  let score = 38;

  POSITIVE_KEYWORDS.forEach(kw => { if (lower.includes(kw)) score += 10; });
  NEGATIVE_KEYWORDS.forEach(kw => { if (lower.includes(kw)) score -= 12; });

  if (lower.includes('fire safety') || lower.includes('fire risk')) score += 24;
  if (lower.includes('planning approved') || lower.includes('planning granted')) score += 14;
  if (isScottishLocation(lower)) score += 8;

  return Math.min(100, Math.max(0, score));
}

function toLead(media: InstagramMedia, fallbackUsername = ''): InstagramLead | null {
  const caption = media.caption ?? '';
  if (!caption.trim()) return null;
  const score = scoreCaption(caption);
  if (score < 50) return null;

  const username = media.username || fallbackUsername || 'unknown';
  const mediaId = media.id;

  return {
    id: `ig-${mediaId.replace(/[^a-z0-9]/gi, '')}`,
    source: 'instagram',
    sourceLabel: 'Instagram',
    address: extractLocation(caption) ?? 'Scotland (location unconfirmed)',
    proposal: `@${username}: "${caption.slice(0, 280)}${caption.length > 280 ? '...' : ''}"`,
    score,
    flags: extractFlags(caption),
    date: (media.timestamp || new Date().toISOString()).slice(0, 10),
    status: 'new',
    contact: {
      director: `@${username}`,
      email: null,
      phone: null,
      website: null,
    },
    ref: `IG-${mediaId.slice(-10)}`,
    instagramUrl: media.permalink ?? `https://www.instagram.com/p/${mediaId}/`,
    mediaId,
    username,
    likeCount: media.like_count,
    commentsCount: media.comments_count,
  };
}

export async function scrapeInstagram(): Promise<InstagramLead[]> {
  const accessToken = process.env.IG_ACCESS_TOKEN;
  const businessAccountId = process.env.IG_BUSINESS_ACCOUNT_ID;
  if (!accessToken || !businessAccountId) {
    console.warn('[instagram] IG_ACCESS_TOKEN or IG_BUSINESS_ACCOUNT_ID not set — skipping Instagram scrape');
    return [];
  }

  const hashtags = envList('IG_HASHTAGS', DEFAULT_HASHTAGS);
  const usernames = envList('IG_MONITORED_USERNAMES', []);
  const media: InstagramMedia[] = [];

  for (const hashtag of hashtags) {
    try {
      media.push(...await recentHashtagMedia(hashtag, businessAccountId, accessToken));
    } catch (err) {
      console.error(`[instagram] Hashtag fetch failed for "${hashtag}":`, err);
    }
    await new Promise(r => setTimeout(r, 900));
  }

  for (const username of usernames) {
    try {
      media.push(...await userMedia(username, businessAccountId, accessToken));
    } catch (err) {
      console.error(`[instagram] User fetch failed for "${username}":`, err);
    }
    await new Promise(r => setTimeout(r, 900));
  }

  const seen = new Set<string>();
  const leads: InstagramLead[] = [];
  for (const item of media) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    const lead = toLead(item);
    if (lead) leads.push(lead);
  }

  return leads.sort((a, b) => b.score - a.score);
}

function isScottishLocation(text: string): boolean {
  return ['glasgow', 'edinburgh', 'stirling', 'ayrshire', 'falkirk', 'lanarkshire',
    'renfrewshire', 'inverclyde', 'paisley', 'hamilton', 'motherwell', 'ayr',
    'irvine', 'kilmarnock', 'linlithgow', 'clackmannanshire', 'scotland'].some(t => text.includes(t));
}

function extractLocation(text: string): string | null {
  const towns = ['Glasgow', 'Edinburgh', 'Stirling', 'Ayr', 'Paisley', 'Falkirk',
    'Motherwell', 'Hamilton', 'Irvine', 'Kilmarnock', 'Clydebank', 'Linlithgow'];
  for (const town of towns) {
    if (text.toLowerCase().includes(town.toLowerCase())) return town;
  }
  return null;
}

function extractFlags(text: string): string[] {
  const lower = text.toLowerCase();
  const flags: string[] = [];
  if (lower.includes('hotel')) flags.push('hotel');
  if (lower.includes('restaurant') || lower.includes('bar') || lower.includes('pub') || lower.includes('cafe') || lower.includes('café')) flags.push('food-and-drink');
  if (lower.includes('care home')) flags.push('care-home');
  if (lower.includes('gym') || lower.includes('leisure')) flags.push('sports-leisure');
  if (lower.includes('warehouse')) flags.push('warehouse');
  if (lower.includes('event') || lower.includes('market')) flags.push('events-venue');
  if (lower.includes('refurb') || lower.includes('fit-out') || lower.includes('fit out') || lower.includes('renovation')) flags.push('refurbishment');
  if (lower.includes('new premises') || lower.includes('new location') || lower.includes('new build') || lower.includes('new site')) flags.push('new-premises');
  if (lower.includes('planning')) flags.push('planning-approved');
  if (lower.includes('opening') || lower.includes('coming soon')) flags.push('opening-soon');
  return flags.length ? flags : ['instagram-signal'];
}
