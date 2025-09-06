// src/screens/VisitListScreen.tsx
import React, { useMemo, useState, useCallback } from "react";
import type { Customer } from "../data/mockCustomers";
import type { Rep } from "../types";
import VisitCard from "../components/VisitCard";
import { SortAsc, SortDesc, RefreshCcw } from "lucide-react";
import { isToday, isTomorrow, isThisWeek, parseISO } from "date-fns";

type Props = {
  customers: Customer[];
  assignments: Record<string, string | undefined>;
  allReps: Rep[];
  setCurrentScreen: (s: any) => void;
  onSelectCustomer: (c: Customer) => void;
};

const VisitListScreen: React.FC<Props> = ({
  customers,
  assignments,
  allReps,
  setCurrentScreen,
  onSelectCustomer,
}) => {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Tümü" | Customer["status"]>("Tümü");
  const [sortBy, setSortBy] = useState<"plannedTime" | "priority">("plannedTime");
  const [asc, setAsc] = useState(true);
  const [dateFilter, setDateFilter] = useState<"Tümü" | "Bugün" | "Yarın" | "Bu Hafta">("Tümü");

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

   if (dateFilter !== "Tümü") {
  list = list.filter((c) => {
    if (!c.visitDate) return false;
    const date = parseISO(c.visitDate);
        if (dateFilter === "Bugün") return isToday(date);
        if (dateFilter === "Yarın") return isTomorrow(date);
        if (dateFilter === "Bu Hafta") return isThisWeek(date, { weekStartsOn: 1 });
        return true;
      });
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
  }, [customers, q, statusFilter, dateFilter, sortBy, asc]);

  const resetFilters = () => {
    setQ("");
    setStatusFilter("Tümü");
    setDateFilter("Tümü");
    setSortBy("plannedTime");
    setAsc(true);
  };

  const selectAndGo = useCallback(
    (c: Customer, screen: "visitDetail" | "visitFlow") => {
      if (typeof onSelectCustomer !== "function") {
        console.error("VisitListScreen: onSelectCustomer fonksiyon olmalı.");
        return;
      }
      onSelectCustomer(c);
      requestAnimationFrame(() => setCurrentScreen(screen));
    },
    [onSelectCustomer, setCurrentScreen]
  );

  return (
    <div className="px-4 md:px-6 py-6 space-y-6" role="main" aria-label="Ziyaret Listesi ekranı">
      {/* Arama ve sıralama */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Müşteri, adres veya ilçe ara..."
          aria-label="Ziyaret arama"
          className="border rounded px-3 py-2 w-full md:w-1/3"
        />

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAsc((prev) => !prev)}
            aria-label={`Sıralama yönü: ${asc ? "Artan" : "Azalan"}`}
            className="p-2 border rounded hover:bg-gray-100 transition"
          >
            {asc ? <SortAsc size={18} /> : <SortDesc size={18} />}
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="Sıralama kriteri"
            className="border rounded px-2 py-2"
          >
            <option value="plannedTime">Ziyaret Tarihi</option>
            <option value="priority">Öncelik</option>
          </select>

          <button
            onClick={resetFilters}
            aria-label="Filtreleri sıfırla"
            className="p-2 border rounded hover:bg-gray-100 transition"
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </div>

      {/* Statü filtre butonları */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["Tümü", "Planlandı", "Tamamlandı", "İptal"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status as any)}
            className={`px-4 py-2 rounded-full border whitespace-nowrap transition ${
              statusFilter === status
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-800 hover:bg-gray-100"
            }`}
            aria-pressed={statusFilter === status}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Tarih filtre butonları */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["Tümü", "Bugün", "Yarın", "Bu Hafta"].map((label) => (
          <button
            key={label}
            onClick={() => setDateFilter(label as any)}
            className={`px-4 py-2 rounded-full border whitespace-nowrap transition ${
              dateFilter === label
                ? "bg-green-600 text-white"
                : "bg-white text-gray-800 hover:bg-gray-100"
            }`}
            aria-pressed={dateFilter === label}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sonuç sayısı */}
      <div className="text-sm text-gray-600">
        {filteredSorted.length > 0 ? `${filteredSorted.length} ziyaret bulundu.` : "Ziyaret bulunamadı."}
      </div>

      {/* Liste */}
      {filteredSorted.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium mb-2">Kriterlere uyan ziyaret bulunamadı.</p>
          <p className="text-sm">Farklı bir arama yapabilir ya da filtreleri sıfırlayabilirsiniz.</p>
          <button
            onClick={resetFilters}
            className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Filtreleri Sıfırla
          </button>
        </div>
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
