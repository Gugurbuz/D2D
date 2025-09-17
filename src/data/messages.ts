// src/data/messages.ts
// Enerjisa saha satış senaryoları için güncellenmiş mock mesajlar

import { teamReps } from './team';

/** Tekil mesaj */
export type Message = {
  id: string;
  senderId: string;   // 'you' veya rep id (rep-1, rep-2, ...)
  recipientId: string;
  text: string;
  timestamp: string;  // ISO 8601
  read: boolean;
};

/** Konuşma (UI uyumluluğu için ekstra alanlar eklendi) */
export type Conversation = {
  id: string;                 // UI'da key olarak kullanılıyor
  title?: string;             // Menü başlığı
  userId?: string;            // Karşı taraf rep id (Navigation menüsünde avatar için)
  participantA: string;       // genelde 'you'
  participantB: string;       // rep id
  updatedAt?: string;         // son mesaj zamanı
  messages: Message[];
};

/** Yardımcı: son mesajın zamanını updatedAt olarak yaz */
function withUpdatedAt(conv: Omit<Conversation, 'updatedAt'>): Conversation {
  const last = conv.messages[conv.messages.length - 1];
  return { ...conv, updatedAt: last ? last.timestamp : undefined };
}

/** Saha operasyonlarına uygun senaryolar */
export const mockConversations: Conversation[] = [
  // Serkan (rep-1) — BZV, OCR ve e-imza akışı
  withUpdatedAt({
    id: 'conv-1',
    title: 'Serkan • Maltepe BZV & Teklif',
    userId: 'rep-1',
    participantA: 'you',
    participantB: 'rep-1',
    messages: [
      {
        id: 'msg101',
        senderId: 'rep-1',
        recipientId: 'you',
        text:
          'Günaydın 🙌 Maltepe BZV için rota hazır. Yıldızlı müşteri: ABC Gıda. İlk durak olarak işaretledim.',
        timestamp: '2025-09-01T08:35:12Z',
        read: true,
      },
      {
        id: 'msg102',
        senderId: 'you',
        recipientId: 'rep-1',
        text:
          'Süper. Faturayı OCR’dan geçir, birim enerjiye bakıp tasarruf mesajını hazırla lütfen.',
        timestamp: '2025-09-01T08:37:20Z',
        read: true,
      },
      {
        id: 'msg103',
        senderId: 'rep-1',
        recipientId: 'you',
        text:
          'OCR tamam: Rakip Gediz E.P.S.A. – birim enerji 3.516 TL/kWh, yıllık tüketim 1.022 kWh. Biz varsayılan 2.000 TL/kWh ile ~1.548 TL/yıl tasarruf çıkıyor. Sunum dilini satışçı üslubuna çevirdim.',
        timestamp: '2025-09-01T09:05:12Z',
        read: true,
      },
      {
        id: 'msg104',
        senderId: 'you',
        recipientId: 'rep-1',
        text:
          'Harika 👌 Görüşmede “faturada gördüğümüz net tasarruf” vurgusunu öne çıkar. Kabul gelirse e-imza linki gönder.',
        timestamp: '2025-09-01T09:07:45Z',
        read: true,
      },
      {
        id: 'msg105',
        senderId: 'rep-1',
        recipientId: 'you',
        text:
          'Müşteri onay verdi ✅ E-imza linkini SMS ve e-posta ile ilettim. İmzalanınca haber vereceğim.',
        timestamp: '2025-09-01T09:18:22Z',
        read: false,
      },
    ],
  }),

  // Zelal (rep-2) — SKTT kontrolü, kurumsal hitap ve planlı bakım bilgilendirmesi
  withUpdatedAt({
    id: 'conv-2',
    title: 'Zelal • SKTT & Planlı Bakım',
    userId: 'rep-2',
    participantA: 'you',
    participantB: 'rep-2',
    messages: [
      {
        id: 'msg201',
        senderId: 'rep-2',
        recipientId: 'you',
        text:
          'Üsküdar’daki yeni ticarethane adayı sisteme eklendi. Yıllık ~18.4 MWh görünüyor; SKTT kapsamında.',
        timestamp: '2025-08-30T14:20:03Z',
        read: true,
      },
      {
        id: 'msg202',
        senderId: 'you',
        recipientId: 'rep-2',
        text:
          'Onayladım. Kurumsal hitap metnini kullan: “Sayın Yetkili” ile başlayıp tasarruf ve sözleşme adımlarını özetle.',
        timestamp: '2025-08-30T14:25:11Z',
        read: true,
      },
      {
        id: 'msg203',
        senderId: 'rep-2',
        recipientId: 'you',
        text:
          'Not: Bölgedeki planlı bakım perşembe 10:00–13:00. Ziyareti 14:30’a aldım; müşteriyi önceden bilgilendirdim.',
        timestamp: '2025-09-02T07:10:00Z',
        read: false,
      },
    ],
  }),

  // Şöhret (rep-3) — kesme/bağlama, borç kapama ve açma talebi
  withUpdatedAt({
    id: 'conv-3',
    title: 'Şöhret • Kesme/Bağlama & Açma Talebi',
    userId: 'rep-3',
    participantA: 'you',
    participantB: 'rep-3',
    messages: [
      {
        id: 'msg301',
        senderId: 'you',
        recipientId: 'rep-3',
        text:
          'Kadıköy’de kesme ihbarnamesi olan abone borcu kapatmış. Açma talebini açma-kapama ekibine ilettik mi?',
        timestamp: '2025-09-01T11:30:00Z',
        read: true,
      },
      {
        id: 'msg302',
        senderId: 'rep-3',
        recipientId: 'you',
        text:
          'Evet, iş emri oluşturuldu. OSOS sayaçta anlık değer geliyor; sahaya bilgi geçildi. Tahmini 2 saat içinde aktif.',
        timestamp: '2025-09-01T11:32:15Z',
        read: true,
      },
      {
        id: 'msg303',
        senderId: 'rep-3',
        recipientId: 'you',
        text:
          'Ayrıca yarınki SKTT sunum taslağını mailledim; fiyat karşılaştırma slaydına göz atabilir misin?',
        timestamp: '2025-09-01T15:00:00Z',
        read: false,
      },
    ],
  }),

  // Mert (rep-4) — sanayi müşterisi, yerinde keşif & bağlantı gücü
  withUpdatedAt({
    id: 'conv-4',
    title: 'Mert • Sanayi Keşif & Bağlantı Gücü',
    userId: 'rep-4',
    participantA: 'you',
    participantB: 'rep-4',
    messages: [
      {
        id: 'msg401',
        senderId: 'rep-4',
        recipientId: 'you',
        text:
          'Tuzla OSB’de yeni sanayi müşterisi: bağlantı gücü artışı talep ediyor. Keşif için perşembe 11:00 uygun mu?',
        timestamp: '2025-09-02T08:12:10Z',
        read: true,
      },
      {
        id: 'msg402',
        senderId: 'you',
        recipientId: 'rep-4',
        text:
          'Uygun. Keşifte kompanzasyon durumu ve pik saat tüketimini not al. Teklifte reaktif ceza riskini de anlat.',
        timestamp: '2025-09-02T08:18:44Z',
        read: true,
      },
      {
        id: 'msg403',
        senderId: 'rep-4',
        recipientId: 'you',
        text:
          'Anlaşıldı. Keşif sonrası OCR + tasarruf metniyle e-imza sürecini başlatırım.',
        timestamp: '2025-09-02T08:20:30Z',
        read: false,
      },
    ],
  }),

  // Bonus: Portföy koruma & rakip karşılaştırma
  withUpdatedAt({
    id: 'conv-5',
    title: 'Serkan • Portföy Koruma',
    userId: 'rep-1',
    participantA: 'you',
    participantB: 'rep-1',
    messages: [
      {
        id: 'msg501',
        senderId: 'you',
        recipientId: 'rep-1',
        text:
          'XYZ Kuruyemiş rakipten fiyat aldı. Mevcut fatura verisiyle karşılaştırma kartını hazırlayıp bugün paylaşabilir misin?',
        timestamp: '2025-09-02T09:05:00Z',
        read: true,
      },
      {
        id: 'msg502',
        senderId: 'rep-1',
        recipientId: 'you',
        text:
          'Hazırladım. Birim enerji ve dağıtım kalemlerini ayrıştırdım, toplamda %8 avantajdayız. Müşteriye “yenilemede ek avantaj” söylemiyle gideceğim.',
        timestamp: '2025-09-02T09:26:40Z',
        read: false,
      },
    ],
  }),
];
