// src/data/messages.ts

import { teamReps } from './team';

// Mesaj tipini tanımlayalım
export type Message = {
  id: string;
  senderId: string;   // 'rep-1', 'rep-2' etc.
  recipientId: string;
  text: string;
  timestamp: string; // ISO 8601 formatında tarih ve saat
  read: boolean;
};

// Konuşma tipini tanımlayalım (iki kişi arasındaki tüm mesajlar)
export type Conversation = {
  participantA: string; // repId
  participantB: string; // repId
  messages: Message[];
};

// Sahte (Mock) Mesaj Verileri
// "You" sihirli bir ID'dir ve "uygulamayı kullanan siz" anlamına gelir.
export const mockConversations: Conversation[] = [
  // Serkan ile olan konuşma
  {
    participantA: 'you',
    participantB: 'rep-1',
    messages: [
      { id: 'msg101', senderId: 'rep-1', recipientId: 'you', text: 'Günaydın, Maltepe bölgesindeki rota optimizasyonunu onayladım. Trafik tahmini iyi görünüyor.', timestamp: '2025-09-01T09:05:12Z', read: true },
      { id: 'msg102', senderId: 'you', recipientId: 'rep-1', text: 'Harika haber Serkan, teşekkürler! Öğleden sonraki ziyaretlerin için bir hatırlatma: ABC A.Ş. sipariş detaylarını teyit etmeni rica etti.', timestamp: '2025-09-01T09:07:45Z', read: true },
      { id: 'msg103', senderId: 'rep-1', recipientId: 'you', text: 'Tamamdır, aklımda. Ziyaret öncesi arayıp teyit alacağım.', timestamp: '2025-09-01T09:08:22Z', read: false },
    ]
  },
  // Zelal ile olan konuşma
  {
    participantA: 'you',
    participantB: 'rep-2',
    messages: [
      { id: 'msg201', senderId: 'rep-2', recipientId: 'you', text: 'Üsküdar\'daki yeni müşteri adayını sisteme ekledim, onaya gönderildi.', timestamp: '2025-08-30T14:20:03Z', read: true },
      { id: 'msg202', senderId: 'you', recipientId: 'rep-2', text: 'Gördüm Zelal, eline sağlık. Onaylandı.', timestamp: '2025-08-30T14:25:11Z', read: true },
    ]
  },
  // Şöhret ile olan konuşma
  {
    participantA: 'you',
    participantB: 'rep-3',
    messages: [
      { id: 'msg301', senderId: 'you', recipientId: 'rep-3', text: 'Şöhret, Kadıköy\'deki teslimat gecikmesiyle ilgili müşteri geri bildirimde bulundu. Bilgin var mı?', timestamp: '2025-09-01T11:30:00Z', read: true },
      { id: 'msg302', senderId: 'rep-3', recipientId: 'you', text: 'Evet, lojistikle görüştüm. Yoğunluktan kaynaklı bir aksama olmuş, telafi edeceğiz. Müşteriyi bilgilendirdim.', timestamp: '2025-09-01T11:32:15Z', read: false },
       { id: 'msg303', senderId: 'rep-3', recipientId: 'you', text: 'Bu arada, yarınki sunum için hazırladığım taslağı mail attım, kontrol edebilir misin?', timestamp: '2025-09-01T15:00:00Z', read: false },
    ]
  },
   // Mert ile olan konuşma (henüz mesaj yok)
  {
    participantA: 'you',
    participantB: 'rep-4',
    messages: []
  },
];