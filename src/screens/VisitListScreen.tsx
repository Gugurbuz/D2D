import React, { useMemo, useState, useCallback } from "react";
import type { Customer } from "../data/mockCustomers";
import type { Rep } from "../types";
import VisitCard from "../components/VisitCard";
import { SortAsc, SortDesc } from "lucide-react";
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
  const [page, setPage] = useState(1);

  const getAssignedName = (customerId: string) => {
    const repId = assignments[customerId];
    return repId ? allReps.find((r) => r.id === repId)?.name || repId : null;
  };

  const getStatusTone = (status: Customer["status"]) =>
    status === "Tamamlandı"
      ? "green"
      : status === "Yolda"
      ? "blue"
      : status === "İptal"
      ? "red"
      : "yellow"; // Planlandı, Bekliyor

  const buttonClassForStatus = (buttonStatus: Customer["status"] | "Tümü") => {
    const active = statusFilter === buttonStatus;

    if (buttonStatus === "Tümü") {
      return `px-4 py-2 min-w-[96px] rounded-full border text-sm transition whitespace-nowrap ${
        active
          ? "bg-gray-800 text-white border-gray-800"
          : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
      }`;
    }

    const tone = getStatusTone(buttonStatus as Customer["status"]);

    return `px-4 py-2 min-w-[96px] rounded-full border text-sm transition whitespace-nowrap ${
      active
        ? `bg-${tone}-100 text-${tone}-800 border-${tone}-200`
        : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
    }`;
  };

  const buttonClass = (active: boolean, color = "blue") =>
    `px-4 py-2 min-w-[96px] rounded-full border text-sm transition whitespace-nowrap ${
      active
        ? `bg-${color}-600 text-white border-${color}-600`
        : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
    }`;

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
    setPage(1);
  };

  const selectAndGo = useCallback(
    (c: Customer, screen: "visitDetail" | "visitFlow") => {
      onSelectCustomer(c);
      requestAnimationFrame(() => setCurrentScreen(screen));
    },
    [onSelectCustomer, setCurrentScreen]
  );

  return (
    <div className="px-4 md:px-6 py-6 space-y-6">
      {/* Arama */}
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Müşteri adı, adres veya no ile ara..."
        className="border rounded px-3 py-2 w-full"
      />

      {/* 🔲 FİLTRE KUTUSU */}
      <div className="bg-white border border-gray-300 rounded-xl p-4 space-y-6 shadow-sm">
        {/* DURUM */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {["Tümü", "Planlandı", "Tamamlandı", "İptal", "Yolda"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={buttonClassForStatus(status as any)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* TARİH */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tarih</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
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

        {/* SIRALAMA */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sıralama</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {[
              { key: "plannedTime", label: "Tarihe Göre" },
              { key: "priority", label: "Önceliğe Göre" },
            ].map((item) => {
              const isActive = sortBy === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    if (sortBy === item.key) setAsc(!asc);
                    else {
                      setSortBy(item.key as any);
                      setAsc(true);
                    }
                  }}
                  className={buttonClass(isActive, "purple")}
                >
                  <div className="flex items-center justify-center gap-1">
                    {item.label}
                    {isActive &&
                      (asc ? <SortAsc size={16} /> : <SortDesc size={16} />)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 🔁 Filtre Sıfırla Butonu */}
        <div className="text-right">
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:underline"
          >
            Filtreleri Sıfırla
          </button>
        </div>
      </div>

      {/* Liste */}
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
