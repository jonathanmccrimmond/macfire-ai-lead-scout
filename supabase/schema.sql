-- MacFire AI Lead Scout — Supabase schema
-- Run once in the Supabase SQL editor.
-- Safe to re-run: all statements use IF NOT EXISTS / IF NOT EXISTS guards.

-- ── pipeline_runs ─────────────────────────────────────────────────────────────

create table if not exists pipeline_runs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  source text not null,
  council text,
  records_fetched int not null default 0,
  records_classified int not null default 0,
  status text not null check (status in ('success', 'error')),
  error_message text
);

-- ── raw_applications ──────────────────────────────────────────────────────────
-- Stores raw data from both planning portals and Companies House.
-- Planning-specific fields: reference, proposal, app_type, validated_date
-- CH-specific fields: company_number, company_name, company_status, company_type,
--   sic_codes, incorporated_date, director_name, director_count,
--   total_appointments, dissolved_count

create table if not exists raw_applications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  run_id uuid references pipeline_runs(id) on delete cascade,
  source text not null check (source in ('planning', 'companies_house')),
  council text,
  -- Planning fields
  reference text,
  address text not null,
  postcode text,
  proposal text,
  app_type text,
  validated_date text,
  -- Companies House fields
  company_number text,
  company_name text,
  company_status text,
  company_type text,
  sic_codes text[],
  incorporated_date text,
  director_name text,
  director_count int,
  total_appointments int,
  dissolved_count int,
  -- Full raw payload
  raw_data jsonb not null default '{}'
);

create index if not exists raw_applications_company_number_idx
  on raw_applications (company_number)
  where company_number is not null;

-- ── leads ─────────────────────────────────────────────────────────────────────
-- Unified lead record for both planning and CH signals.
-- company_number is used for CH dedup (not unique constraint — handled in code).

create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  raw_application_id uuid references raw_applications(id),
  source text not null,
  -- Core fields (both signals)
  address text not null,
  postcode text,
  description text,
  score int not null check (score >= 0 and score <= 100),
  flags text[] not null default '{}',
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  status text not null default 'new' check (status in ('new', 'contacted', 'won', 'dead')),
  -- CH-specific fields
  company_number text,
  company_name text,
  sector text,
  trigger text,
  director_name text,
  director_count int,
  -- Enrichment fields
  website_url text,
  website_domain text,
  email_address text,
  phone_number text,
  maps_url text,
  streetview_url text,
  places_status text,
  -- Quality signals
  email_draft text,
  reasoning text,
  -- Confidence model dimensions (0–100 each)
  premises_confidence int,
  operational_confidence int,
  compliance_confidence int,
  contactability_confidence int
);

create index if not exists leads_company_number_idx
  on leads (company_number)
  where company_number is not null;

create index if not exists leads_status_idx on leads (status);
create index if not exists leads_score_idx on leads (score desc);
create index if not exists leads_created_at_idx on leads (created_at desc);
