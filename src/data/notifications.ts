// src/data/notifications.ts

export type AppNotification = {
  id: string;
  title: string;
  desc?: string;
  timeAgo: string;
  type: "assignment" | "visit" | "system";
  unread?: boolean;
};

export const mockNotifications: AppNotification[] = [
  {
    id: "n1",
    title: "3 müşteri Zelal Kaya’ya atandı",
    desc: "Kadıköy, Üsküdar, Ataşehir",
    timeAgo: "3 dk önce",
    type: "assignment",
    unread: true,
  },
  {
    id: "n2",
    title: "Serkan Özkan 2 ziyareti tamamladı",
    desc: "Tamamlanan oranı %40",
    timeAgo: "32 dk önce",
    type: "visit",
    unread: true,
  },
  {
    id: "n3",
    title: "Sistem bakımı 22:00–23:00",
    timeAgo: "1 saat önce",
    type: "system",
    unread: false,
  },
];