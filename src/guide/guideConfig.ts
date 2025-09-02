export const guideConfig: GuideConfig = {
  satisUzmani: {
    routeMap: {
      tourSteps: [
        { target: "[data-tour-id='map']", content: "Harita üzerinde planlı ziyaretleri görürsün." },
        { target: "[data-tour-id='optimize']", content: "Rota optimizasyonu başlat." },
        { target: "[data-tour-id='filters']", content: "Filtrelerle müşteri setini daralt." },
        { target: "[data-tour-id='visit-list']", content: "Ziyaret listesine geç." },
      ],
      cheatsheet: [/* ... */],
    },
    visitList: {
      tourSteps: [
        { target: "[data-tour-id='search']", content: "Müşteri araması yap." },
        { target: "[data-tour-id='row']", content: "Satıra tıkla → detay." },
        { target: "[data-tour-id='result']", content: "Ziyaret sonucunu gir." },
      ],
      cheatsheet: [/* ... */],
    },
    dashboard: {
      tourSteps: [
        { target: "[data-tour-id='kpi-cards']", content: "Günlük KPI kartların." },
        { target: "[data-tour-id='actions']", content: "Önerilen sonraki aksiyonlar." },
      ],
    },
  },
  sahaYonetici: {
    assignmentMap: {
      tourSteps: [
        { target: "[data-tour-id='areas']", content: "Temsilci alanlarını gör/yönet." },
        { target: "[data-tour-id='optimize']", content: "Dağılımı optimize et." },
        { target: "[data-tour-id='save']", content: "Atamaları kaydet." },
      ],
    },
    dashboard: { /* ... */ },
  }
};
