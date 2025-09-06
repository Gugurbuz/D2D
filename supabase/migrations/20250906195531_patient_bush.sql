/*
  # Create base tables for D2D Sales Application

  1. New Tables
    - `sales_reps` - Sales representatives with location and role info
    - `customers` - Customer information with location and consumption data
    - `visits` - Visit records with status and results
    - `assignments` - Customer assignments to sales reps
    - `messages` - Internal messaging system
    - `notifications` - System notifications
    - `tariffs` - Available tariffs and pricing
    - `visit_notes` - Additional notes for visits
    - `solar_leads` - Solar energy solution leads

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Sales reps can only see their own data
    - Managers can see all data

  3. Functions
    - Helper functions for role checking
    - Current user identification
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create enums
CREATE TYPE user_role AS ENUM ('sales_rep', 'manager');
CREATE TYPE customer_type AS ENUM ('residential', 'commercial', 'industrial');
CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE visit_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled', 'no_answer', 'rejected');
CREATE TYPE message_type AS ENUM ('direct', 'broadcast', 'system');
CREATE TYPE notification_type AS ENUM ('assignment', 'visit', 'system', 'message');

-- Sales Representatives table
CREATE TABLE IF NOT EXISTS sales_reps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  role user_role DEFAULT 'sales_rep',
  district text,
  region text,
  location point,
  daily_target integer DEFAULT 20,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  district text NOT NULL,
  phone text,
  email text,
  customer_number text UNIQUE,
  installation_number text,
  meter_number text,
  location point,
  customer_type customer_type DEFAULT 'residential',
  tariff text,
  current_supplier text,
  avg_consumption numeric,
  annual_consumption numeric,
  is_free_consumer boolean DEFAULT false,
  offer_history jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Visits table
CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sales_rep_id uuid NOT NULL REFERENCES sales_reps(id) ON DELETE CASCADE,
  visit_date date NOT NULL,
  planned_time time,
  actual_start_time timestamptz,
  actual_end_time timestamptz,
  status visit_status DEFAULT 'planned',
  priority priority_level DEFAULT 'medium',
  result text,
  notes text,
  distance_km numeric,
  estimated_duration interval,
  contract_signed boolean DEFAULT false,
  revenue_amount numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sales_rep_id uuid NOT NULL REFERENCES sales_reps(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES sales_reps(id),
  assigned_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES sales_reps(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES sales_reps(id) ON DELETE CASCADE,
  subject text,
  content text NOT NULL,
  message_type message_type DEFAULT 'direct',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES sales_reps(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type notification_type NOT NULL,
  data jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Tariffs table
CREATE TABLE IF NOT EXISTS tariffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  unit_price numeric NOT NULL,
  customer_types customer_type[] NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Visit Notes table
CREATE TABLE IF NOT EXISTS visit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  sales_rep_id uuid NOT NULL REFERENCES sales_reps(id) ON DELETE CASCADE,
  note text NOT NULL,
  is_private boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Solar Leads table
CREATE TABLE IF NOT EXISTS solar_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sales_rep_id uuid NOT NULL REFERENCES sales_reps(id) ON DELETE CASCADE,
  solutions text[] NOT NULL,
  estimated_capacity numeric,
  estimated_cost numeric,
  status text DEFAULT 'new',
  notes text,
  kvkk_consent boolean DEFAULT false,
  follow_up_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE sales_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_leads ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION get_current_sales_rep()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id FROM sales_reps WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_manager()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS(
    SELECT 1 FROM sales_reps 
    WHERE user_id = auth.uid() AND role = 'manager'
  );
$$;

-- RLS Policies for sales_reps
CREATE POLICY "Sales reps can read own data"
  ON sales_reps
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_manager());

CREATE POLICY "Sales reps can update own data"
  ON sales_reps
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Managers can read all sales reps"
  ON sales_reps
  FOR SELECT
  TO authenticated
  USING (is_manager());

-- RLS Policies for customers
CREATE POLICY "Sales reps can read assigned customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS(
      SELECT 1 FROM assignments 
      WHERE customer_id = customers.id 
      AND sales_rep_id = get_current_sales_rep()
      AND is_active = true
    ) OR is_manager()
  );

CREATE POLICY "Sales reps can update assigned customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS(
      SELECT 1 FROM assignments 
      WHERE customer_id = customers.id 
      AND sales_rep_id = get_current_sales_rep()
      AND is_active = true
    ) OR is_manager()
  );

CREATE POLICY "Managers can manage all customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (is_manager());

-- RLS Policies for visits
CREATE POLICY "Sales reps can manage own visits"
  ON visits
  FOR ALL
  TO authenticated
  USING (sales_rep_id = get_current_sales_rep() OR is_manager());

-- RLS Policies for assignments
CREATE POLICY "Sales reps can read own assignments"
  ON assignments
  FOR SELECT
  TO authenticated
  USING (sales_rep_id = get_current_sales_rep() OR is_manager());

CREATE POLICY "Managers can manage all assignments"
  ON assignments
  FOR ALL
  TO authenticated
  USING (is_manager());

-- RLS Policies for messages
CREATE POLICY "Users can read own messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    sender_id = get_current_sales_rep() OR 
    recipient_id = get_current_sales_rep()
  );

CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = get_current_sales_rep());

-- RLS Policies for notifications
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = get_current_sales_rep());

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = get_current_sales_rep());

-- RLS Policies for tariffs
CREATE POLICY "All authenticated users can read tariffs"
  ON tariffs
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for visit_notes
CREATE POLICY "Sales reps can manage own visit notes"
  ON visit_notes
  FOR ALL
  TO authenticated
  USING (sales_rep_id = get_current_sales_rep() OR is_manager());

-- RLS Policies for solar_leads
CREATE POLICY "Sales reps can manage own solar leads"
  ON solar_leads
  FOR ALL
  TO authenticated
  USING (sales_rep_id = get_current_sales_rep() OR is_manager());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_location ON customers USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_sales_reps_location ON sales_reps USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits (visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits (status);
CREATE INDEX IF NOT EXISTS idx_assignments_active ON assignments (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages (is_read) WHERE is_read = false;