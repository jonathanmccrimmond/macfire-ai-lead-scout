# MacFire AI Lead Scout Agent Log

## 2026-06-09 - Claude handoff note

### Current Repo Purpose

This is the standalone static dashboard for MacFire AI Lead Scout. It should stay separate from `macfire-production`.

The production scraper/enrichment pipeline lives in:

- `jonathanmccrimmond/macfire-production`

### Current User Direction

The user has resumed AI Scout work. Active priorities are:

- restore production parity with the original POC
- include Facebook, X, LinkedIn, and Instagram social enrichment
- bring planning, contact discovery, re-enrichment, outreach drafts, and dashboard visibility forward
- keep Content Radar active in parallel
- keep the website paused

### Existing Dashboard Direction For Later

If the user returns to Lead Scout dashboard work, likely next areas are:

- run observability from `scout_runs`
- contact discovery status
- planning applications signal status
- re-enrichment queue visibility
- clearer lead triage ergonomics

### Safety Notes

- Do not commit Supabase secrets or service-role keys.
- Do not re-nest this repo in `macfire-production`.
- Avoid committing secrets or pushing live dashboard behavior without explicit user approval.

## 2026-06-09 - Social enrichment parity note

- Added Instagram as a first-class social scraper support module alongside Facebook, X, and LinkedIn.
- Instagram uses compliant Graph API routes only: hashtag recent media and business discovery for configured usernames.
- Required env vars are `IG_ACCESS_TOKEN` and `IG_BUSINESS_ACCOUNT_ID`; optional lists are `IG_HASHTAGS` and `IG_MONITORED_USERNAMES`.
- Production pipeline now has social evidence fields and the dashboard renders `social_evidence`, `social_summary`, and `social_platforms_checked` when present.
