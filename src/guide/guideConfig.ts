// Rol ve ekranlara göre tur adımları, yardım içeriği ve kısayollar
export type AppRole = "satisUzmani" | "sahaYonetici";
export type AppScreen = "dashboard" | "routeMap" | "visitList" | "assignmentMap";

export type GuideStep = {
  target: string;            // CSS selector (id, class ya da [data-tour-id])
  content: string;           // TR içerik
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
        { target: "[data-tour-id='map']", content: "Harita üzerinde planlı ziyaretlerinizi görürsünüz.", placement: "bottom", disableBeacon: true },
        { target: "[data-tour-id='optimize']", content: "Rota optimizasyonu ile sırayı otomatik hesaplayın." },
        { target: "[data-tour-id='filters']", content: "Filtrelerden bölge/tarife/öncelik kırpması yapın." },
        { target: "[data-tour-id='visit-list']", content: "Ziyaret listesine hızlı geçiş yapabilirsiniz." },
      ],
      cheatsheet: [
        {
          title: "Bu ekranda neler yaparım?",
          bullets: [
            "Planlı ziyaretleri haritada gör ve sırala",
            "‘Optimize Et’ ile rota sırasını hesapla",
            "Filtrelerle hedef müşteri setini daralt",
            "Ziyaret detaya gidip sonuç gir (satış/teklif/vs.)"
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
      tips: ["Haritada layer’ları aç/kapa menüsünü dene."],
      hotkeys: [
        { combo: "Shift+?", desc: "Yardımı aç" },
        { combo: "g v", desc: "Ziyaret listesine git" }
      ]
    },
    visitList: {
      tourSteps: [
        { target: "[data-tour-id='search']", content: "Müşteri araması yapın." },
        { target: "[data-tour-id='row']", content: "Satıra tıklayarak ziyaret detayına geçin." },
        { target: "[data-tour-id='result']", content: "Ziyaret sonucunu hızlıca kaydedin." },
      ],
      cheatsheet: [
        {
          title: "Hızlı İşlemler",
          bullets: [
            "Müşteri adına tıkla → detay",
            "Toplu seçim → rota ekle",
            "Sonuç gir → raporlamaya yansır"
          ]
        }
      ],
      hotkeys: [{ combo: "Shift+?", desc: "Yardımı aç" }]
    },
    dashboard: {
      tourSteps: [
        { target: "[data-tour-id='kpi-cards']", content: "Günlük hedef & performans kartları." },
        { target: "[data-tour-id='actions']", content: "Önerilen sonraki aksiyonlar." },
      ],
      cheatsheet: [{ title: "Görebildiklerim", bullets: ["Hedefim", "Tamamlanan ziyaret", "Teklif/Satış oranları"] }],
      hotkeys: [{ combo: "Shift+?", desc: "Yardımı aç" }]
    },
    assignmentMap: {
      tourSteps: [],
      cheatsheet: [{ title: "Not", bullets: ["Bu ekran saha yöneticisine özeldir."] }],
    }
  },

  sahaYonetici: {
    dashboard: {
      tourSteps: [
        { target: "[data-tour-id='kpi-cards']", content: "Takım KPI’ları, trendler ve karşılaştırmalar." },
        { target: "[data-tour-id='league']", content: "Satış Ligi skor tablosu." },
      ],
      cheatsheet: [
        { title: "Yapabileceklerim", bullets: ["Takım KPI takibi", "Bölgeler arası performans karşılaştırma"] }
      ],
      hotkeys: [{ combo: "Shift+?", desc: "Yardımı aç" }]
    },
    assignmentMap: {
      tourSteps: [
        { target: "[data-tour-id='areas']", content: "Satış temsilcisi sayısı kadar alanı görün." },
        { target: "[data-tour-id='optimize']", content: "Optimize Et: Müşteri dağılımını otomatik öner." },
        { target: "[data-tour-id='save']", content: "Atamaları kaydet ve temsilcilere gönder." },
      ],
      cheatsheet: [
        { title: "Bu ekranda neler yaparım?", bullets: ["Alanları çiz/incele", "Optimize Et ile öneri dağıt", "Atamaları kaydet & paylaş"] }
      ],
      tips: ["Bölgeler kesişmemeli; optimize sonra manuel inceleyin."],
      hotkeys: [{ combo: "Shift+?", desc: "Yardımı aç" }]
    },
    routeMap: { tourSteps: [], cheatsheet: [{ title: "Not", bullets: ["Bu ekran saha uzmanına odaklıdır."] }] },
    visitList: { tourSteps: [], cheatsheet: [{ title: "Not", bullets: ["Listeleme ve sonuç girişi uzman tarafında."] }] }
  }
};
