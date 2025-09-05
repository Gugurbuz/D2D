import React, { useState } from "react";
import { User, CheckCircle2 } from "lucide-react"; // ve diğer UI bileşenleri...

// Veri artık merkezi team.ts dosyasından import ediliyor.
import { teamReps, managerUser } from '../data/team';

// ===== Types =====
// Tipleriniz burada tanımlı...
export type Role = "sales" | "manager";
export type SalesUser = { /*...*/ role: 'sales' } & BaseUser;
export type ManagerUser = { /*...*/ role: 'manager' } & BaseUser;
// ...diğer tipler...

// ===== UI Bileşenleri (Input, Select, Section vb.) =====
// Tüm UI bileşenleriniz (Input, Select, Section...) burada olmalı.
// Kodun kısa kalması için buraya tekrar eklemiyorum.

// YENİ: Import edilen verileri arama yapmak için tek bir dizide birleştirelim.
const allUsers = [...teamReps, managerUser];


// ===== Sales Profile BİLEŞENİ DÜZELTMESİ =====
export const SalesProfile: React.FC<{ user: SalesUser }> = ({ user }) => {
  // DEĞİŞİKLİK: useState artık silinen 'defaultSales' yerine doğrudan prop'tan gelen 'user'ı kullanıyor.
  const [form, setForm] = useState<SalesUser>(user);
  
  // ... Geri kalan SalesProfile kodunuz (set, onSave, JSX vb.) burada olmalı ...
  // Örnek olarak JSX'in başlangıcı:
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      {/* ... SalesProfile'ın tüm JSX içeriği ... */}
    </div>
  );
};

// ===== Manager Profile BİLEŞENİ DÜZELTMESİ =====
export const ManagerProfile: React.FC<{ user: ManagerUser }> = ({ user }) => {
  // DEĞİŞİKLİK: useState artık silinen 'defaultManager' yerine doğrudan prop'tan gelen 'user'ı kullanıyor.
  const [form, setForm] = useState<ManagerUser>(user);

  // ... Geri kalan ManagerProfile kodunuz (set, onSave, JSX vb.) burada olmalı ...
  // Örnek olarak JSX'in başlangıcı:
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      {/* ... ManagerProfile'ın tüm JSX içeriği ... */}
    </div>
  );
};


// ===== Wrapper Component (Bu zaten doğruydu, tekrar tam hali) =====
const ProfileScreens: React.FC<{ userId: string }> = ({ userId }) => {
  const user = allUsers.find((r) => r.id === userId);

  if (!user) {
    return <div className="p-8 text-center text-red-500">Kullanıcı bulunamadı! ID: {userId}</div>;
  }

  if (user.role === "sales") {
    return <SalesProfile user={user as SalesUser} />;
  }
  
  if (user.role === "manager") {
    return <ManagerProfile user={user as ManagerUser} />;
  }

  return <div>Geçersiz kullanıcı rolü.</div>;
};

export default ProfileScreens;