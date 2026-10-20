-- 스쿼드 저장 (docs/PLAN.md §6·§7 스쿼드 빌더)
--
-- 빌더는 전 쿼터를 화면에서 고친 뒤 한 번에 저장한다. 쿼터를 하나씩 저장하면 중간에
-- 실패했을 때 반쯤 바뀐 스쿼드가 남는다. 그래서 지우고 다시 넣는 일을 함수 하나(한 트랜잭션)로 한다.
--
-- quarters 모양:
--   [{ "number": 1, "formation_name": "4-3-3",
--      "slots": [{ "slot_index": 0, "position": "GK", "x": 50, "y": 92, "member_id": "…" | null }, …] }, …]

create function public.save_squad(target uuid, quarters jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  quarter_limit smallint;
  item jsonb;
  saved_quarter uuid;
begin
  if not public.is_admin() then
    raise exception 'only managers can save squads' using errcode = '42501';
  end if;

  select quarter_count into quarter_limit from public.matches where id = target;
  if not found then
    raise exception 'match not found' using errcode = 'P0002';
  end if;
  if jsonb_typeof(quarters) is distinct from 'array' then
    raise exception 'quarters must be an array' using errcode = '22023';
  end if;

  delete from public.quarters where match_id = target;

  for item in select value from jsonb_array_elements(quarters) loop
    if (item ->> 'number')::int not between 1 and quarter_limit then
      raise exception 'quarter number out of range' using errcode = '22023';
    end if;

    insert into public.quarters (match_id, number, formation_name)
    values (target, (item ->> 'number')::smallint, item ->> 'formation_name')
    returning id into saved_quarter;

    insert into public.quarter_slots (quarter_id, slot_index, position, x, y, member_id)
    select saved_quarter,
           (slot ->> 'slot_index')::smallint,
           (slot ->> 'position')::public.player_position,
           (slot ->> 'x')::real,
           (slot ->> 'y')::real,
           nullif(slot ->> 'member_id', '')::uuid
      from jsonb_array_elements(item -> 'slots') as slot;
  end loop;
end
$$;

revoke execute on function public.save_squad(uuid, jsonb) from public, anon;
grant execute on function public.save_squad(uuid, jsonb) to authenticated;
