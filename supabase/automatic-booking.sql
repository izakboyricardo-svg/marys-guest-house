begin;

update public.rooms
set capacity = 2
where capacity is null;

alter table public.rooms
  alter column capacity set default 2,
  alter column capacity set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.rooms'::regclass
      and conname = 'rooms_capacity_positive'
  ) then
    alter table public.rooms
      add constraint rooms_capacity_positive check (capacity > 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.rooms'::regclass
      and conname = 'rooms_price_xof_nonnegative'
  ) then
    alter table public.rooms
      add constraint rooms_price_xof_nonnegative check (price_xof >= 0);
  end if;
end;
$$;

create table if not exists public.mgh_booking_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.mgh_booking_admins enable row level security;
revoke all on public.mgh_booking_admins from public, anon, authenticated;

insert into public.mgh_booking_admins (user_id)
values ('5a2a8c93-f305-48d6-a91f-1fac189bfbaf')
on conflict (user_id) do nothing;

create or replace function public.is_mgh_booking_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  select exists (
    select 1
    from public.mgh_booking_admins
    where user_id = auth.uid()
  );
$function$;

revoke all on function public.is_mgh_booking_admin() from public, anon;
grant execute on function public.is_mgh_booking_admin() to authenticated;

create or replace function public.set_reservation_defaults()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $function$
declare
  v_room public.rooms%rowtype;
  v_total bigint;
begin
  select *
    into v_room
    from public.rooms
   where id = new.room_id;

  if not found or not v_room.active then
    raise exception using
      errcode = '23514',
      message = 'The selected room is not active.';
  end if;

  if new.check_in < current_date or new.check_out <= new.check_in then
    raise exception using
      errcode = '22023',
      message = 'The reservation dates are invalid.';
  end if;

  if new.adults + new.children > v_room.capacity then
    raise exception using
      errcode = '23514',
      message = 'The number of guests exceeds the room capacity.';
  end if;

  v_total := v_room.price_xof::bigint * (new.check_out - new.check_in);

  if v_total > 2147483647 then
    raise exception using
      errcode = '22003',
      message = 'The reservation total exceeds the supported amount.';
  end if;

  new.reference := coalesce(
    nullif(btrim(new.reference), ''),
    'MGH-' || to_char(current_date, 'YYYYMMDD') || '-' ||
      upper(replace(gen_random_uuid()::text, '-', ''))
  );
  new.status := 'confirmed';
  new.total_xof := v_total::integer;

  return new;
end;
$function$;

