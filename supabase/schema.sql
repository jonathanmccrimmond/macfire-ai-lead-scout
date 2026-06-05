-- Run once in the Supabase SQL editor to create the required tables.

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

create table if not exists raw_applications (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  run_id uuid references pipeline_runs(id) on delete cascade,
  source text not null check (source in ('planning', 'companies_house')),
  council text,
  reference text not null,
  address text not null,
  postcode text,
  proposal text,
  app_type text,
  validated_date text,
  raw_data jsonb not null default '{}'
);

create table if not exists leads (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  raw_application_id uuid references raw_applications(id),
  source text not null,
  address text not null,
  postcode text,
  description text,
  score int not null check (score >= 0 and score <= 100),
  flags text[] not null default '{}',
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  status text not null default 'new' check (status in ('new', 'contacted', 'won', 'dead'))
);
