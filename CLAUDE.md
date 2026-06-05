# MacFire AI Lead Scout — Repo Context

For full project context (client, decisions, architecture) see `CLAUDE.md` in `jonathanmccrimmond/macfire-projects-dashboard` (branch `claude/macfire-lead-scout-setup-FIVfH`).

---

## What this repo does

Weekly automated pipeline that finds commercial businesses needing fire protection before competitors reach them. Runs on GitHub Actions every Monday.

Sources (Phase 1):
- Glasgow City Council planning applications (Idox Public Access)

Sources (Phase 2, not yet built):
- Companies House new incorporations (target SIC codes, Scottish postcodes)
- Remaining 9 Central Scotland councils (East Renfrewshire first priority)

---

## Architecture

```
src/
  db/           Supabase client + TypeScript schema types
  scrapers/
    idox/       HTML scraper for Idox Public Access portals
  classifiers/  Fire-risk scoring (regex + Claude Haiku fallback)
  signals/      Signal abstraction — each source is a Signal class
  email/        Weekly digest via Resend
  index.ts      Entry point — runs all signals, sends digest

supabase/
  schema.sql    Run this once in Supabase SQL editor to create tables

.github/workflows/weekly-scout.yml   Monday 08:00 UTC cron
```

---

## Running locally

```
npm install
cp .env.example .env   # fill in secrets
npm start
```

## Required secrets (GitHub Actions + .env)

| Variable | Where to get it |
|---|---|
| SUPABASE_URL | Supabase project settings |
| SUPABASE_SERVICE_KEY | Supabase project settings (service role key) |
| ANTHROPIC_API_KEY | console.anthropic.com |
| RESEND_API_KEY | resend.com dashboard |
| DOUGIE_EMAIL | dougie's email address |

Add to GitHub: Settings > Secrets and variables > Actions.

---

## Supabase setup

Create a free project at supabase.com, then run `supabase/schema.sql` in the SQL editor.

---

## State as of session 2026-06-05

- Scaffold committed, not yet tested against live Glasgow Idox portal
- Glasgow scraper may need selector tweaks once run against the live HTML
- Companies House signal not yet built
- No Supabase project created yet (needs SUPABASE_URL)
- No secrets added to GitHub Actions yet

## Immediate next steps

1. Create Supabase project, run schema.sql, add secrets to GitHub
2. Trigger workflow manually (workflow_dispatch) and check logs
3. If scraper fails, fetch the Glasgow Idox weekly-list HTML and adjust selectors in `src/scrapers/idox/parse.ts`
4. Build Companies House signal
5. Add East Renfrewshire council scraper
