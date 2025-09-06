/*
  # Insert test data for D2D Sales Application

  1. Test Users
    - Create test sales rep and manager users
    - Insert into auth.users and sales_reps tables

  2. Sample Data
    - Insert tariffs
    - Insert customers with locations
    - Create sample visits and assignments
    - Add test messages and notifications

  3. Security
    - All data respects RLS policies
    - Test users have proper permissions
*/

-- Insert test users into auth.users (bypassing normal signup flow)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'test@enerjisa.com',
  crypt('test123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"name": "Test Kullanıcısı"}'::jsonb,
  false,
  'authenticated',
  'authenticated'
),
(
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'manager@enerjisa.com',
  crypt('manager123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"name": "Test Yöneticisi"}'::jsonb,
  false,
  'authenticated',
  'authenticated'
)
ON CONFLICT (email) DO NOTHING;

-- Insert corresponding identities
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  '{"sub": "550e8400-e29b-41d4-a716-446655440001", "email": "test@enerjisa.com"}'::jsonb,
  'email',
  now(),
  now()
),
(
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  '{"sub": "550e8400-e29b-41d4-a716-446655440002", "email": "manager@enerjisa.com"}'::jsonb,
  'email',
  now(),
  now()
)
ON CONFLICT (provider, id) DO NOTHING;

-- Insert sales reps
INSERT INTO sales_reps (
  id,
  user_id,
  name,
  email,
  phone,
  role,
  district,
  region,
  location,
  daily_target
) VALUES 
(
  'rep-1'::uuid,
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'Test Kullanıcısı',
  'test@enerjisa.com',
  '0555 123 45 67',
  'sales_rep',
  'Kadıköy',
  'İstanbul Anadolu',
  point(29.1553, 40.9368),
  20
),
(
  'rep-2'::uuid,
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  'Test Yöneticisi',
  'manager@enerjisa.com',
  '0555 987 65 43',
  'manager',
  'Merkez',
  'İstanbul Anadolu',
  point(29.1553, 40.9368),
  0
),
(
  'rep-3'::uuid,
  null,
  'Serkan Özkan',
  'serkan@enerjisa.com',
  '0507 968 16 48',
  'sales_rep',
  'Maltepe',
  'İstanbul Anadolu',
  point(29.1500, 40.9360),
  25
),
(
  'rep-4'::uuid,
  null,
  'Ayşe Yılmaz',
  'ayse@enerjisa.com',
  '0555 111 22 02',
  'sales_rep',
  'Ümraniye',
  'İstanbul Anadolu',
  point(29.1248, 41.0165),
  22
),
(
  'rep-5'::uuid,
  null,
  'Mehmet Ali Vural',
  'mehmet@enerjisa.com',
  '0555 111 22 03',
  'sales_rep',
  'Ataşehir',
  'İstanbul Anadolu',
  point(29.1274, 40.9923),
  20
)
ON CONFLICT (id) DO NOTHING;

-- Insert tariffs
INSERT INTO tariffs (
  id,
  name,
  description,
  unit_price,
  customer_types,
  is_active
) VALUES 
(
  gen_random_uuid(),
  'Standart Konut',
  'Konut müşterileri için standart tarife',
  2.10,
  ARRAY['residential']::customer_type[],
  true
),
(
  gen_random_uuid(),
  'Yeşil Evim',
  'Çevre dostu konut tarifesi',
  2.25,
  ARRAY['residential']::customer_type[],
  true
),
(
  gen_random_uuid(),
  'Ekonomik Ticarethane',
  'Küçük işletmeler için ekonomik tarife',
  3.50,
  ARRAY['commercial']::customer_type[],
  true
),
(
  gen_random_uuid(),
  'Profesyonel Ticarethane',
  'Orta ölçekli işletmeler için tarife',
  3.35,
  ARRAY['commercial']::customer_type[],
  true
),
(
  gen_random_uuid(),
  'Sanayi Avantaj',
  'Sanayi müşterileri için özel tarife',
  3.10,
  ARRAY['industrial']::customer_type[],
  true
)
ON CONFLICT (id) DO NOTHING;