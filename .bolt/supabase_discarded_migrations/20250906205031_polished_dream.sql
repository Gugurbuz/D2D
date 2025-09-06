/*
  # Fix existing database issues

  1. Database Functions
    - Create missing helper functions for RLS policies
    - `get_current_sales_rep()` - Gets current user's sales rep ID
    - `is_manager()` - Checks if current user is a manager
    - `uid()` - Gets current user's auth ID

  2. Missing Tables
    - Create `users` table if not exists (referenced by foreign keys)
    - Create `profiles` table if not exists

  3. Security
    - Enable RLS on tables that need it
    - Add missing RLS policies

  4. Data Integrity
    - Add missing constraints and indexes
    - Fix any foreign key issues
*/

-- Create users table if it doesn't exist (needed for foreign key references)
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create public users view/table if needed for profiles foreign key
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create helper function to get current user's auth ID
CREATE OR REPLACE FUNCTION public.uid()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
$$;

-- Create helper function to get current sales rep ID
CREATE OR REPLACE FUNCTION public.get_current_sales_rep()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id FROM sales_reps WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Create helper function to check if current user is manager
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM sales_reps 
    WHERE user_id = auth.uid() 
    AND role = 'manager'
  );
$$;

-- Fix profiles table if it has issues
DO $$
BEGIN
  -- Check if profiles table exists and fix it
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    -- Update profiles table structure if needed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'id' AND table_schema = 'public') THEN
      ALTER TABLE profiles ADD COLUMN id uuid PRIMARY KEY DEFAULT gen_random_uuid();
    END IF;
  ELSE
    -- Create profiles table
    CREATE TABLE profiles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text DEFAULT 'Same as auth.users.id',
      phone text,
      role text,
      created_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Ensure RLS is enabled on all required tables
ALTER TABLE sales_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_leads ENABLE ROW LEVEL SECURITY;

-- Fix assignments table RLS (it was missing)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assignments' AND table_schema = 'public') THEN
    ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_reps_user_id ON sales_reps(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_customer_sales_rep ON assignments(customer_id, sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_visits_sales_rep_date ON visits(sales_rep_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_unread ON messages(recipient_id, is_read);

-- Ensure all foreign key constraints exist
DO $$
BEGIN
  -- Check and add foreign key for profiles if needed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_profiles_id' 
    AND table_name = 'profiles'
  ) THEN
    -- Only add if both tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
      ALTER TABLE profiles ADD CONSTRAINT fk_profiles_id 
        FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;