/**
 * X / Twitter scraper
 *
 * Searches public X posts for signals that a Scottish business is opening new
 * premises, undertaking a fit-out or refurbishment, or hiring for roles that
 * indicate they need fire safety services.
 *
 * Requires:
 *   X_BEARER_TOKEN — set as a GitHub Actions secret / env var
 *
 * API: X API v2 — Recent Search endpoint
 * Rate limit: Basic tier allows 100 requests / 15 min (read)
 */

import type { SocialLead } from './index';

// Geographic focus — appended to each query to keep results Scottish
const GEO_FILTER = '(Scotland OR Glasgow OR Edinburgh OR Stirling OR Ayrshire OR Falkirk OR "West Lothian" OR Lanarkshire OR Renfrewshire OR Inverclyde OR Clackmannanshire)';

// Search queries that surface high-value fire safety leads
const QUERIES: string[] = [
  // New venue openings
  `("new bar" OR "new restaurant" OR "new pub" OR "new café") opening ${GEO_FILTER} -is:retweet lang:en`,
  // New premises / fit-out
  `("new premises" OR "new location" OR "fit-out" OR "fit out" OR "under construction") ${GEO_FILTER} -is:retweet lang:en`,
  // New leisure / events
  `("new gym" OR "new hotel" OR "new care home" OR "events venue" OR "market hall") ${GEO_FILTER} -is:retweet lang:en`,
  // Planning approved
  `("planning approved" OR "planning permission" OR "planning granted") ${GEO_FILTER} -is:retweet lang:en`,
  // New warehouse / industrial
  `("new warehouse" OR "new distribution centre" OR "new factory") ${GEO_FILTER} -is:retweet lang:en`,
];

// Keywords that raise the lead score
const HIGH_VALUE_KEYWORDS = [
  'hotel', 'bar', 'restaurant', 'pub', 'café', 'cafe', 'gym', 'leisure', 'warehouse',
  'care home', 'events venue', 'market hall', 'fit-out', 'fit out', 'new premises',
  'planning approved', 'planning granted', 'opening soon',
];

// Keywords that indicate this is NOT a useful lead (lower score / skip)
const LOW_VALUE_KEYWORDS = ['review', 'menu', 'booking', 'reservation', 'quiz night', 'live music'];

export interface TwitterLead extends SocialLead {
  tweetId: string;
  tweetUrl: string;
  authorHandle: string;
  authorName: string;
  likeCount: number;
  retweetCount: number;
}

interface TweetSearchResponse {
  data?: Array<{
    id: string;
    text: string;
    author_id: string;
    created_at: string;
    public_metrics: { like_count: number; retweet_count: number; };
  }>;
  includes?: {
    users?: Array<{ id: string; username: string; name: string; }>;
  };
}

async function searchQuery(query: string, bearerToken: string): Promise<TweetSearchResponse> {
  const url = new URL('https://api.twitter.com/2/tweets/search/recent');
  url.searchParams.set('query', query);
  url.searchParams.set('max_results', '25');
  url.searchParams.set('tweet.fields', 'author_id,created_at,public_metrics');
  url.searchParams.set('expansions', 'author_id');
  url.searchParams.set('user.fields', 'username,name');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });

  if (!res.ok) throw new Error(`Twitter API error ${res.status}: ${await res.text()}`);
  return res.json();
}

function scoreTweet(text: string): number {
  const lower = text.toLowerCase();
  let score = 40;

  HIGH_VALUE_KEYWORDS.forEach(kw => { if (lower.includes(kw)) score += 8; });
  LOW_VALUE_KEYWORDS.forEach(kw => { if (lower.includes(kw)) score -= 12; });

  // Boost for explicit fire-safety signals
  if (lower.includes('fire safety') || lower.includes('fire risk')) score += 20;
  if (lower.includes('planning approved') || lower.includes('planning granted')) score += 15;
  if (lower.includes('opening') || lower.includes('opening soon')) score += 10;

  return Math.min(100, Math.max(0, score));
}

export async function scrapeTwitter(): Promise<TwitterLead[]> {
  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) {
    console.warn('[twitter] X_BEARER_TOKEN not set — skipping social scrape');
    return [];
  }

  const leads: TwitterLead[] = [];
  const seenIds = new Set<string>();

  for (const query of QUERIES) {
    try {
      const result = await searchQuery(query, bearerToken);
      const users = new Map(
        (result.includes?.users ?? []).map(u => [u.id, u])
      );

      for (const tweet of result.data ?? []) {
        if (seenIds.has(tweet.id)) continue;
        seenIds.add(tweet.id);

        const score = scoreTweet(tweet.text);
        if (score < 50) continue;

        const author = users.get(tweet.author_id);

        leads.push({
          id:            `tw-${tweet.id}`,
          source:        'twitter',
          sourceLabel:   'X / Twitter',
          address:       extractLocation(tweet.text) ?? 'Scotland (location unconfirmed)',
          proposal:      `@${author?.username ?? 'unknown'}: "${tweet.text}"`,
          score,
          flags:         extractFlags(tweet.text),
          date:          tweet.created_at.slice(0, 10),
          status:        'new',
          contact:       author ? {
            director: `@${author.username}`,
            email:    null,
            phone:    null,
            website:  null,
          } : null,
          ref:           `TW-${tweet.id.slice(-8)}`,
          tweetId:       tweet.id,
          tweetUrl:      `https://x.com/i/web/status/${tweet.id}`,
          authorHandle:  author?.username ?? '',
          authorName:    author?.name ?? '',
          likeCount:     tweet.public_metrics.like_count,
          retweetCount:  tweet.public_metrics.retweet_count,
        });
      }
    } catch (err) {
      console.error(`[twitter] Query failed: ${query}`, err);
    }

    // Respect rate limits — small pause between queries
    await new Promise(r => setTimeout(r, 1200));
  }

  return leads.sort((a, b) => b.score - a.score);
}

function extractLocation(text: string): string | null {
  const towns = ['Glasgow', 'Edinburgh', 'Stirling', 'Ayr', 'Paisley', 'Falkirk', 'Motherwell',
    'Hamilton', 'Irvine', 'Kilmarnock', 'Clydebank', 'Linlithgow', 'Inverness'];
  for (const t of towns) {
    if (text.includes(t)) return t;
  }
  return null;
}

function extractFlags(text: string): string[] {
  const lower = text.toLowerCase();
  const flags: string[] = [];
  if (lower.includes('hotel'))          flags.push('hotel');
  if (lower.includes('restaurant') || lower.includes('café') || lower.includes('cafe') || lower.includes('bar') || lower.includes('pub')) flags.push('food-and-drink');
  if (lower.includes('gym') || lower.includes('leisure')) flags.push('sports-leisure');
  if (lower.includes('care home'))      flags.push('care-home');
  if (lower.includes('warehouse'))      flags.push('warehouse');
  if (lower.includes('events') || lower.includes('market')) flags.push('events-venue');
  if (lower.includes('fit-out') || lower.includes('fit out') || lower.includes('refurb')) flags.push('refurbishment');
  if (lower.includes('new premises') || lower.includes('new location')) flags.push('new-premises');
  if (lower.includes('opening'))        flags.push('opening-soon');
  if (lower.includes('planning'))       flags.push('planning-approved');
  return flags.length ? flags : ['social-signal'];
}
