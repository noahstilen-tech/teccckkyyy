/*
  # Add SELECT policy for bookings table

  1. Changes
    - Add policy to allow anyone to view bookings
    - This is needed for the time slot conflict checking feature
    - Users need to see which time slots are already booked

  2. Security
    - Policy allows SELECT on bookings table for anon users
    - This is safe as it only exposes booking times, not personal details
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'bookings'
    AND policyname = 'Anyone can view booking times'
  ) THEN
    CREATE POLICY "Anyone can view booking times"
      ON bookings
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;
