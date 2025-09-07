// src/components/OldSidebarContent.tsx
import React from "react";
import { Customer } from "../RouteMap";

type Props = {
  customers: Customer[];
  selectedCustomerId: string | null;
  routeIds: string[];
  starred: Record<string, boolean>;
  // Harita/işlev callback'leri
  onSelectCustomer: (c: Customer) => void;   // haritada odakla + popup aç
  onToggleStar: (id: string) => void;
  onAddToRoute: (id: string) => void;
  onRemoveFromRoute: (id: string) => void;
  onClearRoute: () => void;
};

const OldSidebarContent: React.FC<Props> = ({
  customers,
  selectedCustomerId,
  routeIds,
  starred,
  onSelectCustomer,
  onToggleStar,
  onAddToRoute,
  onRemoveFromRoute,
  onClearRoute,
}) => {
  // 🔽🔽🔽  BURAYA ESKİ SAĞ PANELİN JSX’İNİ YAPIŞTIR  🔽🔽🔽
  // Aşağıdaki basit liste sadece örnek. Kendi kartlarını/filtrelerini koy.
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Müşteri Listesi</h2>
        <button className="px-3 py-1 border rounded" onClick={onClearRoute}>Rotayı Temizle</button>
      </div>

      <div className="text-sm text-gray-600">
        Seçili: {selectedCustomerId ?? "—"} • Rota: {routeIds.length} müşteri
      </div>

      <div className="grid gap-2" style={{ maxHeight: "calc(100vh - 260px)", overflow: "auto" }}>
        {customers.map((c) => {
          const selected = selectedCustomerId === c.id;
          const isInRoute = routeIds.includes(c.id);
          return (
            <div
              key={c.id}
              className={`border rounded-lg p-3 ${selected ? "border-sky-400 bg-sky-50" : "border-gray-200 bg-white"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="cursor-pointer" onClick={() => onSelectCustomer(c)}>
                  <div className="font-bold">{c.name}</div>
                  <div className="text-xs text-gray-600">
                    {c.address} {c.district ? `• ${c.district}` : ""}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Planlı: {c.plannedTime ?? "-"} • Öncelik: {c.priority ?? "-"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="px-2 py-1 border rounded"
                    title={starred[c.id] ? "Yıldızı kaldır" : "Yıldızla"}
                    onClick={() => onToggleStar(c.id)}
                  >
                    <i className={starred[c.id] ? "fa fa-star" : "fa-regular fa-star"} />
                  </button>

                  {isInRoute ? (
                    <button
                      className="px-2 py-1 border rounded"
                      title="Rotadan çıkar"
                      onClick={() => onRemoveFromRoute(c.id)}
                    >
                      <i className="fa fa-minus" />
                    </button>
                  ) : (
                    <button
                      className="px-2 py-1 border rounded"
                      title="Rotaya ekle"
                      onClick={() => onAddToRoute(c.id)}
                    >
                      <i className="fa fa-plus" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* İstersen aşağıya rota sıralaması/özetini de koyabilirsin */}
    </div>
  );
};

export default OldSidebarContent;
