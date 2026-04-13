# Quickstart: Connect Now and Adhoc Connections

## Feature Overview
Add an immediate entry point to the video connection room for pending connections.

## Implementation Steps

1. **Dashboard UI Update**:
   - Locate `components/dashboard/connections.tsx`.
   - Update `ConnectionTable` to include an "Actions" column.
   - For connections with status in `upcomingStatuses`, add a `Link` to `/connect/[connectionId]` with the label "Connect Now".

2. **Room Access Verification**:
   - Verify that `app/api/twilio/token/route.ts` correctly permits both the `proposerId` and `confirmerId` to generate a token for the room.

3. **Room Interface Check**:
   - Ensure `app/(dashboard)/connect/[connectionId]/page.tsx` handles joining gracefully regardless of the scheduled time.

## Manual Testing

1. Log in as a user with a pending connection.
2. Navigate to the dashboard.
3. Find the "Upcoming & Pending" table.
4. Click the "Connect Now" link for a pending connection.
5. Verify you are taken to the correct video room and can join (if camera/mic are available).
6. Verify the second participant can also click "Connect Now" from their dashboard and join the same room.
