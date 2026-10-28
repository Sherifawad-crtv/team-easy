-- A/B test events for Team Easy. Run in a NEW Supabase project (not Nimble, not Bizqwik).
-- The browser uses the public anon key. It can insert events and read aggregates only.

create table if not exists public.ab_events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  visitor_id  text not null check (char_length(visitor_id) <= 64),
  session_id  text not null check (char_length(session_id) <= 64),
  event       text not null check (char_length(event) <= 40),
  variants    jsonb not null default '{}'::jsonb,
  props       jsonb not null default '{}'::jsonb
);

create index if not exists ab_events_created_idx on public.ab_events (created_at);
create index if not exists ab_events_event_idx on public.ab_events (event);

alter table public.ab_events enable row level security;

-- Anyone can add an event. Nobody can read, change or delete rows through the API.
create policy "anyone can insert events"
  on public.ab_events for insert
  to anon, authenticated
  with check (
    pg_column_size(props) < 2048
    and pg_column_size(variants) < 512
  );

-- Aggregate results per experiment and variant. Matches summarize() in src/experiments/summary.ts:
-- visitors counted once, time-to-open uses the first chat opened after the list loads.
create or replace function public.ab_summary()
returns table (
  experiment text,
  variant text,
  visitors bigint,
  opens bigint,
  messages bigint,
  avg_ms_to_first_open numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with exp as (
    select * from (values
      ('chat_list', 'chat_opened'),
      ('conversation', 'chat_opened'),
      ('group_nav', 'group_opened')
    ) as t(experiment, open_event)
  ),
  ev as (
    select e.experiment, e.open_event, a.variants ->> e.experiment as variant, a.visitor_id, a.event, a.props
    from public.ab_events a
    cross join exp e
    where a.variants ? e.experiment
  )
  select
    experiment,
    variant,
    count(distinct visitor_id) as visitors,
    count(*) filter (where event = open_event) as opens,
    count(*) filter (where event = 'message_sent') as messages,
    round(avg((props ->> 'ms_since_list')::numeric)
      filter (where event = open_event and props ->> 'first' = 'true'
              and props ->> 'ms_since_list' is not null)) as avg_ms_to_first_open
  from ev
  group by experiment, variant
  order by experiment, variant;
$$;

revoke all on function public.ab_summary() from public;
grant execute on function public.ab_summary() to anon, authenticated;
