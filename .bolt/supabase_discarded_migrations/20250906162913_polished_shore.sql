/*
  # Initial D2D Sales Application Schema

  1. New Tables
    - `sales_reps` - Sales representatives with location and contact info
    - `customers` - Customer information with location and visit details
    - `visits` - Visit records with status and results
    - `assignments` - Customer assignments to sales reps
    - `messages` - Internal messaging between team members
    - `notifications` - System notifications
    - `visit_notes` - Notes and comments for visits
    - `tariffs` - Available electricity tariffs
    - `leads` - Solar energy solution leads

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on roles
    - Sales reps can only see their own data
    - Managers can see all team data

  3. Functions
    - Helper functions for distance calculations
    - Role-based access control functions
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create enum types
CREATE TYPE user_role AS ENUM ('sales_rep', 'manager');
CREATE TYPE visit_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled', 'no_answer', 'rejected');
CREATE TYPE customer_type AS ENUM ('residential', 'commercial', 'industrial');
CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE message_type AS ENUM ('direct', 'broadcast', 'system');
CREATE TYPE notification_type AS ENUM ('assignment', 'visit', 'system', 'message');

-- Sales Representatives table
CREATE TABLE IF NOT EXISTS sales_reps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  role user_role NOT NULL DEFAULT 'sales_rep',
  location geography(POINT, 4326),
  district text,
  region text,
  daily_target integer DEFAULT 20,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_number text UNIQUE,
  installation_number text,
  name text NOT NULL,
  phone text,
  email text,
  address text NOT NULL,
  district text NOT NULL,
  location geography(POINT, 4326),
  customer_type customer_type DEFAULT 'residential',
  tariff text,
  meter_number text,
  annual_consumption numeric,
  avg_consumption numeric,
  current_supplier text,
  is_free_consumer boolean DEFAULT false,
  offer_history jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Visits table
CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  sales_rep_id uuid REFERENCES sales_reps(id) ON DELETE CASCADE,
  visit_date date NOT NULL,
  planned_time time,
  actual_start_time timestamptz,
  actual_end_time timestamptz,
  status visit_status DEFAULT 'planned',
  priority priority_level DEFAULT 'medium',
  estimated_duration interval DEFAULT '30 minutes',
  distance_km numeric,
  result text,
  notes text,
  contract_signed boolean DEFAULT false,
  revenue_amount numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  sales_rep_id uuid REFERENCES sales_reps(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES sales_reps(id),
  assigned_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(customer_id, sales_rep_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES sales_reps(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES sales_reps(id) ON DELETE CASCADE,
  message_type message_type DEFAULT 'direct',
  subject text,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES sales_reps(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  description text,
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Visit Notes table
CREATE TABLE IF NOT EXISTS visit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid REFERENCES visits(id) ON DELETE CASCADE,
  sales_rep_id uuid REFERENCES sales_reps(id) ON DELETE CASCADE,
  note text NOT NULL,
  is_private boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Tariffs table
CREATE TABLE IF NOT EXISTS tariffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  customer_types customer_type[] NOT NULL,
  unit_price numeric NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Solar Leads table
CREATE TABLE IF NOT EXISTS solar_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  sales_rep_id uuid REFERENCES sales_reps(id) ON DELETE CASCADE,
  solutions text[] NOT NULL,
  estimated_capacity numeric,
  estimated_cost numeric,
  status text DEFAULT 'new',
  kvkk_consent boolean DEFAULT false,
  follow_up_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE sales_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_leads ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's sales rep record
CREATE OR REPLACE FUNCTION get_current_sales_rep()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id FROM sales_reps WHERE user_id = auth.uid();
$$;

-- Helper function to check if user is manager
CREATE OR REPLACE FUNCTION is_manager()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM sales_reps 
    WHERE user_id = auth.uid() AND role = 'manager'
  );
$$;

-- RLS Policies for sales_reps
CREATE POLICY "Sales reps can view all team members"
  ON sales_reps FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Sales reps can update own profile"
  ON sales_reps FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Managers can insert new sales reps"
  ON sales_reps FOR INSERT
  TO authenticated
  WITH CHECK (is_manager());

-- RLS Policies for customers
CREATE POLICY "Sales reps can view assigned customers"
  ON customers FOR SELECT
  TO authenticated
  USING (
    is_manager() OR 
    EXISTS (
      SELECT 1 FROM assignments 
      WHERE customer_id = customers.id 
      AND sales_rep_id = get_current_sales_rep()
      AND is_active = true
    )
  );

CREATE POLICY "Sales reps can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Sales reps can update assigned customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    is_manager() OR 
    EXISTS (
      SELECT 1 FROM assignments 
      WHERE customer_id = customers.id 
      AND sales_rep_id = get_current_sales_rep()
      AND is_active = true
    )
  );

-- RLS Policies for visits
CREATE POLICY "Sales reps can view own visits"
  ON visits FOR SELECT
  TO authenticated
  USING (
    is_manager() OR 
    sales_rep_id = get_current_sales_rep()
  );

CREATE POLICY "Sales reps can insert own visits"
  ON visits FOR INSERT
  TO authenticated
  WITH CHECK (sales_rep_id = get_current_sales_rep());

CREATE POLICY "Sales reps can update own visits"
  ON visits FOR UPDATE
  TO authenticated
  USING (
    is_manager() OR 
    sales_rep_id = get_current_sales_rep()
  );

-- RLS Policies for assignments
CREATE POLICY "View assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING (
    is_manager() OR 
    sales_rep_id = get_current_sales_rep()
  );

CREATE POLICY "Managers can manage assignments"
  ON assignments FOR ALL
  TO authenticated
  USING (is_manager())
  WITH CHECK (is_manager());

-- RLS Policies for messages
CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    sender_id = get_current_sales_rep() OR 
    recipient_id = get_current_sales_rep()
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = get_current_sales_rep());

CREATE POLICY "Users can update their received messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (recipient_id = get_current_sales_rep());

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = get_current_sales_rep());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = get_current_sales_rep());

-- RLS Policies for visit_notes
CREATE POLICY "View visit notes"
  ON visit_notes FOR SELECT
  TO authenticated
  USING (
    is_manager() OR 
    sales_rep_id = get_current_sales_rep() OR
    (NOT is_private AND EXISTS (
      SELECT 1 FROM visits v 
      WHERE v.id = visit_id 
      AND v.sales_rep_id = get_current_sales_rep()
    ))
  );

CREATE POLICY "Sales reps can insert visit notes"
  ON visit_notes FOR INSERT
  TO authenticated
  WITH CHECK (sales_rep_id = get_current_sales_rep());

-- RLS Policies for tariffs
CREATE POLICY "Everyone can view active tariffs"
  ON tariffs FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Managers can manage tariffs"
  ON tariffs FOR ALL
  TO authenticated
  USING (is_manager())
  WITH CHECK (is_manager());

-- RLS Policies for solar_leads
CREATE POLICY "Sales reps can view own leads"
  ON solar_leads FOR SELECT
  TO authenticated
  USING (
    is_manager() OR 
    sales_rep_id = get_current_sales_rep()
  );

CREATE POLICY "Sales reps can insert leads"
  ON solar_leads FOR INSERT
  TO authenticated
  WITH CHECK (sales_rep_id = get_current_sales_rep());

CREATE POLICY "Sales reps can update own leads"
  ON solar_leads FOR UPDATE
  TO authenticated
  USING (
    is_manager() OR 
    sales_rep_id = get_current_sales_rep()
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_reps_user_id ON sales_reps(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_reps_role ON sales_reps(role);
CREATE INDEX IF NOT EXISTS idx_customers_location ON customers USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_visits_customer_id ON visits(customer_id);
CREATE INDEX IF NOT EXISTS idx_visits_sales_rep_id ON visits(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_assignments_customer_id ON assignments(customer_id);
CREATE INDEX IF NOT EXISTS idx_assignments_sales_rep_id ON assignments(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Insert sample tariffs
INSERT INTO tariffs (name, customer_types, unit_price, description) VALUES
('Standart Konut', ARRAY['residential'], 2.10, 'Ev kullanıcıları için standart tarife'),
('Yeşil Evim', ARRAY['residential'], 2.25, 'Çevre dostu konut tarifesi'),
('Ekonomik Ticarethane', ARRAY['commercial'], 3.50, 'Küçük işletmeler için ekonomik tarife'),
('Profesyonel Ticarethane', ARRAY['commercial'], 3.35, 'Orta ölçekli işletmeler için tarife'),
('Sanayi Avantaj', ARRAY['industrial'], 3.10, 'Sanayi tesisleri için özel tarife');