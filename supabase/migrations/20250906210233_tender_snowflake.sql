/*
  # Fix UUID Generation

  1. Updates
    - Ensure all tables use `gen_random_uuid()` as default for UUID primary keys
    - Remove manual UUID generation from application code
    - Let PostgreSQL handle UUID generation automatically

  2. Tables Updated
    - `customers` - Set default UUID generation
    - `sales_reps` - Set default UUID generation  
    - `visits` - Set default UUID generation
    - `assignments` - Set default UUID generation
    - `messages` - Set default UUID generation
    - `notifications` - Set default UUID generation
    - `solar_leads` - Set default UUID generation
    - `visit_notes` - Set default UUID generation
    - `tariffs` - Set default UUID generation

  3. Benefits
    - No need to generate UUIDs in application code
    - Consistent UUID generation
    - Better performance
    - Simpler INSERT statements
*/

-- Enable uuid-ossp extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Update all tables to use gen_random_uuid() as default for id columns
DO $$
BEGIN
  -- customers table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
    ALTER TABLE customers ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;

  -- sales_reps table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_reps') THEN
    ALTER TABLE sales_reps ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;

  -- visits table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'visits') THEN
    ALTER TABLE visits ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;

  -- assignments table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assignments') THEN
    ALTER TABLE assignments ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;

  -- messages table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    ALTER TABLE messages ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;

  -- notifications table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    ALTER TABLE notifications ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;

  -- solar_leads table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'solar_leads') THEN
    ALTER TABLE solar_leads ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;

  -- visit_notes table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'visit_notes') THEN
    ALTER TABLE visit_notes ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;

  -- tariffs table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tariffs') THEN
    ALTER TABLE tariffs ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END $$;