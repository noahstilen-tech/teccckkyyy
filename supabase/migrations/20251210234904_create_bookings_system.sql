/*
  # Booking System for Vanter Works

  1. New Tables
    - `availability_slots`
      - `id` (uuid, primary key)
      - `day_of_week` (integer, 0=Sunday, 6=Saturday)
      - `start_time` (time)
      - `end_time` (time)
      - `duration_minutes` (integer)
      - `created_at` (timestamp)
    
    - `bookings`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text)
      - `phone` (text, nullable)
      - `booking_date` (date)
      - `booking_time` (time)
      - `duration_minutes` (integer)
      - `notes` (text, nullable)
      - `status` (text: pending, confirmed, cancelled)
      - `created_at` (timestamp)

  2. Security
    - Public can INSERT bookings (for booking form)
    - Public can SELECT availability (for showing available times)
    - No RLS needed for public booking page
*/

-- Create availability_slots table
CREATE TABLE IF NOT EXISTS availability_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  created_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  notes text,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow public to read availability
CREATE POLICY "Anyone can view availability slots"
  ON availability_slots FOR SELECT
  TO anon
  USING (true);

-- Allow public to create bookings
CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  TO anon
  WITH CHECK (true);

-- Insert default availability (Monday-Friday, 9 AM - 5 PM, 30-minute slots)
INSERT INTO availability_slots (day_of_week, start_time, end_time, duration_minutes)
VALUES 
  (1, '09:00', '17:00', 30),  -- Monday
  (2, '09:00', '17:00', 30),  -- Tuesday
  (3, '09:00', '17:00', 30),  -- Wednesday
  (4, '09:00', '17:00', 30),  -- Thursday
  (5, '09:00', '17:00', 30)   -- Friday
ON CONFLICT DO NOTHING;
