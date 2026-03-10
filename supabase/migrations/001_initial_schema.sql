-- Events table
create table public.events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  sport_type text not null,
  date_time timestamptz not null,
  description text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Event venues table (many venues per event)
create table public.event_venues (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  name text not null,
  address text,
  created_at timestamptz default now() not null
);

-- Indexes
create index events_user_id_idx on public.events(user_id);
create index events_sport_type_idx on public.events(sport_type);
create index event_venues_event_id_idx on public.event_venues(event_id);

-- Enable RLS
alter table public.events enable row level security;
alter table public.event_venues enable row level security;

-- RLS policies for events
create policy "Users can view their own events"
  on public.events for select
  using (auth.uid() = user_id);

create policy "Users can create their own events"
  on public.events for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own events"
  on public.events for update
  using (auth.uid() = user_id);

create policy "Users can delete their own events"
  on public.events for delete
  using (auth.uid() = user_id);

-- RLS policies for event_venues (based on event ownership)
create policy "Users can view venues for their events"
  on public.event_venues for select
  using (
    exists (
      select 1 from public.events
      where events.id = event_venues.event_id
      and events.user_id = auth.uid()
    )
  );

create policy "Users can create venues for their events"
  on public.event_venues for insert
  with check (
    exists (
      select 1 from public.events
      where events.id = event_venues.event_id
      and events.user_id = auth.uid()
    )
  );

create policy "Users can update venues for their events"
  on public.event_venues for update
  using (
    exists (
      select 1 from public.events
      where events.id = event_venues.event_id
      and events.user_id = auth.uid()
    )
  );

create policy "Users can delete venues for their events"
  on public.event_venues for delete
  using (
    exists (
      select 1 from public.events
      where events.id = event_venues.event_id
      and events.user_id = auth.uid()
    )
  );

-- Function to auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_events_updated
  before update on public.events
  for each row
  execute function public.handle_updated_at();
