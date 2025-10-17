/*
  # Contract Management and Auto-Save System

  This migration adds comprehensive contract management capabilities including:
  - Draft contract storage for auto-save functionality
  - Audit logging for compliance and tracking
  - Offline sync queue for field operations
  - Contract approval workflow support

  1. New Tables
    - `contract_drafts` - Stores partial contract progress for auto-save and recovery
    - `contract_audit_log` - Comprehensive audit trail for all contract actions
    - `offline_sync_queue` - Manages pending operations during offline mode
    - `contract_signatures` - Secure storage for digital signatures

  2. Security
    - Enable RLS on all new tables
    - Sales reps can only access their own contract drafts
    - Managers can view all contracts for oversight
    - Audit logs are append-only and read-only for compliance

  3. Enums
    - `contract_stage` - Tracks contract completion stage
    - `audit_action_type` - Categorizes audit log entries
    - `sync_status` - Manages offline queue sync state
*/

-- Create enums for contract management
CREATE TYPE contract_stage AS ENUM (
  'info_verified',
  'id_scanned',
  'contract_preview',
  'signature_captured',
  'sms_sent',
  'otp_verified',
  'completed'
);

CREATE TYPE audit_action_type AS ENUM (
  'contract_opened',
  'contract_previewed',
  'contract_scrolled',
  'checkbox_checked',
  'checkbox_unchecked',
  'signature_started',
  'signature_captured',
  'signature_cleared',
  'sms_requested',
  'sms_sent',
  'sms_failed',
  'otp_entered',
  'otp_verified',
  'otp_failed',
  'contract_saved',
  'contract_completed',
  'auto_save_triggered',
  'session_recovered',
  'offline_mode_entered',
  'offline_mode_exited'
);

CREATE TYPE sync_status AS ENUM (
  'pending',
  'syncing',
  'completed',
  'failed',
  'cancelled'
);

-- Contract Drafts table for auto-save functionality
CREATE TABLE IF NOT EXISTS contract_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sales_rep_id uuid NOT NULL REFERENCES sales_reps(id) ON DELETE CASCADE,

  -- Progress tracking
  current_stage contract_stage DEFAULT 'info_verified',
  completion_percentage integer DEFAULT 0,

  -- Contract state
  contract_accepted boolean DEFAULT false,
  contract_read_percentage integer DEFAULT 0,
  contract_read_time_seconds integer DEFAULT 0,

  -- Signature data
  signature_data_url text,
  signature_captured_at timestamptz,
  signature_device_info jsonb,

  -- SMS and OTP state
  sms_phone text,
  sms_sent boolean DEFAULT false,
  sms_sent_at timestamptz,
  sms_attempts integer DEFAULT 0,
  otp_code text,
  otp_verified boolean DEFAULT false,
  otp_verified_at timestamptz,
  otp_attempts integer DEFAULT 0,

  -- Session and device information
  session_id text,
  device_fingerprint text,
  user_agent text,
  ip_address inet,
  geolocation point,

  -- Metadata
  is_draft boolean DEFAULT true,
  last_saved_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),

  -- Additional data
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Contract Audit Log for compliance tracking
CREATE TABLE IF NOT EXISTS contract_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_draft_id uuid REFERENCES contract_drafts(id) ON DELETE CASCADE,
  visit_id uuid NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  sales_rep_id uuid NOT NULL REFERENCES sales_reps(id) ON DELETE CASCADE,

  -- Audit information
  action audit_action_type NOT NULL,
  description text,

  -- Context data
  previous_value jsonb,
  new_value jsonb,

  -- Device and session information
  session_id text,
  device_fingerprint text,
  user_agent text,
  ip_address inet,
  geolocation point,

  -- Timing
  action_timestamp timestamptz DEFAULT now(),
  duration_ms integer,

  -- Additional metadata
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Offline Sync Queue for field operations
CREATE TABLE IF NOT EXISTS offline_sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_rep_id uuid NOT NULL REFERENCES sales_reps(id) ON DELETE CASCADE,

  -- Operation details
  operation_type text NOT NULL,
  operation_data jsonb NOT NULL,

  -- Target references
  contract_draft_id uuid REFERENCES contract_drafts(id) ON DELETE CASCADE,
  visit_id uuid REFERENCES visits(id) ON DELETE CASCADE,

  -- Sync status
  status sync_status DEFAULT 'pending',
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,

  -- Error tracking
  last_error text,
  error_details jsonb,

  -- Timing
  created_at timestamptz DEFAULT now(),
  last_attempt_at timestamptz,
  synced_at timestamptz,

  -- Priority for processing
  priority integer DEFAULT 5,

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Contract Signatures table for secure storage
CREATE TABLE IF NOT EXISTS contract_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_draft_id uuid NOT NULL REFERENCES contract_drafts(id) ON DELETE CASCADE,
  visit_id uuid NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sales_rep_id uuid NOT NULL REFERENCES sales_reps(id) ON DELETE CASCADE,

  -- Signature data
  signature_image_url text NOT NULL,
  signature_hash text NOT NULL,

  -- Capture details
  captured_at timestamptz DEFAULT now(),
  capture_method text DEFAULT 'tablet_canvas',
  stroke_count integer,
  drawing_duration_ms integer,

  -- Device information
  device_info jsonb,
  device_fingerprint text,
  ip_address inet,
  geolocation point,

  -- Verification
  is_verified boolean DEFAULT false,
  verified_at timestamptz,
  verification_method text,

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE contract_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contract_drafts
CREATE POLICY "Sales reps can manage own contract drafts"
  ON contract_drafts
  FOR ALL
  TO authenticated
  USING (sales_rep_id = get_current_sales_rep() OR is_manager())
  WITH CHECK (sales_rep_id = get_current_sales_rep() OR is_manager());

