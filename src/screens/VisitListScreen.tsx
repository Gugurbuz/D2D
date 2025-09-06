import React, { useMemo, useState, useCallback } from "react";
import type { Customer } from "../data/mockCustomers";
import type { Rep } from "../types";
import VisitCard from "../components/VisitCard";
import {
  SortAsc,
  SortDesc,
  RefreshCcw,
} from "lucide-react";
import { isToday, isTomorrow, isThisWeek, parseISO } from "date-fns";

const pageSize = 20;

const VisitListScreen = ({
  customers,
  assignments,
  allReps,
  setCurrentScreen,
  onSelectCustomer,
}: {
  customers: Customer[];
  assignments: Record<string, string | undefined>;
  allReps: Rep[];
  setCurrentScreen: (s: any) => void;
  onSelectCustomer: (c: Customer) => void;
}) => {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Tümü" | Customer["status"]>("Tümü");
  const [sortBy, setSortBy] = useState<"plannedTime" | "priority">("plannedTime");
  const [asc, setAsc] = useState(true);
  const [dateFilter, setDateFilter] = useState<"Tümü" | "Bugün" | "Yarın" | "Bu Hafta">("Tümü");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);

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
          c.customerNumber?.toLowerCase().includes(needle)
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
        const cmp = a.visitDate.localeCompare(b.visitDate);
        return asc ? cmp : -cmp;
      }
      const order = { Yüksek: 3, Orta: 2, Düşük: 1 } as const;
      const cmp = order[a.priority] - order[b.priority];
      return asc ? -cmp : cmp;
    });

    return list;
  }, [customers, q, statusFilter, dateFilter, sortBy, asc]);

  const visibleItems = filteredSorted.slice(0, page * pageSize);

  const resetFilters = () => {
    setQ("");
    setStatusFilter("Tümü");
    setDateFilter("Tümü");
    setSortBy("plannedTime");
    setAsc(true);
    setSelectedIds([]);
    setPage(1);
  };

  const selectAndGo = useCallback(
    (c: Customer, screen: "visitDetail" | "visitFlow") => {
      onSelectCustomer(c);
      requestAnimationFrame(() => setCurrentScreen(screen));
    },
    [onSelectCustomer, setCurrentScreen]
  );

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const buttonClass = (active: boolean, color = "blue") =>
    `px-4 py-2 rounded-full border whitespace-nowrap text-sm transition ${
      active ? `bg-${color}-600 text-white` : "bg-white text-gray-800 hover:bg-gray-100"
    }`;

  return (
    <div className="px-4 md:px-6 py-6 space-y-4">
      {/* Arama alanı */}
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Müşteri adı, adres veya no ile ara..."
        className="border rounded px-3 py-2 w-full"
      />

      {/* Aktif filtre etiketleri */}
      <div className="flex flex-wrap gap-2">
        {statusFilter !== "Tümü" && (
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
            Durum: {statusFilter}{" "}
            <button onClick={() => setStatusFilter("Tümü")}>×</button>
          </span>
        )}
        {dateFilter !== "Tümü" && (
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
            Tarih: {dateFilter}{" "}
            <button onClick={() => setDateFilter("Tümü")}>×</button>
          </span>
        )}
      </div>

      {/* Durum filtreleri */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
        <div className="flex gap-2 overflow-x-auto">
          {["Tümü", "Planlandı", "Tamamlandı", "İptal"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={buttonClass(statusFilter === status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Tarih filtreleri */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
        <div className="flex gap-2 overflow-x-auto">
          {["Tümü", "Bugün", "Yarın", "Bu Hafta"].map((label) => (
            <button
              key={label}
              onClick={() => setDateFilter(label as any)}
              className={buttonClass(dateFilter === label, "green")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sıralama filtreleri */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sıralama</label>
        <div className="flex gap-2 overflow-x-auto">
          {[
            { key: "plannedTime", label: "Tarihe Göre" },
            { key: "priority", label: "Önceliğe Göre" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => {
                if (sortBy === item.key) setAsc(!asc);
                else {
                  setSortBy(item.key as any);
                  setAsc(true);
                }
              }}
              className={buttonClass(sortBy === item.key, "purple")}
            >
              {item.label}{" "}
              {sortBy === item.key &&
                (asc ? <SortAsc size={16} /> : <SortDesc size={16} />)}
            </button>
          ))}
        </div>
      </div>

      {/* Sıfırla butonu */}
      <div className="text-right">
        <button
          onClick={resetFilters}
          className="text-sm text-blue-600 hover:underline"
        >
          Filtreleri Sıfırla
        </button>
      </div>

      {/* Toplu işlem çubuğu */}
      {selectedIds.length > 0 && (
        <div className="bg-yellow-100 border px-4 py-2 flex justify-between items-center text-sm">
          <span>{selectedIds.length} ziyaret seçildi</span>
          <div className="flex gap-4">
            <button className="text-blue-600 hover:underline">İptal Et</button>
            <button className="text-blue-600 hover:underline">Ata</button>
          </div>
        </div>
      )}

      {/* Ziyaret listesi */}
      {visibleItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Hiç ziyaret bulunamadı.
        </div>
      ) : (
        <div className="space-y-4">
          {visibleItems.map((c) => (
            <VisitCard
              key={c.id}
              customer={c}
              assignedName={getAssignedName(c.id)}
              onDetail={() => selectAndGo(c, "visitDetail")}
              onStart={() => selectAndGo(c, "visitFlow")}
              selected={selectedIds.includes(c.id)}
              onSelect={() => toggleSelection(c.id)}
            />
          ))}

          {filteredSorted.length > visibleItems.length && (
            <button
              onClick={() => setPage((p) => p + 1)}
              className="mt-4 mx-auto block bg-gray-100 px-4 py-2 rounded hover:bg-gray-200 text-sm"
            >
              Daha Fazla Yükle
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VisitListScreen;
