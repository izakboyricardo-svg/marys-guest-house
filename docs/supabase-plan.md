# Supabase preparation plan

This is a future implementation outline only. It creates no Supabase project, tables, policies, keys, or network calls. The browser code must never contain a `service_role` secret.

## Recommended tables

### `rooms`

- `id text primary key` — stable identifiers such as `room-209`.
- `name_fr text not null`, `name_en text not null`.
- `nightly_rate_xof integer not null check (nightly_rate_xof >= 0)`.
- `capacity integer null check (capacity is null or capacity > 0)`.
- `active boolean not null default true`.
- `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`.

The static website configuration remains the current source until an authorized migration to a database is planned.

### `reservations`

- `id uuid primary key default gen_random_uuid()`.
- `reference text not null unique`.
- `room_id text not null references rooms(id)`.
- `check_in date not null`, `check_out date not null check (check_out > check_in)`.
- `adults integer not null check (adults > 0)`, `children integer not null default 0 check (children >= 0)`.
- `first_name text not null`, `last_name text not null`, `email text`, `phone text not null`, `country_code text`.
- `estimated_arrival_time time`, `special_requests text`.
- `status text not null check (status in ('pending','confirmed','cancelled','rejected'))`.
- `nightly_rate_xof integer not null`, `nights integer not null check (nights > 0)`, `total_xof integer not null check (total_xof >= 0)`.
- `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`.

Use database-side transactions / a PostgreSQL exclusion constraint over room and date ranges (or an equivalent locked transaction) to prevent overlapping active reservations. Client-side checks are only for usability and are not an availability guarantee. A pending request should not be presented as confirmed.

### `testimonials`

- `id uuid primary key default gen_random_uuid()`.
- `first_name text not null`, `rating smallint not null check (rating between 1 and 5)`.
- `comment_fr text`, `comment_en text`.
- `status text not null check (status in ('pending','published','hidden','rejected')) default 'pending'`.
- `created_at timestamptz not null default now()`, `moderated_at timestamptz`, `moderated_by uuid`.

## Access control and operational flow

- Enable RLS on every table.
- Public clients may read only active room catalogue data and published testimonials.
- Public clients may create reservation requests and pending testimonials through narrowly scoped policies or, preferably, an Edge Function with server-side validation and rate limiting. Public users must not update reservation status or publish testimonials.
- Restrict reservation/customer data to authorized staff; never expose it through broad public `select` policies.
- Staff sign-in should use Supabase Auth and least-privilege roles. Keep all privileged secrets in server/Edge Function secrets.
- Send owner notifications from a trusted server/Edge Function after a successful database transaction; do not put email credentials in the browser.
- Record cancellation through a controlled server action, update status transactionally, and make cancelled dates available only after the transaction succeeds.
- Validate capacity, rates, date ranges, promotion calculations, and double-booking rules on the server/database, not only in JavaScript.
- Add retention and deletion procedures for personal information before collecting real customer data.
