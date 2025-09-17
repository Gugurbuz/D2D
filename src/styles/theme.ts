// src/styles/theme.ts
// ... mevcut import / renkler ...

// KPI kart renkleri (mevcutsa genişletiyoruz)
export const kpiCardColors = {
  target: {
    border: "border-[#002D72]", // navy
    bg: "bg-[#002D72]/10",
    icon: "text-[#002D72]",
    chip: { bg: "bg-[#002D72]/10", text: "text-[#002D72]", ring: "ring-[#002D72]/20" },
  },
  completed: {
    border: "border-green-600",
    bg: "bg-green-50",
    icon: "text-green-600",
    chip: { bg: "bg-green-50", text: "text-green-700", ring: "ring-green-200" },
  },
  pending: {
    border: "border-amber-600",
    bg: "bg-amber-50",
    icon: "text-amber-600",
    chip: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  },
  performance: {
    border: "border-blue-600",
    bg: "bg-blue-50",
    icon: "text-blue-600",
    chip: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200" },
  },
  // İsteğe bağlı: hata/iptal
  rejected: {
    border: "border-red-600",
    bg: "bg-red-50",
    icon: "text-red-600",
    chip: { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-200" },
  },
} as const;

// Uygulamadaki statü -> KPI tipi eşlemesi
const statusToKpiType: Record<string, keyof typeof kpiCardColors> = {
  // TR statüler
  "Bekliyor": "pending",
  "Devam Ediyor": "performance",
  "Tamamlandı": "completed",
  "Reddedildi": "rejected",
  "İptal": "rejected",
  "Başladı": "performance",
  // Fallback
  "": "pending",
};

// VisitCard’daki statü chip’i için doğrudan sınıf üreticisi
export function getStatusChipClasses(status?: string) {
  const type = statusToKpiType[status ?? ""] ?? "pending";
  const chip = kpiCardColors[type].chip;
  return `${chip.bg} ${chip.text} ring-1 ${chip.ring}`;
}

// (Opsiyonel) Öncelik -> KPI tipi eşlemesi (ör: Yüksek/Orta/Düşük)
const priorityToKpiType: Record<string, keyof typeof kpiCardColors> = {
  "Yüksek": "rejected",     // daha dikkat çekici = kırmızımsı
  "Orta": "performance",    // mavi
  "Düşük": "pending",       // amber
};

export function getPriorityChipClasses(priority?: string) {
  const type = priorityToKpiType[priority ?? ""] ?? "pending";
  const chip = kpiCardColors[type].chip;
  return `${chip.bg} ${chip.text} ring-1 ${chip.ring}`;
}
