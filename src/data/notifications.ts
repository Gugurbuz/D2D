// src/data/notifications.ts
export type AppNotification = {
  id: string;
  title: string;
  desc?: string;
  timeAgo: string; // "5 dk", "2s", "Dün" gibi
  type: "assignment" | "visit" | "system";
  unread: boolean;
};

export const mockNotifications: AppNotification[] = [
  {
    id: "n1",
    title: "3 müşteri atandı",
    desc: "Zelal Kaya: 3 yeni ziyaret",
    timeAgo: "5 dk",
    type: "assignment",
    unread: true,
  },
  {
    id: "n2",
    title: "Ziyaret tamamlandı",
    desc: "Mehmet Yılmaz — %12 indirim kabul edildi",
    timeAgo: "32 dk",
    type: "visit",
    unread: true,
  },
  {
    id: "n3",
    title: "Sistem bildirimi",
    desc: "Harita servisi normal çalışıyor",
    timeAgo: "1 s",
    type: "system",
    unread: false,
  },
];
