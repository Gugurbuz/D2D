/*
  # Fix enum type creation errors

  1. Problem
    - Enum types like `user_role`, `customer_type`, etc. already exist
    - CREATE TYPE commands are failing with "already exists" errors

  2. Solution
    - Use DO blocks with conditional checks for enum creation
    - Only create types if they don't already exist
    - Safe for repeated migrations

  3. Enum Types Fixed
    - user_role (manager, sales_rep)
    - customer_type (residential, commercial, industrial)
    - priority_level (high, medium, low)
    - visit_status (planned, in_progress, completed, cancelled, no_answer, rejected)
    - message_type (direct, broadcast, system)
    - notification_type (assignment, visit, system, message)
*/

-- Create user_role enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('manager', 'sales_rep');
  END IF;
END $$;

-- Create customer_type enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_type') THEN
    CREATE TYPE customer_type AS ENUM ('residential', 'commercial', 'industrial');
  END IF;
END $$;

-- Create priority_level enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority_level') THEN
    CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');
  END IF;
END $$;

-- Create visit_status enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visit_status') THEN
    CREATE TYPE visit_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled', 'no_answer', 'rejected');
  END IF;
END $$;

-- Create message_type enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type') THEN
    CREATE TYPE message_type AS ENUM ('direct', 'broadcast', 'system');
  END IF;
END $$;

-- Create notification_type enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM ('assignment', 'visit', 'system', 'message');
  END IF;
END $$;