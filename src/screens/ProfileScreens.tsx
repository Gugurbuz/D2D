import React, { useState } from "react";
import { User, CheckCircle2 } from "lucide-react";

// YENİ: Veri artık team.ts dosyasından import ediliyor.
// Dosya yolunun projenizdekiyle eşleştiğinden emin olun.
import { teamReps, managerUser } from '../data/team';

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

// YENİ: Import edilen verileri arama yapmak için tek bir dizide birleştirelim.
const allUsers = [...teamReps, managerUser];

// KALDIRILDI: Veri artık bu dosyada değil, team.ts'de tutuluyor.
// const reps: (SalesUser | ManagerUser)[] = [ ... ];

// ===== UI Bileşenleri ve Profil Bileşenleri (Değişiklik yok) =====
// SalesProfile ve ManagerProfile bileşenlerinin içeriği aynı kaldığı için
// buraya tekrar eklenmedi. Sizin dosyanızda olduğu gibi kalmalılar.
// export const SalesProfile: React.FC<{ user: SalesUser }> = ({ user }) => { ... };
// export const ManagerProfile: React.FC<{ user: ManagerUser }> = ({ user }) => { ... };

// ===== Wrapper Component'in DÜZELTİLMİŞ ve SON hali =====
const ProfileScreens: React.FC<{ userId: string }> = ({ userId }) => {
  // Veri artık merkezi `allUsers` dizisinden geliyor.
  const user = allUsers.find((r) => r.id === userId);

  // Kullanıcı bulunamazsa hata mesajı göster.
  if (!user) {
    return <div className="p-8 text-center text-red-500">Kullanıcı bulunamadı! ID: {userId}</div>;
  }

  // --- DEĞİŞİKLİK BURADA ---
  // Rol'e göre GEÇİCİ div'ler yerine GERÇEK bileşenleri render et.
  if (user.role === "sales") {
    // SalesProfile bileşeninizin burada render edilmesi gerekiyor.
    return <SalesProfile user={user as SalesUser} />;
  }
  
  if (user.role === "manager") {
    // ManagerProfile bileşeninizin burada render edilmesi gerekiyor.
    return <ManagerProfile user={user as ManagerUser} />;
  }

  return <div>Geçersiz kullanıcı rolü.</div>;
};
export default ProfileScreens;