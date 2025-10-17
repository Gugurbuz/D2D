// src/guide/guideConfig.ts
export type AppRole = "satisUzmani" | "sahaYonetici";
export type AppScreen = "dashboard" | "routeMap" | "visitList" | "assignmentMap";

export type GuideStep = {
  target: string;            // CSS selector
  content: string;           // sadece düz metin (string) — JSX YOK
  placement?: "top"|"bottom"|"left"|"right"|"auto";
  disableBeacon?: boolean;
};

export type CheatItem = { title: string; bullets: string[] };

export type ScreenGuide = {
  tourSteps: GuideStep[];
  cheatsheet: CheatItem[];
  tips?: string[];
  hotkeys?: { combo: string; desc: string }[];
};

export type GuideConfig = Record<AppRole, Record<AppScreen, ScreenGuide>>;

export const GUIDE_VERSION = "1.0.0";

export const guideConfig: GuideConfig = {
  satisUzmani: {
    routeMap: {
      tourSteps: [
        { target: "[data-tour-id='map']",        content: "Harita üzerinde planlı ziyaretlerinizi görürsünüz.", placement: "bottom", disableBeacon: true },
        { target: "[data-tour-id='optimize']",   content: "Rota optimizasyonunu başlatın." },
        { target: "[data-tour-id='filters']",    content: "Filtrelerle hedef müşteri setini daraltın." },
        { target: "[data-tour-id='visit-list']", content: "Ziyaret listesine hızlı geçiş yapın." },
      ],
      cheatsheet: [
        {
          title: "Bu ekranda neler yaparım?",
          bullets: [
            "Planlı ziyaretleri haritada gör ve sırala",
            "‘Optimize Et’ ile rota sırasını hesapla",
            "Filtrelerle hedef müşteri setini daralt",
            "Ziyaret detaya gidip sonuç gir"
          ]
        },
        {
          title: "İpuçları",
          bullets: [
            "Favori müşterileri yıldızlayarak öne çıkar.",
            "Yoğun bölgelerde yakınlaştırmayı kullan."
          ]
        }
      ],
      tips: ["Haritada layer’ları aç/kapa menüsünü deneyin."],
      hotkeys: [{ combo: "—", desc: "Tablet modunda kısayol yok" }]
    },
    visitList: {
      tourSteps: [
        { target: "[data-tour-id='search']", content: "Buradan müşteri araması yapabilirsiniz." },
        { target: "[data-tour-id='row']",    content: "Satıra dokunarak detay ekranına geçin." },
        { target: "[data-tour-id='result']", content: "Ziyaret sonucunu kaydedin." },
      ],
      cheatsheet: [
        {
          title: "Hızlı İşlemler",
          bullets: [
            "Müşteri adına dokun → detay",
            "Toplu seçim → rota ekle",
            "Sonuç gir → raporlamaya yansır"
          ]
        }
      ]
    },
    dashboard: {
      tourSteps: [
        { target: "[data-tour-id='kpi-cards']", content: "Günlük hedef & performans kartları." },
        { target: "[data-tour-id='actions']",    content: "Önerilen sonraki aksiyonlar." },
      ],
      cheatsheet: [
        {
          title: "Görebildiklerim",
          bullets: ["Hedefim", "Tamamlanan ziyaret", "Teklif/Satış oranları"]
        }
      ]
    },
    // not: bu ekran aslında yöneticide, satış uzmanına kısıtlı bilgi
    assignmentMap: {
      tourSteps: [],
      cheatsheet: [{ title: "Not", bullets: ["Bu ekran saha yöneticisine özeldir."] }],
    }
  },

  sahaYonetici: {
    dashboard: {
      tourSteps: [
        { target: "[data-tour-id='kpi-cards']", content: "Takım KPI’ları, trendler ve karşılaştırmalar." },
        { target: "[data-tour-id='league']",    content: "Satış Ligi skor tablosu." },
      ],
      cheatsheet: [
        { title: "Yapabileceklerim", bullets: ["Takım KPI takibi", "Bölgeler arası performans karşılaştırma"] }
      ]
    },
    assignmentMap: {
      tourSteps: [
        { target: "[data-tour-id='areas']",    content: "Satış temsilcisi sayısı kadar alanı görün/yönetin." },
        { target: "[data-tour-id='optimize']", content: "Dağılımı Optimize Et ile önerin." },
        { target: "[data-tour-id='save']",     content: "Atamaları kaydedin ve paylaşın." },
      ],
      cheatsheet: [
        { title: "Bu ekranda neler yaparım?", bullets: ["Alanları çiz/incele", "Optimize Et ile öneri dağıt", "Atamaları kaydet & paylaş"] }
      ],
      tips: ["Bölgeler kesişmemeli; optimizasyon sonrası kısa bir manuel inceleme yapın."]
    },
    // yöneticide bu iki ekran bilgilendirme odaklı
    routeMap:  { tourSteps: [], cheatsheet: [{ title: "Not", bullets: ["Bu ekran saha uzmanına odaklıdır."] }] },
    visitList: { tourSteps: [], cheatsheet: [{ title: "Not", bullets: ["Listeleme ve sonuç girişi uzman tarafında."] }] }
  }
};
