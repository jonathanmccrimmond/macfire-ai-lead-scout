// Thin wrapper kept for backwards compatibility.
// The pipeline now uses scrapeIdoxWeeklyList() from ./client with council config from ./councils.
import { scrapeIdoxWeeklyList } from './client';

export async function scrapeGlasgowWeeklyList() {
  return scrapeIdoxWeeklyList('https://publicaccess.glasgow.gov.uk/online-applications', 'glasgow');
}
