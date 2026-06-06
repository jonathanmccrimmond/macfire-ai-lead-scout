import axios from 'axios';
import { parseSearchResultsPage, parseWeekOptions } from './parse';
import type { IdoxApplication } from './types';

export async function scrapeIdoxWeeklyList(
  portalBase: string,
  councilName: string
): Promise<IdoxApplication[]> {
  const http = axios.create({
    baseURL: portalBase,
    headers: {
      'User-Agent': 'MacFire-LeadScout/1.0 (automated planning data aggregation)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    maxRedirects: 5,
    timeout: 30_000,
  });

  // Step 1: load the weekly-list form to get session cookie + available weeks
  const formPage = await http.get('/search.do', {
    params: { action: 'weeklyList' },
  });

  const cookies = extractCookies(formPage.headers['set-cookie'] ?? []);
  const weeks = parseWeekOptions(formPage.data as string);

  if (weeks.length === 0) {
    throw new Error(`[${councilName}] No week options found — selectors may need updating`);
  }

  const currentWeek = weeks[0].value;
  console.log(`[${councilName}] Scraping week: ${weeks[0].label} (${currentWeek})`);

  // Step 2: POST the form for the most recent week
  const searchResponse = await http.post(
    '/search.do?action=weeklyList',
    new URLSearchParams({
      week: currentWeek,
      dateType: 'W',
      searchType: 'Application',
    }).toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies,
        'Referer': `${portalBase}/search.do?action=weeklyList`,
      },
    }
  );

  // Step 3: paginate through all results
  const all: IdoxApplication[] = [];
  let html = searchResponse.data as string;
  let page = 1;

  while (true) {
    const { applications, hasNextPage } = parseSearchResultsPage(html, portalBase);
    all.push(...applications);
    console.log(`[${councilName}] Page ${page}: ${applications.length} applications`);

    if (!hasNextPage) break;

    page++;
    const next = await http.get('/pagedSearchResults.do', {
      params: { action: 'page', page: String(page), orderBy: 'DateReceived', orderByDirection: 'DESC' },
      headers: { 'Cookie': cookies },
    });
    html = next.data as string;
  }

  console.log(`[${councilName}] Total: ${all.length} applications`);
  return all;
}

function extractCookies(setCookieHeaders: string[]): string {
  return setCookieHeaders.map(h => h.split(';')[0]).join('; ');
}
