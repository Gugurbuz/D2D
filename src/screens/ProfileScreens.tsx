import React, { useState } from "react";
import { User, CheckCircle2 } from "lucide-react";

// ===== Types (Değişiklik yok) =====
export type Role = "sales" | "manager";
export type Notifications = { email: boolean; sms: boolean; push: boolean };
export type WorkDays = { mon: boolean; tue: boolean; wed: boolean; thu: boolean; fri: boolean; sat: boolean; sun: boolean };

export type BaseUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  district?: string;
  region?: string;
  avatarUrl?: string;
  language?: "tr" | "en";
  units?: "metric" | "imperial";
  theme?: "system" | "light" | "dark";
  notifications?: Notifications;
  shareLiveLocation?: boolean;
};

export type SalesUser = BaseUser & {
  role: "sales";
  dailyVisitTarget?: number;
  vehicle?: "walking" | "bike" | "car";
  workHours?: { start: string; end: string };
  workDays?: WorkDays;
  breakTimes?: { start: string; end: string };
  defaultMapZoom?: number;
  autoCheckinRadiusMeters?: number;
  idVerified?: boolean;
  prefersOptimizedRoutes?: boolean;
};

export type ManagerUser = BaseUser & {
  role: "manager";
  teamName?: string;
  teamSize?: number;
  territory?: string;
  autoAssignMethod?: "equal_count" | "km_optimized";
  preventOverlap?: boolean;
  maxAutoAssignPerRep?: number;
  slaDailyVisitTarget?: number;
  coverageGoalPct?: number;
  exportFormat?: "xlsx" | "csv" | "pdf";
  reportTime?: string;
};

// ===== YENİ: Gerçek Veri Kaynağı =====
const reps: (SalesUser | ManagerUser)[] = [
  {
    id: "rep-1",
    role: "sales",
    name: "Mehmet Yılmaz",
    email: "mehmet.yilmaz@example.com",
    phone: "+90 555 111 22 33",
    district: "Kadıköy",
    region: "İstanbul Anadolu",
    dailyVisitTarget: 20,
    vehicle: "car",
    workHours: { start: "09:00", end: "18:00" },
    workDays: { mon:true, tue:true, wed:true, thu:true, fri:true, sat:false, sun:false },
    language: "tr",
    theme: "light",
    notifications: { email: true, sms: false, push: true },
  },
  {
    id: "rep-2",
    role: "sales",
    name: "Zeynep Kaya",
    email: "zeynep.kaya@example.com",
    phone: "+90 555 222 33 44",
    district: "Üsküdar",
    region: "İstanbul Anadolu",
    dailyVisitTarget: 25,
    vehicle: "walking",
    workHours: { start: "08:30", end: "17:30" },
    workDays: { mon:true, tue:true, wed:true, thu:true, fri:true, sat:true, sun:false },
    language: "tr",
    theme: "system",
    notifications: { email: true, sms: true, push: true },
  },
  {
    id: "manager-1",
    role: "manager",
    name: "Ayşe Demir",
    email: "ayse.demir@example.com",
    phone: "+90 555 444 55 66",
    region: "İstanbul Anadolu",
    territory: "Anadolu 1. Bölge",
    teamName: "Kadıköy Ekip",
    teamSize: 8,
    autoAssignMethod: "km_optimized",
    preventOverlap: true,
    exportFormat: "xlsx",
    reportTime: "18:00",
    language: "tr",
    theme: "dark",
    notifications: { email: true, sms: false, push: false },
  },
];

// ===== KALDIRILDI: Artık bu mock'lara ihtiyaç yok =====
// const defaultBase: BaseUser = ...
// const defaultSales: SalesUser = ...
// const defaultManager: ManagerUser = ...

// ===== UI Bileşenleri (Değişiklik yok) =====
// FieldRow, Input, Select, Switch, SaveBar, Section, SideNav, ToggleLine...
// Bu bileşenler önceki kodunuzdaki gibi kalacak, buraya tekrar eklenmedi.

// ===== Sales Profile (Değişiklik yok, artık dinamik user alacak) =====
export const SalesProfile: React.FC<{ user: SalesUser }> = ({ user }) => {
  const [form, setForm] = useState<SalesUser>(user);
  // ... Geri kalan kodun tamamı aynı, sadece prop'tan gelen 'user' ile başlıyor.
  // ...
};

// ===== Manager Profile (Değişiklik yok, artık dinamik user alacak) =====
export const ManagerProfile: React.FC<{ user: ManagerUser }> = ({ user }) => {
  const [form, setForm] = useState<ManagerUser>(user);
  // ... Geri kalan kodun tamamı aynı, sadece prop'tan gelen 'user' ile başlıyor.
  // ...
};


// ===== DEĞİŞTİRİLDİ: Wrapper Component'in yeni hali =====
const ProfileScreens: React.FC<{ userId: string }> = ({ userId }) => {
  // 1. Gelen userId ile reps dizisinden doğru kullanıcıyı bul
  const user = reps.find((r) => r.id === userId);

  // 2. Kullanıcı bulunamazsa bir hata mesajı veya yükleniyor ekranı göster
  if (!user) {
    return <div className="p-8 text-center text-red-500">Kullanıcı bulunamadı! ID: {userId}</div>;
  }

  // 3. Kullanıcının rolüne göre doğru bileşeni, bulunan kullanıcı verisiyle render et
  if (user.role === "sales") {
    return <SalesProfile user={user as SalesUser} />;
  }
  
  if (user.role === "manager") {
    return <ManagerProfile user={user as ManagerUser} />;
  }

  return <div>Geçersiz kullanıcı rolü.</div>
};

export default ProfileScreens;