# MacFire AI Lead Scout Dashboard

Static Supabase-backed dashboard for the MacFire lead scout.

## Purpose

This repo is the standalone public dashboard for MacFire's lead-generation system. It reads lead data from Supabase and presents the highest-value opportunities, enrichment status, confidence scoring, and lead detail views.

The production data pipeline itself now lives in:

- `jonathanmccrimmond/macfire-production`

This dashboard repo should stay separate from `macfire-production`.

## Current State

Recent dashboard features already present:

- Lead detail drawer
- Shareable URLs for filters and individual leads
- Street View image panel
- Director appointment history
- Website auto-detection signals
- Google Maps / Places / Street View enrichment display
- Four-dimension confidence scoring
- Social scraper support modules for Facebook, X, LinkedIn, and Instagram
- Production social evidence display for `social_evidence`, `social_summary`, and checked platforms

## Files

- `index.html` - main static dashboard UI and client-side logic
- `config.js.example` - example Supabase config
- `config.js` - local/live config if present
- `src/scrapers/social/` - social scraping experiments/support code for Facebook, X, LinkedIn, and Instagram

## Run

Open `index.html` directly or serve the repo root:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Current Instruction From User

AI Lead Scout is active again. The priority is to restore production parity with the original POC, including social enrichment from Facebook, X, LinkedIn, and Instagram, plus planning, contact discovery, re-enrichment, outreach drafts, and dashboard visibility.

The website is paused. Content Radar remains active in parallel.

## Related Repos

- Production scout pipeline: `jonathanmccrimmond/macfire-production`
- Content Radar: `jonathanmccrimmond/macfire-content-radar`
- Projects dashboard: `jonathanmccrimmond/macfire-projects-dashboard`

## Claude Notes

- Do not move this repo back into `macfire-production`.
- Do not commit Supabase service-role keys or private credentials.
- Keep this dashboard client-side unless the user asks for a backend.
- Next dashboard work should start with observability, social evidence, contact discovery state, planning-application signal state, and re-enrichment queue visibility.
