import * as cheerio from 'cheerio';
import type { IdoxApplication } from './types';

const POSTCODE_RE = /\b([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})\b/i;

export interface ParsedPage {
  applications: IdoxApplication[];
  hasNextPage: boolean;
}

export function parseSearchResultsPage(html: string, portalBase: string): ParsedPage {
  const $ = cheerio.load(html);
  const applications: IdoxApplication[] = [];

  // Idox renders results as <li class="searchresult">
  $('li.searchresult').each((_i, el) => {
    const item = $(el);

    const refLink = item.find('a[id*="refVal"], h2 a, .searchResult-item-property a').first();
    const reference = refLink.text().trim() || item.find('.reference').text().trim();
    if (!reference) return;

    const detailHref = refLink.attr('href') ?? '';
    const address = item.find('p.address, .address, .searchResult-item-address').first().text().trim();
    const proposal = item.find('p.proposal, .proposal, .searchResult-item-proposal').first().text().trim();
    const appType = item.find('p.apptype, .apptype, .searchResult-item-apptype').first().text().trim();
    const validatedRaw = item.find('p.metaInfo, .validatedDate, .metaInfo').first().text();
    const validatedDate = validatedRaw.replace(/validated\s*:?\s*/i, '').trim();

    const postcodeMatch = address.match(POSTCODE_RE);

    applications.push({
      reference,
      address,
      postcode: postcodeMatch?.[1]?.replace(/\s+/, ' ').toUpperCase(),
      proposal,
      appType,
      validatedDate,
      detailUrl: detailHref ? `${portalBase}${detailHref}` : undefined,
    });
  });

  const hasNextPage = $('a.next, a[title="Next page"], .nextPage a').length > 0;

  return { applications, hasNextPage };
}

export function parseWeekOptions(html: string): Array<{ value: string; label: string }> {
  const $ = cheerio.load(html);
  const options: Array<{ value: string; label: string }> = [];

  $('select[name="week"] option, select[name="weekDate"] option, select[name="selectedWeek"] option').each(
    (_i, el) => {
      const value = $(el).attr('value') ?? '';
      const label = $(el).text().trim();
      if (value) options.push({ value, label });
    }
  );

  return options;
}
