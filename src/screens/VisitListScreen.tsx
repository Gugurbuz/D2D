// --- VisitListScreen.tsx ---
import React, { useMemo, useState, useCallback } from "react";
import type { Customer } from "../data/mockCustomers";
import type { Rep } from "../types";
import VisitCard from "../components/VisitCard";
import { Search, Filter, SortAsc, SortDesc } from "lucide-react";

type Props = {
  customers: Customer[];
  assignments: Record<string, string | undefined>;
  allReps: Rep[];
  setCurrentScreen: (s: any) => void;
  /** ÖNEMLİ: setter ismine benzemesin; parent’ta yanlış değer geçirmeyi önler */
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
    if (statusFilter !== "Tümü") list = list.filter((c) => c.status === statusFilter);

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

  // Tek noktadan, güvenli seçim fonksiyonu
  const selectAndGo = useCallback(
    (c: Customer, screen: "visitDetail" | "visitFlow") => {
      if (typeof onSelectCustomer !== "function") {
        console.error("onSelectCustomer prop'u fonksiyon olmalı fakat değil.");
        return;
      }
      onSelectCustomer(c);
      setCurrentScreen(screen);
    },
    [onSelectCustomer, setCurrentScreen]
  );

  return (
    <div className="px-6 py-6 space-y-6" role="main" aria-label="Ziyaret Listesi ekranı">
      {/* ... üst arama/filtre alanı olduğu gibi kalıyor ... */}

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
