-- BeatTheIce MVP schema
-- Supabase Dashboard > SQL Editor에서 전체 파일을 한 번 실행합니다.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 30),
  mbti text check (mbti is null or char_length(mbti) = 4),
  intro text not null default '' check (char_length(intro) <= 120),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.parties (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '',
  join_code text not null unique check (char_length(join_code) between 4 and 12),
  status text not null default 'READY' check (status in ('READY', 'ACTIVE', 'ENDED')),
  starts_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.party_members (
  party_id uuid not null references public.parties(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'GUEST' check (role in ('HOST', 'GUEST')),
  joined_at timestamptz not null default now(),
  primary key (party_id, profile_id)
);

create table if not exists public.host_messages (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.parties(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'GENERAL' check (type in ('GENERAL', 'MISSION', 'RESULT')),
  title text not null default '',
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.parties(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  description text not null default '',
  reward text not null default '',
  status text not null default 'DRAFT' check (
    status in ('DRAFT', 'ACTIVE', 'JUDGING', 'ANNOUNCED', 'CANCELLED')
  ),
  deadline_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mission_submissions (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  content text not null default '' check (char_length(content) <= 1000),
  status text not null default 'SUBMITTED' check (
    status in ('SUBMITTED', 'APPROVED', 'REJECTED')
  ),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mission_id, profile_id)
);

create table if not exists public.rolling_messages (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.parties(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);

create index if not exists party_members_profile_idx
  on public.party_members(profile_id);
create index if not exists host_messages_party_created_idx
  on public.host_messages(party_id, created_at desc);
create index if not exists missions_party_created_idx
  on public.missions(party_id, created_at desc);
create index if not exists mission_submissions_mission_idx
  on public.mission_submissions(mission_id);
create index if not exists rolling_messages_receiver_idx
  on public.rolling_messages(receiver_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.parties enable row level security;
alter table public.party_members enable row level security;
alter table public.host_messages enable row level security;
alter table public.missions enable row level security;
alter table public.mission_submissions enable row level security;
alter table public.rolling_messages enable row level security;

create or replace function public.is_party_host(target_party_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.parties
    where id = target_party_id and host_id = auth.uid()
  );
$$;

create or replace function public.is_party_member(target_party_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_party_host(target_party_id) or exists (
    select 1 from public.party_members
    where party_id = target_party_id and profile_id = auth.uid()
  );
$$;

revoke all on function public.is_party_host(uuid) from public;
revoke all on function public.is_party_member(uuid) from public;
grant execute on function public.is_party_host(uuid) to authenticated;
grant execute on function public.is_party_member(uuid) to authenticated;

drop policy if exists "profiles visible to signed in users" on public.profiles;
create policy "profiles visible to signed in users"
  on public.profiles for select to authenticated using (true);
drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
  on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "members read parties" on public.parties;
create policy "members read parties"
  on public.parties for select to authenticated
  using (public.is_party_member(id));
drop policy if exists "hosts create parties" on public.parties;
create policy "hosts create parties"
  on public.parties for insert to authenticated with check (host_id = auth.uid());
drop policy if exists "hosts update parties" on public.parties;
create policy "hosts update parties"
  on public.parties for update to authenticated
  using (host_id = auth.uid()) with check (host_id = auth.uid());

drop policy if exists "members read party memberships" on public.party_members;
create policy "members read party memberships"
  on public.party_members for select to authenticated
  using (public.is_party_member(party_id));
drop policy if exists "users join parties" on public.party_members;
create policy "users join parties"
  on public.party_members for insert to authenticated with check (
    profile_id = auth.uid() and role = 'GUEST'
  );
drop policy if exists "hosts add memberships" on public.party_members;
create policy "hosts add memberships"
  on public.party_members for insert to authenticated with check (
    public.is_party_host(party_id)
  );

drop policy if exists "members read host messages" on public.host_messages;
create policy "members read host messages"
  on public.host_messages for select to authenticated
  using (public.is_party_member(party_id));
drop policy if exists "hosts create messages" on public.host_messages;
create policy "hosts create messages"
  on public.host_messages for insert to authenticated with check (
    author_id = auth.uid()
    and public.is_party_host(party_id)
  );

drop policy if exists "members read missions" on public.missions;
create policy "members read missions"
  on public.missions for select to authenticated
  using (public.is_party_member(party_id));
drop policy if exists "hosts create missions" on public.missions;
create policy "hosts create missions"
  on public.missions for insert to authenticated with check (
    creator_id = auth.uid()
    and public.is_party_host(party_id)
  );
drop policy if exists "hosts update missions" on public.missions;
create policy "hosts update missions"
  on public.missions for update to authenticated
  using (public.is_party_host(party_id));

drop policy if exists "members read mission submissions" on public.mission_submissions;
create policy "members read mission submissions"
  on public.mission_submissions for select to authenticated using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.missions m
      join public.parties p on p.id = m.party_id
      where m.id = mission_submissions.mission_id and p.host_id = auth.uid()
    )
  );
drop policy if exists "guests submit missions" on public.mission_submissions;
create policy "guests submit missions"
  on public.mission_submissions for insert to authenticated with check (
    profile_id = auth.uid()
    and exists (
      select 1 from public.missions m
      join public.party_members pm on pm.party_id = m.party_id
      where m.id = mission_submissions.mission_id
        and m.status = 'ACTIVE'
        and pm.profile_id = auth.uid()
    )
  );
drop policy if exists "hosts judge submissions" on public.mission_submissions;
create policy "hosts judge submissions"
  on public.mission_submissions for update to authenticated using (
    exists (
      select 1 from public.missions m
      join public.parties p on p.id = m.party_id
      where m.id = mission_submissions.mission_id and p.host_id = auth.uid()
    )
  );

drop policy if exists "members read rolling messages" on public.rolling_messages;
create policy "members read rolling messages"
  on public.rolling_messages for select to authenticated using (
    sender_id = auth.uid() or receiver_id = auth.uid()
  );
drop policy if exists "members create rolling messages" on public.rolling_messages;
create policy "members create rolling messages"
  on public.rolling_messages for insert to authenticated with check (
    sender_id = auth.uid()
    and sender_id <> receiver_id
    and exists (
      select 1 from public.party_members sender
      join public.party_members receiver
        on receiver.party_id = sender.party_id
      where sender.party_id = rolling_messages.party_id
        and sender.profile_id = auth.uid()
        and receiver.profile_id = rolling_messages.receiver_id
    )
  );

-- 실시간 구독 대상 등록. 이미 등록된 테이블은 건너뜁니다.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'host_messages',
    'missions',
    'mission_submissions'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;
