-- Style Quiz persistence: one row per consumer capturing their selected
-- style tags from the post-signup mood-board quiz (screens/StyleQuizScreen.tsx).
--
-- Naming matches existing tables (profiles/likes/saves/follows): snake_case,
-- `user_id` referencing auth.users, `created_at`/`updated_at` timestamptz.
--
-- NOTE: this migration was written by an agent without access to the live
-- Supabase project. It has NOT been applied. Apply manually via the
-- Supabase SQL editor or `supabase db push` before shipping the StyleQuiz
-- persistence code that depends on it.

create table if not exists public.user_style_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  style_tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_style_preferences_user_id_key unique (user_id)
);

create index if not exists user_style_preferences_user_id_idx
  on public.user_style_preferences (user_id);

-- Keep updated_at current on every upsert.
create or replace function public.set_user_style_preferences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_style_preferences_set_updated_at on public.user_style_preferences;
create trigger user_style_preferences_set_updated_at
  before update on public.user_style_preferences
  for each row
  execute function public.set_user_style_preferences_updated_at();

alter table public.user_style_preferences enable row level security;

-- A user can only read/write their own style preferences row.
drop policy if exists "Users can view own style preferences" on public.user_style_preferences;
create policy "Users can view own style preferences"
  on public.user_style_preferences
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can upsert own style preferences" on public.user_style_preferences;
create policy "Users can upsert own style preferences"
  on public.user_style_preferences
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own style preferences" on public.user_style_preferences;
create policy "Users can update own style preferences"
  on public.user_style_preferences
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
