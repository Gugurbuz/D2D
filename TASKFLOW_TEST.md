# TaskFlow v2 Test Talimatları

## Test Ekranına Erişim

TaskFlow v2 sistemini test etmek için özel bir test ekranı oluşturuldu.

### Yöntem 1: URL ile Doğrudan Erişim

Tarayıcınızın adres çubuğuna test ekranı URL'ini yazın:
```
http://localhost:5173/?screen=taskFlowTest
```

### Yöntem 2: Console ile Erişim

1. Uygulamaya giriş yapın (Demo Mode)
2. Tarayıcı konsolu açın (F12 veya Cmd+Opt+I)
3. Aşağıdaki kodu çalıştırın:
```javascript
window.location.hash = '#taskFlowTest'
```

### Yöntem 3: App.tsx'i Geçici Değiştirme

`src/App.tsx` dosyasında `currentScreen` state'ini başlangıçta `'taskFlowTest'` yapın:

```typescript
const [currentScreen, setCurrentScreen] = useState<Screen>('taskFlowTest');
```

## Test Senaryoları

### 1. Basit İç Bölge Ziyareti

1. **Varsayılan değerleri kullan**:
   - Müşteri Bölgesi: `Ankara`
   - Temsilci Bölgesi: `Ankara`

2. **Akışı Takip Et**:
   - "Ziyareti Başlat" → CUSTOMER adımına geçer
   - "Müşteri Bilgilerini Kaydet" → KYC adımına geçer
   - "KYC Tamamla" → CONTRACT adımına geçer
   - "Sözleşmeyi Onayla" → RESULT adımına geçer
   - "Tamamlandı" seç → Status değişir
   - "Ziyareti Tamamla" → DONE durumuna geçer

### 2. Bölge Dışı Ziyaret (OOR)

1. **Bölgeleri Farklı Yap**:
   - Müşteri Bölgesi: `Ankara`
   - Temsilci Bölgesi: `Istanbul`

2. **OOR Akışı**:
   - "Ziyareti Başlat"
   - "Müşteri Bilgilerini Kaydet" → **OOR Banner görünür**
   - "Onay Talep Et" butonu → Yöneticiye bildirim gönderir
   - "[TEST] Onayı Simüle Et" → OOR approval granted
   - Flow normal şekilde KYC'ye devam eder

### 3. Guard Sistemlerini Test Et

#### KYC Guard
- `canNextFromKYC()` guard'ı test et:
  - Bireysel müşteri: KVKK + SMS gerekli
  - Kurumsal müşteri: Yetkili bilgileri gerekli

#### Finalize Guard
- `canFinalize()` guard'ı test et:
  - Sözleşme onayı gerekli
  - SMS doğrulaması gerekli
  - Result status gerekli
  - OOR varsa, approval granted olmalı

### 4. Taslak Kaydetme

- Her adımda "Taslak Kaydet" butonuna tıkla
- Supabase `visits` tablosuna kayıt atıldığını kontrol et
- Status: `in_progress` olarak kaydedilmeli

## Durum İzleme

Test ekranında mavi arka planlı bilgi kutusu şunları gösterir:
- **Durum**: Mevcut visit status (planned, in_progress, completed, vb.)
- **Adım**: Mevcut flow step (SETUP, CUSTOMER, KYC, vb.)
- **Bölge Dışı**: OOR durumu
- **Onay Talep Edildi**: OOR approval request durumu
- **Onay Verildi**: OOR approval granted durumu

## Beklenen Davranışlar

### Status Değişimleri
```
planned → in_progress → completed/rejected/no_answer/cancelled
```

### Step Geçişleri
```
SETUP → CUSTOMER → (OOR_REVIEW) → KYC → CONTRACT → RESULT → DONE
```

### Guard Engelleri
Bir guard başarısız olduğunda:
- İlgili buton disabled olur
- Buton üzerinde "(Guard engelliyor)" yazısı görünür
- Tooltip ile neyin eksik olduğu gösterilir

## Veritabanı Kontrolü

Test sırasında Supabase'de şu kontroller yapılabilir:

### visits tablosu
```sql
SELECT * FROM visits WHERE id = 'test-visit-1';
```

### notifications tablosu (OOR approval)
```sql
SELECT * FROM notifications
WHERE type = 'visit'
AND data->>'type' = 'oor_approval'
ORDER BY created_at DESC
LIMIT 5;
```

## Sorun Giderme

### "Guard engelliyor" Hatası
- İlgili guard fonksiyonunun gereksinimlerini kontrol et
- Console'da state değerlerini incele:
```javascript
console.log(useTaskFlowStore.getState())
```

### OOR Banner Görünmüyor
- `customerData.district` ve `oorData.repRegion` değerlerinin farklı olduğundan emin ol
- Büyük/küçük harf duyarlılığı var: `"Ankara" !== "ankara"`

### Taslak Kaydedilmiyor
- Network tab'de API çağrılarını kontrol et
- Supabase bağlantısını ve .env dosyasını kontrol et

## İleri Seviye Testler

### Store'u Manuel Manipüle Et
```javascript
// Console'dan
const store = window.__TASKFLOW_STORE__;
store.getState().dispatch('OOR_APPROVED');
```

### State'i Sıfırla
```javascript
const store = window.__TASKFLOW_STORE__;
store.getState().reset();
```

## Sonraki Adımlar

1. VisitFlowScreen'i TaskFlow store ile entegre et
2. OutOfRegionWizard'ı TaskFlow'a bağla
3. Gerçek müşteri verileri ile test et
4. Canlı OOR approval flow'u test et
