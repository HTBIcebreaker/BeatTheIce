-- Hackathon MVP: every anonymous browser session joins one shared live party.
create or replace function public.join_demo_party()
returns public.parties
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_party public.parties;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select * into selected_party from public.parties
  where join_code = 'DEMO-P2PQR' limit 1;

  if selected_party.id is null then
    begin
      insert into public.parties (host_id, name, description, join_code, status)
      values (auth.uid(), 'BeatTheIce Demo Party', 'Live P2P profile exchange party', 'DEMO-P2PQR', 'ACTIVE')
      returning * into selected_party;
    exception when unique_violation then
      select * into selected_party from public.parties
      where join_code = 'DEMO-P2PQR' limit 1;
    end;
  end if;

  insert into public.party_members (party_id, profile_id, role)
  values (selected_party.id, auth.uid(), case when selected_party.host_id = auth.uid() then 'HOST' else 'GUEST' end)
  on conflict (party_id, profile_id) do nothing;

  return selected_party;
end;
$$;

revoke all on function public.join_demo_party() from public;
grant execute on function public.join_demo_party() to authenticated;
