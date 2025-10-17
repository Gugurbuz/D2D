// src/data/messages.ts
// Enerjisa saha SATIŞ senaryoları (OCR ve dağıtım operasyonu ifadeleri YOK)

export type Message = {
  id: string;
  senderId: string;   // 'you' veya rep id (rep-1, rep-2, ...)
  recipientId: string;
  text: string;
  timestamp: string;  // ISO 8601
  read: boolean;
};

export type Conversation = {
  id: string;
  title?: string;
  userId?: string;    // karşı taraf rep id (avatar vs. için)
  participantA: string; // genelde 'you'
  participantB: string; // rep id
  updatedAt?: string;   // son mesaj zamanı
  messages: Message[];
};

function withUpdatedAt(conv: Omit<Conversation, 'updatedAt'>): Conversation {
  const last = conv.messages[conv.messages.length - 1];
  return { ...conv, updatedAt: last ? last.timestamp : undefined };
}

export const mockConversations: Conversation[] = [
  // Serkan (rep-1) — Ziyaret planı, tasarruf mesajı, e-imza
  withUpdatedAt({
    id: 'conv-1',
    title: 'Serkan • Ziyaret & E-İmza',
    userId: 'rep-1',
    participantA: 'you',
    participantB: 'rep-1',
    messages: [
      {
        id: 'msg101',
        senderId: 'rep-1',
        recipientId: 'you',
        text:
          'Günaydın 🙌 Maltepe ziyaret planım hazır. Yıldızlı müşteri: ABC Gıda — ilk durak olarak ayarladım.',
        timestamp: '2025-09-01T08:35:12Z',
        read: true,
      },
      {
        id: 'msg102',
        senderId: 'you',
        recipientId: 'rep-1',
        text:
          'Harika. Fatura verisine göre birim enerji + yıllık tüketimden net tasarrufu çıkar; satışçı dilinde kısa özet hazırla.',
        timestamp: '2025-09-01T08:37:20Z',
        read: true,
      },
      {
        id: 'msg103',
        senderId: 'rep-1',
        recipientId: 'you',
        text:
          'Hesap tamam ✅ Rakip birim enerji 3.516 TL/kWh, yıllık ~1.022 kWh. Bizimle ~1.548 TL/yıl tasarruf mesajı çıktı. Bireysel hitaplı 2 cümlelik metin hazır.',
        timestamp: '2025-09-01T09:05:12Z',
        read: true,
      },
      {
        id: 'msg104',
        senderId: 'you',
        recipientId: 'rep-1',
        text:
          'Süper. Onay gelirse e-imza linkini SMS + e-posta gönder; CRM’de “Kabul” aşamasına çek.',
        timestamp: '2025-09-01T09:07:45Z',
        read: true,
      },
      {
        id: 'msg105',
        senderId: 'rep-1',
        recipientId: 'you',
        text:
          'Onay aldım 🎯 E-imza linkini paylaştım, CRM aşamasını güncelledim. İmza düştüğünde haber vereceğim.',
        timestamp: '2025-09-01T09:18:22Z',
        read: false,
      },
    ],
  }),

  // Zelal (rep-2) — SKTT kapsamında kurumsal hitap, rakip teklife karşı pozisyon
  withUpdatedAt({
    id: 'conv-2',
    title: 'Zelal • SKTT Kurumsal & Karşı Teklif',
    userId: 'rep-2',
    participantA: 'you',
    participantB: 'rep-2',
    messages: [
      {
        id: 'msg201',
        senderId: 'rep-2',
        recipientId: 'you',
        text:
          'Üsküdar’daki yeni ticari aday sisteme düştü. Yıllık ~18.4 MWh → SKTT kapsamında. “Sayın Yetkili” ile başlayan kurumsal tasarruf metnini oluşturdum.',
        timestamp: '2025-08-30T14:20:03Z',
        read: true,
      },
      {
        id: 'msg202',
        senderId: 'you',
        recipientId: 'rep-2',
        text:
          'Mükemmel. Rakip fiyat varsa “toplam sahip olma maliyeti” vurgusuyla karşılaştırma görselini ekle; e-imza akışını da not düş.',
        timestamp: '2025-08-30T14:25:11Z',
        read: true,
      },
      {
        id: 'msg203',
        senderId: 'rep-2',
        recipientId: 'you',
        text:
          'Rakip teklifi geldi. Biz %6 avantajlıyız. Sunuma net tasarruf, sözleşme süresi ve çıkış koşullarını ekledim. Yarın CFO ile görüşmede kullanacağım.',
        timestamp: '2025-09-02T07:10:00Z',
        read: false,
      },
    ],
  }),

  // Şöhret (rep-3) — lead, itiraz karşılama, kapanış
  withUpdatedAt({
    id: 'conv-3',
    title: 'Şöhret • Lead → İtiraz → Kapanış',
    userId: 'rep-3',
    participantA: 'you',
    participantB: 'rep-3',
    messages: [
      {
        id: 'msg301',
        senderId: 'you',
        recipientId: 'rep-3',
        text:
          'Kadıköy’deki yeni lead’i gördüm. İlk görüşmede en yüksek etki: “son faturanızdaki net tasarrufu” net bir dille söyle. Objeksiyon: “uzun sözleşme” gelebilir.',
        timestamp: '2025-09-01T11:30:00Z',
        read: true,
      },
      {
        id: 'msg302',
        senderId: 'rep-3',
        recipientId: 'you',
        text:
          'Anlaşıldı. 12 ay + yenileme opsiyonlu sundum, “esnek çıkış” alternatifini de ekledim. Müşteri olumlu.',
        timestamp: '2025-09-01T11:32:15Z',
        read: true,
      },
      {
        id: 'msg303',
        senderId: 'rep-3',
        recipientId: 'you',
        text:
          'Kapanış metni: “Şirketinizin yıllık ~X TL tasarruf potansiyelini birlikte onaylayalım; e-imza linkini hemen paylaşayım.” Geri dönüş bekliyorum.',
        timestamp: '2025-09-01T15:00:00Z',
        read: false,
      },
    ],
  }),

  // Mert (rep-4) — sanayi müşterisi, çok lokasyon konsolidasyon, toplantı
  withUpdatedAt({
    id: 'conv-4',
    title: 'Mert • Sanayi Konsolidasyon & Toplantı',
    userId: 'rep-4',
    participantA: 'you',
    participantB: 'rep-4',
    messages: [
      {
        id: 'msg401',
        senderId: 'rep-4',
        recipientId: 'you',
        text:
          'Tuzla OSB’de sanayi müşterisi: çok lokasyonlu yapı. Konsolide teklif ve tek sözleşme tercih ediyorlar.',
        timestamp: '2025-09-02T08:12:10Z',
        read: true,
      },
      {
        id: 'msg402',
        senderId: 'you',
        recipientId: 'rep-4',
        text:
          'Süper. “Çok lokasyon = tek temas + tek fatura” faydasını öne çıkar. Örnek tasarruf hesabını tabloya koy.',
        timestamp: '2025-09-02T08:18:44Z',
        read: true,
      },
      {
        id: 'msg403',
        senderId: 'rep-4',
        recipientId: 'you',
        text:
          'Perşembe 11:00 toplantısı onaylandı. Sunum slaytını güncelledim; kapanış cümlesine e-imza çağrısı ekledim.',
        timestamp: '2025-09-02T08:20:30Z',
        read: false,
      },
    ],
  }),

  // Portföy koruma — rakip teklif karşılaştırması, yenileme
  withUpdatedAt({
    id: 'conv-5',
    title: 'Serkan • Portföy Koruma & Yenileme',
    userId: 'rep-1',
    participantA: 'you',
    participantB: 'rep-1',
    messages: [
      {
        id: 'msg501',
        senderId: 'you',
        recipientId: 'rep-1',
        text:
          'XYZ Kuruyemiş rakipten fiyat aldı. Mevcut fatura ve kullanım profiliyle karşılaştırma kartını bugün çıkarabilir misin?',
        timestamp: '2025-09-02T09:05:00Z',
        read: true,
      },
      {
        id: 'msg502',
        senderId: 'rep-1',
        recipientId: 'you',
        text:
          'Kart hazır. Toplam maliyette %8 avantaj gösteriyoruz. Yenileme teklifine “erken onay bonusu” notunu ekledim.',
        timestamp: '2025-09-02T09:26:40Z',
        read: false,
      },
    ],
  }),
];

// Hem named hem default export veriyoruz:
export default mockConversations;
