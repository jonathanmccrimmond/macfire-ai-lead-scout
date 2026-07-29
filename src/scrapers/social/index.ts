/**
 * Social media scraper entry point
 *
 * Runs all three social scrapers (X/Twitter, LinkedIn, Facebook) and returns
 * a unified list of leads sorted by score descending.
 *
 * Called from the main pipeline after planning portal and Companies House runs.
 *
 * Required env vars (each scraper will warn and return [] if its token is missing):
 *   X_BEARER_TOKEN         — X / Twitter API v2 bearer token
 *   LINKEDIN_ACCESS_TOKEN  — LinkedIn OAuth 2 access token
 *   FB_ACCESS_TOKEN        — Facebook Graph API access token
 */

export interface LeadContact {
  director: string | null;
  email:    string | null;
  phone:    string | null;
  website:  string | null;
}

export interface SocialLead {
  id:          string;
  source:      'twitter' | 'linkedin' | 'facebook';
  sourceLabel: string;
  address:     string;
  proposal:    string;
  score:       number;
  flags:       string[];
  date:        string;     // YYYY-MM-DD
  status:      'new' | 'contacted' | 'won' | 'dead';
  contact:     LeadContact | null;
  ref:         string;
}

import { scrapeTwitter }  from './twitter';
import { scrapeLinkedIn } from './linkedin';
import { scrapeFacebook } from './facebook';

export async function runSocialScrape(): Promise<SocialLead[]> {
  console.log('[social] Starting social media scrape...');

  const [twitterLeads, linkedInLeads, facebookLeads] = await Promise.allSettled([
    scrapeTwitter(),
    scrapeLinkedIn(),
    scrapeFacebook(),
  ]);

  const collect = (result: PromiseSettledResult<SocialLead[]>, name: string): SocialLead[] => {
    if (result.status === 'fulfilled') {
      console.log(`[social] ${name}: ${result.value.length} leads`);
      return result.value;
    }
    console.error(`[social] ${name} scrape failed:`, result.reason);
    return [];
  };

  const all = [
    ...collect(twitterLeads,  'Twitter/X'),
    ...collect(linkedInLeads, 'LinkedIn'),
    ...collect(facebookLeads, 'Facebook'),
  ].sort((a, b) => b.score - a.score);

  console.log(`[social] Total social leads: ${all.length}`);
  return all;
}
