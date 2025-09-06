/*
  # Create test user for login

  1. New Data
    - Test user in auth.users table
    - Corresponding sales_rep record
  
  2. Security
    - Uses Supabase auth system
    - Creates proper sales_rep profile
    
  3. Test Credentials
    - Email: test@enerjisa.com
    - Password: test123
    - Role: sales_rep
*/

-- Create test user in auth.users table
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'test-user-uuid-12345',
  'authenticated',
  'authenticated',
  'test@enerjisa.com',
  crypt('test123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Create corresponding sales_rep record
INSERT INTO sales_reps (
  id,
  user_id,
  name,
  email,
  phone,
  role,
  district,
  region,
  daily_target,
  is_active,
  location,
  created_at,
  updated_at
) VALUES (
  'test-rep-uuid-12345',
  'test-user-uuid-12345',
  'Test Kullanıcısı',
  'test@enerjisa.com',
  '0555 123 45 67',
  'sales_rep',
  'Kadıköy',
  'İstanbul Anadolu',
  20,
  true,
  ST_SetSRID(ST_MakePoint(29.0275, 40.9923), 4326),
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Create identity record for auth
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'test-identity-uuid-12345',
  'test-user-uuid-12345',
  '{"sub": "test-user-uuid-12345", "email": "test@enerjisa.com"}',
  'email',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;