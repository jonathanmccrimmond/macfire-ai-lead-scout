# MacFire AI Lead Scout — Repo Context

## What this repo is (and is not)

This public repo contains the **lead dashboard front-end only**:

- `index.html` — the live lead dashboard, served via GitHub Pages at
  https://jonathanmccrimmond.github.io/macfire-ai-lead-scout/
- `config.js` — Supabase connection config (anon key, read paths)
- `src/scrapers/social/` — social enrichment scraper stubs

The **scout pipeline itself is NOT in this repo**. The runner, schema, and
migration tooling live in Jonathan's local workspace on his Mac:

- `scout/runner.py` — the production scout runner
- `supabase/schema.sql` — production database schema
- Notion-to-Supabase migration script (443 cleaned leads, run with `--apply`)

If you are an agent picking up this project and cannot find those files,
that is why. Ask for the local workspace or work against Supabase directly.

## Architecture (production design, June 2026)

- GitHub Actions server-side runner replaces the old laptop launchd setup
- Daily cron: Companies House new incorporations
- Weekly cron: council planning applications
- Both write directly into Supabase `public.leads`
- The dashboard in this repo reads from Supabase

## Current status

- Dashboard live, reading Supabase, with lead detail drawer, shareable
  lead URLs, Street View, confidence breakdown, director appointment
  history and website signal detection
- Notion export complete: 483 leads exported, 15 missing-CH-number pages
  and 25 duplicates archived, 443 active leads cleaned and ready to import
- Production next steps, in order:
  1. Apply `supabase/schema.sql` in the Supabase SQL editor, then run the
     migration script with `--apply` to import the 443 leads
  2. Port the Companies House signal to `scout/runner.py` and dry-run
     locally against the Supabase leads table
  3. Set up the GitHub Actions daily workflow with repo secrets for the
     first live server-side run
- Once Supabase is live, retire the old Notion AI Scout workspace so there
  is a single source of truth

## Related

- Projects dashboard (status, wins, next steps in plain English):
  https://github.com/jonathanmccrimmond/macfire-projects-dashboard
  After meaningful work here, update its `data/projects.js` following the
  writing style rules in its CLAUDE.md
- Info deck: canonical copy on Google Drive
  (file ID `1vZx67rB0DllHKJ5NHOMATL9y94_SGmV4`) — do not regenerate from
  local builders without checking Drive first
