create or replace function public.get_occupied_room_periods()
returns table (
  room_id text,
  check_in date,
  check_out date
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  select r.room_id, r.check_in, r.check_out
    from public.reservations as r
   where r.status in ('pending', 'confirmed')
     and r.check_out > current_date
   order by r.room_id, r.check_in, r.check_out;
$function$;

revoke all on function public.get_occupied_room_periods()
  from public, anon, authenticated;
grant execute on function public.get_occupied_room_periods()
  to anon, authenticated;

notify pgrst, 'reload schema';