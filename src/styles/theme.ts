// src/styles/theme.ts

// 1. Uygulama genelinde kullanılacak renk paletini tanımla
export const themeColors = {
  primary: {
    DEFAULT: "#0099CB", // Ana marka rengi
    light: "#e0f5ff",
    dark: "#007ca8",
    text: "#ffffff",
  },
  neutral: {
    DEFAULT: "#64748b", // Nötr durumlar için
    light: "#f1f5f9",
    dark: "#334155",
    text: "#334155",
  },
  success: {
    DEFAULT: "#10b981", // Başarılı (Tamamlandı) -> Zümrüt Yeşili
    light: "#ecfdf5",
    dark: "#059669",
    text: "#065f46",
  },
  warning: {
    DEFAULT: "#f59e0b", // Uyarı (Planlandı) -> Kehribar Sarısı/Turuncu
    light: "#fffbeb",
    dark: "#b45309",
    text: "#854d0e",
  },
  danger: {
    DEFAULT: "#ef4444", // Tehlike (İptal) -> Kırmızı
    light: "#fee2e2",
    dark: "#b91c1c",
    text: "#991b1b",
  },
  info: {
    DEFAULT: "#3b82f6", // Bilgi (Yolda) -> Mavi
    light: "#dbeafe",
    dark: "#2563eb",
    text: "#1e40af",
  },
};

// 2. Durum isimlerini renk anahtarlarıyla eşleştir
// "Planlandı" dendiğinde her zaman 'warning' rengini kullanacağımızı burada belirtiyoruz.
export const statusStyles: Record<string, keyof typeof themeColors> = {
  "Planlandı": "warning",
  "Tamamlandı": "success",
  "İptal": "danger",
  "Yolda": "info",
  "Tümü": "primary",
  "Bugün": "primary",
  "Yarın": "primary",
  "Bu Hafta": "primary",
  "Tarihe Göre": "neutral",
  "Önceliğe Göre": "neutral",
};