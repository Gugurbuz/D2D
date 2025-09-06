/* --- VisitListScreen.tsx (PATCH) --- */
import React, { useMemo, useState, useCallback } from "react"; // ⬅️ useCallback eklendi
import type { Customer } from "../data/mockCustomers";
import type { Rep } from "../types";
import VisitCard from "../components/VisitCard";
import { Search, Filter, SortAsc, SortDesc } from "lucide-react";

type Props = {
  customers: Customer[];
  assignments: Record<string, string | undefined>;
  allReps: Rep[];
  setCurrentScreen: (s: any) => void;
  setSelectedCustomer: (c: Customer) => void; // parent'ın GERÇEKTEN fonksiyon geçmesi gerekiyor
};

const VisitListScreen: React.FC<Props> = ({
  customers,
  assignments,
  allReps,
  setCurrentScreen,
  setSelectedCustomer,
}) => {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Tümü" | Customer["status"]>("Tümü");
  const [sortBy, setSortBy] = useState<"plannedTime" | "priority">("plannedTime");
  const [asc, setAsc] = useState(true);

  // 👇 Tek noktadan güvenli seçim + ekran geçişi
  const selectAndGo = useCallback(
    (c: Customer, screen: "visitDetail" | "visitFlow") => {
      if (typeof setSelectedCustomer !== "function") {
        // Parent yanlış prop geçiyor: ör. setSelectedCustomer={selectedCustomer} gibi
        console.error(
          "VisitListScreen: setSelectedCustomer prop'u fonksiyon değil. Parent'ta `setSelectedCustomer={(c)=>...}` şeklinde FONKSİYON geçmelisiniz."
        );
        // Kullanıcı deneyimi için ekranı değiştirmeyi engelle
        return;
      }
      // Önce müşteri state'i, sonra ekran geçişi (ilk frame'de null gelmesin)
      setSelectedCustomer(c);
      requestAnimationFrame(() => setCurrentScreen(screen));
    },
    [setSelectedCustomer, setCurrentScreen]
  );

  const getAssignedName = (customerId: string) => {
    const repId = assignments[customerId];
    return repId ? allReps.find((r) => r.id === repId)?.name || repId : null;
  };

  const filteredSorted = useMemo(() => {
    let list = [...customers];

    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(needle) ||
          c.address.toLowerCase().includes(needle) ||
          c.district.toLowerCase().includes(needle)
      );
    }

    if (statusFilter !== "Tümü") {
      list = list.filter((c) => c.status === statusFilter);
    }

    list.sort((a, b) => {
      if (sortBy === "plannedTime") {
        const cmp = a.plannedTime.localeCompare(b.plannedTime);
        return asc ? cmp : -cmp;
      }
      const order = { Yüksek: 3, Orta: 2, Düşük: 1 } as const;
      const cmp = order[a.priority] - order[b.priority];
      return asc ? -cmp : cmp;
    });

    return list;
  }, [customers, q, statusFilter, sortBy, asc]);

  return (
    <div className="px-6 py-6 space-y-6" role="main" aria-label="Ziyaret Listesi ekranı">
      {/* Başlık + Filtre Alanı */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900">Tüm Ziyaretler</h1>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="İsim, adres, ilçe ara…"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="appearance-none pl-8 pr-8 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                title="Duruma göre filtrele"
              >
                <option value="Tümü">Tümü</option>
                <option value="Bekliyor">Bekliyor</option>
                <option value="Yolda">Yolda</option>
                <option value="Tamamlandı">Tamamlandı</option>
              </select>
              <Filter className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-3 pr-10 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                title="Sıralama"
              >
                <option value="plannedTime">Saat</option>
                <option value="priority">Öncelik</option>
              </select>
              <button
                onClick={() => setAsc((v) => !v)}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100"
                title={asc ? "Artan" : "Azalan"}
                aria-label="Sıralama yönü"
              >
                {asc ? <SortAsc className="w-4 h-4 text-gray-600" /> : <SortDesc className="w-4 h-4 text-gray-600" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Liste */}
      {filteredSorted.length === 0 ? (
        <div className="text-sm text-gray-500">Kriterlere uyan ziyaret bulunamadı.</div>
      ) : (
        <div className="space-y-4">
          {filteredSorted.map((c) => (
            <VisitCard
              key={c.id}
              customer={c}
              assignedName={getAssignedName(c.id)}
              onDetail={() => selectAndGo(c, "visitDetail")}
              onStart={() => selectAndGo(c, "visitFlow")}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VisitListScreen;