CREATE POLICY "Managers can view all contract drafts"
  ON contract_drafts
  FOR SELECT
  TO authenticated
  USING (is_manager());

-- RLS Policies for contract_audit_log (read-only for compliance)
CREATE POLICY "Sales reps can view own audit logs"
  ON contract_audit_log
  FOR SELECT
  TO authenticated
  USING (sales_rep_id = get_current_sales_rep() OR is_manager());

CREATE POLICY "System can insert audit logs"
  ON contract_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (sales_rep_id = get_current_sales_rep());

-- RLS Policies for offline_sync_queue
CREATE POLICY "Sales reps can manage own sync queue"
  ON offline_sync_queue
  FOR ALL
  TO authenticated
  USING (sales_rep_id = get_current_sales_rep())
  WITH CHECK (sales_rep_id = get_current_sales_rep());

-- RLS Policies for contract_signatures
CREATE POLICY "Sales reps can manage own signatures"
  ON contract_signatures
  FOR ALL
  TO authenticated
  USING (sales_rep_id = get_current_sales_rep() OR is_manager())
  WITH CHECK (sales_rep_id = get_current_sales_rep() OR is_manager());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contract_drafts_visit ON contract_drafts (visit_id);
CREATE INDEX IF NOT EXISTS idx_contract_drafts_sales_rep ON contract_drafts (sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_contract_drafts_customer ON contract_drafts (customer_id);
CREATE INDEX IF NOT EXISTS idx_contract_drafts_stage ON contract_drafts (current_stage);
CREATE INDEX IF NOT EXISTS idx_contract_drafts_draft ON contract_drafts (is_draft) WHERE is_draft = true;
CREATE INDEX IF NOT EXISTS idx_contract_drafts_expires ON contract_drafts (expires_at) WHERE is_draft = true;

CREATE INDEX IF NOT EXISTS idx_audit_log_contract_draft ON contract_audit_log (contract_draft_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_visit ON contract_audit_log (visit_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_sales_rep ON contract_audit_log (sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON contract_audit_log (action_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON contract_audit_log (action);

CREATE INDEX IF NOT EXISTS idx_sync_queue_sales_rep ON offline_sync_queue (sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON offline_sync_queue (status) WHERE status IN ('pending', 'failed');
CREATE INDEX IF NOT EXISTS idx_sync_queue_priority ON offline_sync_queue (priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_sync_queue_contract_draft ON offline_sync_queue (contract_draft_id);

CREATE INDEX IF NOT EXISTS idx_signatures_contract_draft ON contract_signatures (contract_draft_id);
CREATE INDEX IF NOT EXISTS idx_signatures_visit ON contract_signatures (visit_id);
CREATE INDEX IF NOT EXISTS idx_signatures_customer ON contract_signatures (customer_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for contract_drafts
CREATE TRIGGER update_contract_drafts_updated_at
  BEFORE UPDATE ON contract_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate completion percentage
CREATE OR REPLACE FUNCTION calculate_contract_completion(draft_id uuid)
RETURNS integer AS $$
DECLARE
  completion integer := 0;
  draft_record RECORD;
BEGIN
  SELECT * INTO draft_record FROM contract_drafts WHERE id = draft_id;

  IF draft_record IS NULL THEN
    RETURN 0;
  END IF;

  -- Each requirement is worth 25%
  IF draft_record.contract_accepted THEN
    completion := completion + 25;
  END IF;

  IF draft_record.signature_data_url IS NOT NULL THEN
    completion := completion + 25;
  END IF;

  IF draft_record.sms_sent THEN
    completion := completion + 25;
  END IF;

  IF draft_record.otp_verified THEN
    completion := completion + 25;
  END IF;

  RETURN completion;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired drafts (should be called by cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_drafts()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM contract_drafts
  WHERE is_draft = true
  AND expires_at < now()
  AND updated_at < (now() - interval '7 days');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up completed sync queue items (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_completed_sync_queue()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM offline_sync_queue
  WHERE status = 'completed'
  AND synced_at < (now() - interval '30 days');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
