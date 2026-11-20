# Supabase booking setup

The automatic booking flow uses the existing `rooms`, `reservations`,
`settings`, and `testimonials` tables. Apply
[`../supabase/automatic-booking.sql`](../supabase/automatic-booking.sql) once
in the Supabase SQL Editor using an authorized project administrator account.
The migration does not require a service-role key in the website.

## What the migration changes

- Sets the maximum capacity of the existing rooms to two guests and makes the
  capacity required for future room records.
- Changes `set_reservation_defaults()` so inserted reservations are validated,
  priced from `rooms.price_xof`, and confirmed automatically.
- Adds `get_room_availability()` for a public, date-based availability result
  without exposing guest information.
- Adds `get_occupied_room_periods()` in the separate
  [`../supabase/occupied-room-periods.sql`](../supabase/occupied-room-periods.sql)
  script. It returns only room IDs and future/ongoing check-in and check-out
  dates for pending and confirmed reservations; it does not grant table access.
- Adds `create_confirmed_reservation()` as the atomic booking operation. It
  locks the room, checks its active state, capacity and dates, calculates the
  server-side total, and inserts a confirmed reservation with a unique
  reference.
- Keeps the existing GiST exclusion constraint on pending and confirmed
  reservations. The room lock also serializes simultaneous booking attempts.
- Removes existing policies on the four application tables and installs
  least-privilege policies. Anonymous clients can only read active rooms,
  check availability, create reservations through the RPC, submit pending
  testimonials, and read approved testimonials. Only the configured owner can
  manage rooms, reservations, settings, and testimonials.
- Registers owner UUID
  `5a2a8c93-4305-48d6-a91f-1fac189bfbef` in the protected
  `mgh_booking_admins` table. The user must already exist in Supabase Auth.

## Booking and cancellation rules

- Check-out is exclusive: another stay can begin on the same date.
- Only pending and confirmed reservations block dates. Cancelled reservations
  no longer block a stay; the existing exclusion constraint remains intact.
- Dates before the database's current date, inactive rooms and groups over
  two guests are rejected by the database.
- The database room price is authoritative. The browser only displays an
  estimate; the confirmed total is recalculated from `price_xof` and the
  number of nights in PostgreSQL.
- Payment is collected at the property. No payment credentials or service-role
  keys are used in the browser.
- To cancel a reservation, the owner must set its `status` to `cancelled`
  through an authenticated owner session. The reservation website does not
  expose a public cancellation operation.

## Verification after applying the migration

1. Confirm all 12 existing rooms have `capacity = 2`.
2. Confirm `reservations_room_id_daterange_excl` still exists.
3. Confirm an anonymous client cannot insert directly into `reservations` or
   read reservation rows, and an ordinary authenticated user cannot manage
   application tables.
4. Call `get_room_availability()` for free, overlapping, inactive and
   check-out-boundary date ranges.
5. Call `get_occupied_room_periods()` anonymously and confirm the response
  contains only room IDs and dates, with no cancelled or past reservations.
6. Submit two simultaneous overlapping requests for the same room: only one
   should be confirmed. Retry after cancelling the first reservation.
7. Confirm the returned price and total equal the room's XOF rate multiplied
   by the number of nights.
8. Test both language pages and mobile/desktop layouts.

The migration updates database permissions and functions only when it is
executed in Supabase. Until then, the website changes alone cannot make
automatic booking live.
