# macfire-ai-lead-scout

Public dashboard front-end for MacFire AI Lead Scout. Static HTML, hosted on GitHub Pages, reads from Supabase.

Live: https://kinact-ai.github.io/macfire-ai-lead-scout/

## What's in this repo

- `index.html` — single-file dashboard (HTML + CSS + JS, no build step)
- `config.js` — Supabase project URL and anon key for the dashboard
- `src/scrapers/social/` — social enrichment scraper stubs

The scout pipeline (Companies House signal, Google Places enrichment, planning applications, director history, re-enrichment queue, the daily GitHub Actions runner, the Supabase schema and migrations) lives in the **macfire-production** repo. See `CLAUDE.md` for the split.

## Dashboard features

- Five working tabs plus a dedicated Not Relevant tab with one-click restore to the queue
- Sticky filter toolbar: search, status, priority, queue, sort
- Sector quick-filter chips above the toolbar (top 8 by lead count)
- Saved views: name a filter combination, restore later (browser localStorage)
- Clear-all button to reset every filter at once
- URL state mirror: every filter (and the open lead) is in the query string, so any view is bookmarkable and shareable
- Lead detail drawer: click a lead for a Street View image, full Maps link, P/O/C/R confidence grid, director appointment history, web signals, scout reasoning
- Latest-run chip in the header (run date, lead count, High/Medium/Low breakdown)

## Local preview

```bash
python3 -m http.server 4173
# then open http://localhost:4173
```

You will need a Supabase URL and anon key. The first time you load the dashboard with no config, a setup card lets you paste them in (stored in localStorage, never committed).

## Maintenance

After any meaningful change to `index.html`:

1. Push to `main`. GitHub Pages picks it up within ~1 minute.
2. Update `data/projects.js` in the macfire-projects-dashboard repo with a one-line entry in `recentWins` for the AI Lead Scout project.
3. Writing-style rule: never use em dashes in user-visible copy.
