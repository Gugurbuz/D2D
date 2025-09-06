/*
  # Insert mock customer data

  1. Customer Data
    - Insert all mock customers from the application
    - Include location data (lat/lng converted to PostGIS point)
    - Set proper customer types and consumption data

  2. Sample Assignments
    - Assign customers to sales reps
    - Create realistic distribution

  3. Sample Visits
    - Create planned visits for today
    - Include various statuses and results
*/

-- Insert customers with location data
INSERT INTO customers (
  id,
  name,
  address,
  district,
  phone,
  customer_number,
  installation_number,
  meter_number,
  location,
  customer_type,
  tariff,
  current_supplier,
  avg_consumption,
  annual_consumption,
  is_free_consumer,
  offer_history
) VALUES 
(
  '1'::uuid,
  'Buse Aksoy',
  'Bağdat Cd. No:120',
  'Maltepe',
  '0555 111 22 01',
  'C210000001',
  'I210000001',
  '210000001',
  point(29.1569, 40.9359),
  'residential',
  'Mesken',
  'Diğer Şirket',
  270,
  3240,
  true,
  '["2025-03: Dijital sözleşme"]'::jsonb
),
(
  '2'::uuid,
  'Kaan Er',
  'Alemdağ Cd. No:22',
  'Ümraniye',
  '0555 111 22 02',
  'C210000002',
  'I210000002',
  '210000002',
  point(29.1248, 41.0165),
  'residential',
  'Mesken',
  'Diğer Şirket',
  300,
  3600,
  true,
  '["2024-08: %10 indirim"]'::jsonb
),
(
  '3'::uuid,
  'Canan Sezer',
  'Finans Merkezi A1',
  'Ataşehir',
  '0555 111 22 03',
  'C210000003',
  'I210000003',
  '210000003',
  point(29.1274, 40.9923),
  'commercial',
  'İş Yeri',
  'Diğer Şirket',
  1400,
  16800,
  true,
  '["2024-09: Kurumsal teklif"]'::jsonb
),
(
  '4'::uuid,
  'Kübra Oral',
  'İnönü Mah. No:18',
  'Kadıköy',
  '0555 111 22 04',
  'C210000004',
  'I210000004',
  '210000004',
  point(29.0496, 40.9857),
  'residential',
  'Mesken',
  'Diğer Şirket',
  310,
  3720,
  true,
  '["2024-11: Sadakat indirimi"]'::jsonb
),
(
  '5'::uuid,
  'Ayça Erden',
  'Koşuyolu Cd. No:7',
  'Kadıköy',
  '0555 111 22 05',
  'C210000005',
  'I210000005',
  '210000005',
  point(29.0498, 41.0004),
  'commercial',
  'İş Yeri',
  'Diğer Şirket',
  980,
  11760,
  true,
  '["2024-10: %10 indirim"]'::jsonb
),
(
  '6'::uuid,
  'Meral Kılıç',
  'Çengelköy Sahil',
  'Üsküdar',
  '0555 111 22 06',
  'C210000006',
  'I210000006',
  '210000006',
  point(29.0557, 41.0573),
  'residential',
  'Mesken',
  'Diğer Şirket',
  260,
  3120,
  false,
  '["2024-03: Hoş geldin"]'::jsonb
),
(
  '7'::uuid,
  'Tuğçe Polat',
  'Kısıklı Cd. No:15',
  'Üsküdar',
  '0555 111 22 07',
  'C210000007',
  'I210000007',
  '210000007',
  point(29.0672, 41.0333),
  'residential',
  'Mesken',
  'Diğer Şirket',
  290,
  3480,
  true,
  '["2024-12: Sadakat"]'::jsonb
),
(
  '8'::uuid,
  'Selim Yurt',
  'Atatürk Cd. No:5',
  'Sancaktepe',
  '0555 111 22 08',
  'C210000008',
  'I210000008',
  '210000008',
  point(29.2316, 41.0152),
  'residential',
  'Mesken',
  'Diğer Şirket',
  320,
  3840,
  true,
  '["2025-03: Yeni teklif"]'::jsonb
),
(
  '9'::uuid,
  'Zeynep Koç',
  'Sarıgazi Mah. No:23',
  'Sancaktepe',
  '0555 111 22 09',
  'C210000009',
  'I210000009',
  '210000009',
  point(29.2447, 41.0074),
  'commercial',
  'İş Yeri',
  'Diğer Şirket',
  1120,
  13440,
  true,
  '["2024-08: Turizm indirimi"]'::jsonb
),
(
  '10'::uuid,
  'Yasin Ateş',
  'Şerifali Mah. No:4',
  'Ümraniye',
  '0555 111 22 10',
  'C210000010',
  'I210000010',
  '210000010',
  point(29.1376, 41.0179),
  'residential',
  'Mesken',
  'Diğer Şirket',
  310,
  3720,
  true,
  '["2024-07: Sadakat"]'::jsonb
),
(
  '11'::uuid,
  'Derya Kılıç',
  'Küçükyalı Sahil',
  'Maltepe',
  '0555 111 22 11',
  'C210000011',
  'I210000011',
  '210000011',
  point(29.1444, 40.9488),
  'commercial',
  'İş Yeri',
  'Diğer Şirket',
  900,
  10800,
  true,
  '["2024-04: AVM tarifesi"]'::jsonb
),
(
  '12'::uuid,
  'Gizem Acar',
  'İdealtepe Mah. No:11',
  'Maltepe',
  '0555 111 22 12',
  'C210000012',
  'I210000012',
  '210000012',
  point(29.1228, 40.9497),
  'residential',
  'Mesken',
  'Diğer Şirket',
  295,
  3540,
  false,
  '["2025-01: Paket"]'::jsonb
),
(
  '13'::uuid,
  'Seda Karaca',
  'Başak Cd. No:2',
  'Kartal',
  '0555 111 22 13',
  'C210000013',
  'I210000013',
  '210000013',
  point(29.2137, 40.9127),
  'residential',
  'Mesken',
  'Diğer Şirket',
  300,
  3600,
  true,
  '["2024-02: Kombi kampanyası"]'::jsonb
),
(
  '14'::uuid,
  'Tolga Kurt',
  'Sahil Yolu No:88',
  'Kartal',
  '0555 111 22 14',
  'C210000014',
  'I210000014',
  '210000014',
  point(29.1947, 40.9075),
  'residential',
  'Mesken',
  'Diğer Şirket',
  295,
  3540,
  true,
  '["2024-06: Sadakat paketi"]'::jsonb
),
(
  '15'::uuid,
  'Melih Uçar',
  'Velibaba Mah. No:10',
  'Pendik',
  '0555 111 22 15',
  'C210000015',
  'I210000015',
  '210000015',
  point(29.2312, 40.9009),
  'commercial',
  'İş Yeri',
  'Diğer Şirket',
  1350,
  16200,
  true,
  '["2024-01: Endüstriyel tarife"]'::jsonb
),
(
  '16'::uuid,
  'İpek Gür',
  'Esenyalı Mah. No:17',
  'Pendik',
  '0555 111 22 16',
  'C210000016',
  'I210000016',
  '210000016',
  point(29.2743, 40.8784),
  'residential',
  'Mesken',
  'Diğer Şirket',
  280,
  3360,
  false,
  '["2023-12: E-devlet onay"]'::jsonb
),
(
  '17'::uuid,
  'Kerem Efe',
  'Barbaros Mah. No:5',
  'Tuzla',
  '0555 111 22 17',
  'C210000017',
  'I210000017',
  '210000017',
  point(29.3033, 40.8380),
  'residential',
  'Mesken',
  'Diğer Şirket',
  310,
  3720,
  true,
  '["2023-11: Online randevu"]'::jsonb
),
(
  '18'::uuid,
  'Naz Acar',
  'İstasyon Mah. No:3',
  'Tuzla',
  '0555 111 22 18',
  'C210000018',
  'I210000018',
  '210000018',
  point(29.3345, 40.8228),
  'commercial',
  'İş Yeri',
  'Diğer Şirket',
  920,
  11040,
  true,
  '["2023-10: Ticari sabit"]'::jsonb
),
(
  '19'::uuid,
  'Mina Eren',
  'Acarlar Mah. No:2',
  'Beykoz',
  '0555 111 22 19',
  'C210000019',
  'I210000019',
  '210000019',
  point(29.1111, 41.1459),
  'residential',
  'Mesken',
  'Diğer Şirket',
  290,
  3480,
  true,
  '["2025-02: Özel teklif"]'::jsonb
),
(
  '20'::uuid,
  'Efe Çınar',
  'Şahinbey Cd. No:9',
  'Sultanbeyli',
  '0555 111 22 20',
  'C210000020',
  'I210000020',
  '210000020',
  point(29.2622, 40.9677),
  'residential',
  'Mesken',
  'Diğer Şirket',
  300,
  3600,
  true,
  '["2024-05: %8 indirim"]'::jsonb
),
(
  '21'::uuid,
  'Elif Aydın',
  'Merkez Mah. No:1',
  'Çekmeköy',
  '0555 111 22 21',
  'C210000021',
  'I210000021',
  '210000021',
  point(29.2013, 41.0546),
  'commercial',
  'İş Yeri',
  'Diğer Şirket',
  1120,
  13440,
  true,
  '["2024-08: Esnek paket"]'::jsonb
),
(
  '22'::uuid,
  'Onur Demirel',
  'Çamlık Mah. No:6',
  'Çekmeköy',
  '0555 111 22 22',
  'C210000022',
  'I210000022',
  '210000022',
  point(29.2233, 41.0466),
  'residential',
  'Mesken',
  'Diğer Şirket',
  330,
  3960,
  true,
  '["2024-05: Otomatik ödeme"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Insert sample assignments
INSERT INTO assignments (
  customer_id,
  sales_rep_id,
  assigned_by,
  is_active
) VALUES 
('1'::uuid, 'rep-3'::uuid, 'rep-2'::uuid, true),
('2'::uuid, 'rep-4'::uuid, 'rep-2'::uuid, true),
('3'::uuid, 'rep-5'::uuid, 'rep-2'::uuid, true),
('4'::uuid, 'rep-3'::uuid, 'rep-2'::uuid, true),
('7'::uuid, 'rep-4'::uuid, 'rep-2'::uuid, true),
('11'::uuid, 'rep-3'::uuid, 'rep-2'::uuid, true),
('15'::uuid, 'rep-5'::uuid, 'rep-2'::uuid, true)
ON CONFLICT DO NOTHING;

-- Insert sample visits for today
INSERT INTO visits (
  customer_id,
  sales_rep_id,
  visit_date,
  planned_time,
  status,
  priority,
  distance_km,
  estimated_duration
) VALUES 
('1'::uuid, 'rep-3'::uuid, CURRENT_DATE, '09:00'::time, 'planned', 'low', 0.9, '25 minutes'::interval),
('2'::uuid, 'rep-4'::uuid, CURRENT_DATE, '09:20'::time, 'planned', 'medium', 9.6, '25 minutes'::interval),
('3'::uuid, 'rep-5'::uuid, CURRENT_DATE, '09:40'::time, 'planned', 'high', 6.2, '50 minutes'::interval),
('4'::uuid, 'rep-3'::uuid, CURRENT_DATE, '10:00'::time, 'planned', 'medium', 7.1, '30 minutes'::interval),
('7'::uuid, 'rep-4'::uuid, CURRENT_DATE, '11:00'::time, 'planned', 'medium', 10.8, '25 minutes'::interval),
('11'::uuid, 'rep-3'::uuid, CURRENT_DATE, '12:20'::time, 'planned', 'low', 2.2, '35 minutes'::interval),
('15'::uuid, 'rep-5'::uuid, CURRENT_DATE, '14:00'::time, 'planned', 'high', 12.0, '50 minutes'::interval)
ON CONFLICT DO NOTHING;

-- Insert sample messages
INSERT INTO messages (
  sender_id,
  recipient_id,
  subject,
  content,
  message_type,
  is_read
) VALUES 
(
  'rep-3'::uuid,
  'rep-1'::uuid,
  'Rota Onayı',
  'Günaydın, Maltepe bölgesindeki rota optimizasyonunu onayladım. Trafik tahmini iyi görünüyor.',
  'direct',
  true
),
(
  'rep-1'::uuid,
  'rep-3'::uuid,
  'Re: Rota Onayı',
  'Harika haber Serkan, teşekkürler! Öğleden sonraki ziyaretlerin için bir hatırlatma: ABC A.Ş. sipariş detaylarını teyit etmeni rica etti.',
  'direct',
  true
),
(
  'rep-4'::uuid,
  'rep-1'::uuid,
  'Yeni Müşteri',
  'Üsküdar''daki yeni müşteri adayını sisteme ekledim, onaya gönderildi.',
  'direct',
  false
)
ON CONFLICT DO NOTHING;

-- Insert sample notifications
INSERT INTO notifications (
  user_id,
  title,
  description,
  type,
  is_read
) VALUES 
(
  'rep-1'::uuid,
  '3 müşteri atandı',
  'Zelal Kaya: 3 yeni ziyaret',
  'assignment',
  false
),
(
  'rep-1'::uuid,
  'Ziyaret tamamlandı',
  'Mehmet Yılmaz — %12 indirim kabul edildi',
  'visit',
  false
),
(
  'rep-1'::uuid,
  'Sistem bildirimi',
  'Harita servisi normal çalışıyor',
  'system',
  true
)
ON CONFLICT DO NOTHING;