create or replace function public.get_room_availability(
  p_room_id text,
  p_check_in date,
  p_check_out date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_room public.rooms%rowtype;
  v_status text;
begin
  if p_check_in is null or p_check_out is null or p_check_out <= p_check_in then
    raise exception using
      errcode = '22023',
      message = 'The requested date range is invalid.';
  end if;

  select *
    into v_room
    from public.rooms
   where id = p_room_id;

  if not found or not v_room.active or v_room.capacity is null then
    v_status := 'unavailable';
  elsif p_check_in < current_date then
    v_status := 'unavailable';
  elsif exists (
    select 1
      from public.reservations r
     where r.room_id = p_room_id
       and r.status in ('pending', 'confirmed')
       and r.check_in < p_check_out
       and r.check_out > p_check_in
  ) then
    v_status := 'occupied';
  else
    v_status := 'available';
  end if;

  return jsonb_build_object(
    'status', v_status,
    'nightly_rate_xof', v_room.price_xof,
    'capacity', v_room.capacity
  );
end;
$function$;

create or replace function public.create_confirmed_reservation(
  p_room_id text,
  p_check_in date,
  p_check_out date,
  p_adults integer,
  p_children integer,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_country text,
  p_arrival_time text,
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_room public.rooms%rowtype;
  v_nights integer;
  v_total bigint;
  v_reference text;
begin
  if p_check_in is null
     or p_check_out is null
     or p_check_in < current_date
     or p_check_out <= p_check_in then
    raise exception using
      errcode = '22023',
      message = 'The reservation dates are invalid.';
  end if;

  if p_adults is null
     or p_adults < 1
     or p_children is null
     or p_children < 0 then
    raise exception using
      errcode = '22023',
      message = 'The guest count is invalid.';
  end if;

  if nullif(btrim(p_first_name), '') is null
     or nullif(btrim(p_last_name), '') is null
     or nullif(btrim(p_phone), '') is null
     or length(p_first_name) > 100
     or length(p_last_name) > 100
     or length(coalesce(p_email, '')) > 254
     or length(p_phone) > 32
     or length(coalesce(p_country, '')) > 8
     or length(coalesce(p_notes, '')) > 2000 then
    raise exception using
      errcode = '22023',
      message = 'One or more guest details are invalid.';
  end if;

  select *
    into v_room
    from public.rooms
   where id = p_room_id
   for update;

  if not found or not v_room.active then
    raise exception using
      errcode = '23514',
      message = 'The selected room is not active.';
  end if;

  if v_room.capacity is null then
    raise exception using
      errcode = '23514',
      message = 'The selected room does not have a configured capacity.';
  end if;

  if p_adults + p_children > v_room.capacity then
    raise exception using
      errcode = '23514',
      message = 'The number of guests exceeds the room capacity.';
  end if;

  v_nights := p_check_out - p_check_in;
  v_total := v_room.price_xof::bigint * v_nights;

  if v_total > 2147483647 then
    raise exception using
      errcode = '22003',
      message = 'The reservation total exceeds the supported amount.';
  end if;

  if exists (
    select 1
      from public.reservations r
     where r.room_id = p_room_id
       and r.status in ('pending', 'confirmed')
       and r.check_in < p_check_out
       and r.check_out > p_check_in
  ) then
    raise exception using
      errcode = '23P01',
      message = 'The room is already occupied for the requested dates.';
  end if;

  v_reference :=
    'MGH-' || to_char(current_date, 'YYYYMMDD') || '-' ||
    upper(replace(gen_random_uuid()::text, '-', ''));

  insert into public.reservations (
    reference,
    room_id,
    check_in,
    check_out,
    adults,
    children,
    first_name,
    last_name,
    email,
    phone,
    country,
    arrival_time,
    notes,
    total_xof,
    status
  ) values (
    v_reference,
    p_room_id,
    p_check_in,
    p_check_out,
    p_adults,
    p_children,
    btrim(p_first_name),
    btrim(p_last_name),
    coalesce(btrim(p_email), ''),
    btrim(p_phone),
    nullif(btrim(p_country), ''),
    nullif(btrim(p_arrival_time), ''),
    nullif(btrim(p_notes), ''),
    v_total::integer,
    'confirmed'
  );

  return jsonb_build_object(
    'reference', v_reference,
    'status', 'confirmed',
    'nights', v_nights,
    'nightly_rate_xof', v_room.price_xof,
    'total_xof', v_total
  );
end;
$function$;

revoke all on function public.get_room_availability(text, date, date)
  from public, anon;
revoke all on function public.create_confirmed_reservation(
  text, date, date, integer, integer, text, text, text, text, text, text, text
) from public, anon;
grant execute on function public.get_room_availability(text, date, date)
  to anon, authenticated;
grant execute on function public.create_confirmed_reservation(
  text, date, date, integer, integer, text, text, text, text, text, text, text
) to anon, authenticated;

do $$
declare
  v_policy record;
begin
  for v_policy in
    select schemaname, tablename, policyname
      from pg_policies
     where schemaname = 'public'
       and tablename in ('rooms', 'reservations', 'settings', 'testimonials')
  loop
    execute format(
      'drop policy %I on %I.%I',
      v_policy.policyname,
      v_policy.schemaname,
      v_policy.tablename
    );
  end loop;
end;
$$;

alter table public.rooms enable row level security;
alter table public.reservations enable row level security;
alter table public.settings enable row level security;
alter table public.testimonials enable row level security;

create policy "rooms_public_active_read"
  on public.rooms for select to anon, authenticated
  using (active = true);
create policy "rooms_owner_manage"
  on public.rooms for all to authenticated
  using (public.is_mgh_booking_admin())
  with check (public.is_mgh_booking_admin());

create policy "reservations_owner_manage"
  on public.reservations for all to authenticated
  using (public.is_mgh_booking_admin())
  with check (public.is_mgh_booking_admin());

create policy "settings_owner_manage"
  on public.settings for all to authenticated
  using (public.is_mgh_booking_admin())
  with check (public.is_mgh_booking_admin());

create policy "testimonials_public_approved_read"
  on public.testimonials for select to anon, authenticated
  using (status = 'approved');
create policy "testimonials_public_pending_insert"
  on public.testimonials for insert to anon, authenticated
  with check (status = 'pending');
create policy "testimonials_owner_manage"
  on public.testimonials for all to authenticated
  using (public.is_mgh_booking_admin())
  with check (public.is_mgh_booking_admin());

revoke all on public.rooms, public.reservations, public.settings, public.testimonials
  from public, anon, authenticated;

grant select on public.rooms to anon, authenticated;
grant select, insert, update, delete on public.reservations to authenticated;
grant select, insert on public.testimonials to anon;
grant select, insert, update, delete on public.testimonials to authenticated;
grant select, insert, update, delete on public.settings to authenticated;
grant insert, update, delete on public.rooms to authenticated;

notify pgrst, 'reload schema';

commit;
