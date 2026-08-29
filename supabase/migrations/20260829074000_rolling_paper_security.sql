-- 4인분: 롤링 페이퍼 수신함 공개 시점과 익명성 보강

-- 테이블 직접 조회에서는 발신자가 본인이 작성한 원문만 확인할 수 있습니다.
-- 수신자는 아래 RPC를 통해 파티 종료 후 마스킹된 결과만 조회합니다.
drop policy if exists "members read rolling messages" on public.rolling_messages;
drop policy if exists "senders read own rolling messages" on public.rolling_messages;
create policy "senders read own rolling messages"
  on public.rolling_messages for select to authenticated
  using (sender_id = auth.uid());

drop function if exists public.list_received_rolling_messages(uuid);
create function public.list_received_rolling_messages(target_party_id uuid)
returns table (
  id uuid,
  party_id uuid,
  sender_id uuid,
  sender_name text,
  receiver_id uuid,
  receiver_name text,
  body text,
  is_anonymous boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    message.id,
    message.party_id,
    case when message.is_anonymous then null::uuid else message.sender_id end,
    case when message.is_anonymous then '익명의 파티원' else sender.name end,
    message.receiver_id,
    receiver.name,
    message.body,
    message.is_anonymous,
    message.created_at
  from public.rolling_messages message
  join public.parties party on party.id = message.party_id
  join public.profiles sender on sender.id = message.sender_id
  join public.profiles receiver on receiver.id = message.receiver_id
  where message.party_id = target_party_id
    and message.receiver_id = auth.uid()
    and party.status = 'ENDED'
  order by message.created_at desc;
$$;

revoke all on function public.list_received_rolling_messages(uuid) from public;
grant execute on function public.list_received_rolling_messages(uuid) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rolling_messages'
  ) then
    alter publication supabase_realtime add table public.rolling_messages;
  end if;
end $$;
