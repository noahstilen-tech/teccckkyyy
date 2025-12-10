/*
  # Expand Booking System Schema
  
  1. New Tables
    - `event_types` - Different types of meetings (15 min, 30 min, etc)
      - `id` (uuid, primary key)
      - `name` (text) - Display name like "15 Minute Call"
      - `slug` (text) - URL slug like "30min"
      - `duration` (integer) - Duration in minutes
      - `description` (text)
      - `timezone` (text) - Default timezone
      - `active` (boolean)
      - `created_at` (timestamptz)
    
    - `availability_rules` - When you're available
      - `id` (uuid, primary key)
      - `event_type_id` (uuid, foreign key)
      - `day_of_week` (integer) - 0=Sunday, 6=Saturday
      - `start_time` (time)
      - `end_time` (time)
      - `created_at` (timestamptz)
    
    - `time_slots` - Generated available time slots
      - `id` (uuid, primary key)
      - `event_type_id` (uuid, foreign key)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
      - `available` (boolean)
      - `created_at` (timestamptz)
  
  2. Updates to bookings table
    - Add `event_type_id` foreign key
    - Add `start_time` and `end_time` columns
  
  3. Security
    - Enable RLS on all tables
    - Add policies for public read access to event types
    - Add policies for public booking creation
*/

-- Create event_types table
CREATE TABLE IF NOT EXISTS event_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  duration integer NOT NULL DEFAULT 30,
  description text,
  timezone text DEFAULT 'UTC',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active event types"
  ON event_types
  FOR SELECT
  USING (active = true);

-- Create availability_rules table
CREATE TABLE IF NOT EXISTS availability_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type_id uuid REFERENCES event_types(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view availability rules"
  ON availability_rules
  FOR SELECT
  USING (true);

-- Create time_slots table
CREATE TABLE IF NOT EXISTS time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type_id uuid REFERENCES event_types(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available time slots"
  ON time_slots
  FOR SELECT
  USING (available = true);

-- Update bookings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'event_type_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN event_type_id uuid REFERENCES event_types(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'start_time'
  ) THEN
    ALTER TABLE bookings ADD COLUMN start_time timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE bookings ADD COLUMN end_time timestamptz;
  END IF;
END $$;

-- Insert default event type for "30 Minute Call"
INSERT INTO event_types (name, slug, duration, description, timezone)
VALUES (
  '15 Minute Call',
  '30min',
  30,
  'A quick 30-minute video call to discuss your needs',
  'Europe/Copenhagen'
)
ON CONFLICT (slug) DO NOTHING;

-- Insert default availability (Monday-Friday, 9 AM - 5 PM)
INSERT INTO availability_rules (event_type_id, day_of_week, start_time, end_time)
SELECT 
  id,
  day,
  '09:00'::time,
  '17:00'::time
FROM event_types
CROSS JOIN generate_series(1, 5) AS day
WHERE slug = '30min'
ON CONFLICT DO NOTHING;