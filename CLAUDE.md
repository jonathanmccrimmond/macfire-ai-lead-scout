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

- Dashboard live, reading Supabase, with:
  - Lead detail drawer (Street View image, 4-dimension confidence
    breakdown, director + appointment history, web signals)
  - URL-shareable filters (q, status, priority, queue, sort, sector) and
    individual leads (?lead=uuid auto-opens the drawer)
  - Sticky filter toolbar with status, priority, queue and sort controls
  - Sector quick-filter chip strip (top 8 sectors by lead count)
  - Saved views: name a filter snapshot, restore from a dropdown
    (persisted in browser localStorage)
  - Not Relevant tab with one-click "Add back to queue" action
  - Latest-run chip in the header (run date + lead count + priority breakdown)
- 443 leads imported from the Notion source of truth
- Production scout pipeline (in `macfire-production` repo): Companies
  House signal + Google Places + Street View + 4-dimension confidence +
  website auto-detection + director appointment history + planning
  applications signal + re-enrichment queue.

## Dashboard rules

- This is a public repo. **Never check in secrets.** `config.js` ships
  with the Supabase anon key only; the service-role key belongs in the
  `macfire-production` repo's GitHub Actions secrets.
- Outreach email templates are embedded in both dashboard copies:
  `index.html` and `dashboard-v2.html`, in the `EMAIL_TEMPLATES` object.
  They mirror the canonical Google Drive doc named
  `MacFireOutreachEmailTemplates` (updated 24 June 2026), with final
  sales-copy refinements agreed on 28 June 2026. Keep both dashboard
  copies, `outreach-email-templates.md`, and
  `outreach-template-preview.html` in sync when changing them.
  The current approved approach is: warm, plain, credible, email-first,
  no manual signature, no em dashes, no "Dougie" (use Douglas only if a
  name is needed), and no claim that the premises is brand new. The
  company is newly registered, but the business/premises may be an existing
  place under new ownership. Use wording like "I saw [Company] has
  recently been registered" plus "Whether this is a new site or an existing
  place under new ownership..." where that nuance matters. If working
  from Jonathan's local `MacFire Production` workspace, also check any
  root-level `gh_pages_dashboard.html` snapshot, because older snapshots
  may still build drafts from Supabase's stale `email_draft` field.
- After any meaningful change to `index.html`, push to `main` (GH Pages
  picks it up automatically), then update the macfire-projects-dashboard
  data file with a plain-English line in `recentWins`.
- Writing style: never use em dashes in user-visible copy (use comma,
  period, parentheses or colon instead). This applies to subtitle,
  labels, and any text you put in the UI.

## Related

- Projects dashboard (status, wins, next steps in plain English):
  https://github.com/jonathanmccrimmond/macfire-projects-dashboard
  After meaningful work here, update its `data/projects.js` following the
  writing style rules in its CLAUDE.md
- Info deck: canonical copy on Google Drive
  (file ID `1vZx67rB0DllHKJ5NHOMATL9y94_SGmV4`) — do not regenerate from
  local builders without checking Drive first
