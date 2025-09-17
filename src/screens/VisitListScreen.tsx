// src/screens/VisitListScreen.tsx (Geliştirilmiş Chip ile Kullanım)

import React, { useMemo, useState, useCallback, useEffect } from "react";
// ... diğer importlar
import Chip from "../components/Chip"; // Geliştirilmiş Chip bileşenimiz
import { statusStyles } from "../styles/theme"; // Merkezi tema stillerimiz
import { SlidersHorizontal, X } from "lucide-react";

// ...
const VisitListScreen = ({ /* ... props ... */ }) => {
  // ... state'ler ve fonksiyonlar aynı ...
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-4 space-y-4">
        {/* Üst Bar: Arama ve Filtre Butonu (Değişiklik yok) */}
        <div className="flex gap-2 items-center">
            {/* ... input ve filtre butonu ... */}
        </div>
        
        {/* Filtre Paneli */}
        {filtersVisible && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4 shadow-sm">
            {/* Durum Filtresi */}
            <div>
              <label className="text-sm font-semibold text-gray-800 mb-2 block">Durum</label>
              <div className="flex flex-wrap gap-2">
                {["Tümü", "Planlandı", "Tamamlandı", "İptal", "Yolda"].map((status) => (
                  <Chip
                    key={status}
                    as="button" // Tıklanabilir olması için
                    isActive={statusFilter === status}
                    onClick={() => setStatusFilter(status)}
                    // Merkezi temadan doğru 'tone' değerini alıyoruz
                    tone={statusStyles[status]}
                  >
                    {status}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Tarih Filtresi */}
            <div>
              <label className="text-sm font-semibold text-gray-800 mb-2 block">Tarih</label>
              <div className="flex flex-wrap gap-2">
                {["Tümü", "Bugün", "Yarın", "Bu Hafta"].map((label) => (
                   <Chip
                    key={label}
                    as="button"
                    isActive={dateFilter === label}
                    onClick={() => setDateFilter(label)}
                    tone={statusStyles[label]}
                  >
                    {label}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Sıralama Filtresi */}
            <div>
               <label className="text-sm font-semibold text-gray-800 mb-2 block">Sıralama</label>
               <div className="flex flex-wrap gap-2">
                 {[{ key: "plannedTime", label: "Tarihe Göre" }, { key: "priority", label: "Önceliğe Göre" }].map((item) => (
                    <Chip
                      key={item.key}
                      as="button"
                      isActive={sortBy === item.key}
                      onClick={() => { /* ... sıralama mantığı ... */ }}
                      tone={statusStyles[item.label]}
                      sortDirection={sortBy === item.key ? (asc ? 'asc' : 'desc') : null}
                    >
                      {item.label}
                    </Chip>
                 ))}
               </div>
            </div>
            
            {/* Filtreleri Temizle Butonu */}
          </div>
        )}
        
        {/* Ziyaret Listesi */}
        {/* ... Listenin render edildiği kısım ... */}
      </div>
    </div>
  );
};

export default VisitListScreen;