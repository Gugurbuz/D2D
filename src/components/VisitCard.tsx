import React from "react";
import { Eye, Play, MapPin, UserCheck } from "lucide-react"; // StickyNote kaldırıldı
import type { Customer } from "../types";
import Chip from "./Chip";
import Button from "./Button";
import { getStatusColor, getPriorityColor } from "../styles/theme";

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

type Props = {
  customer: Customer;
  assignedName: string | null;
  onDetail: () => void;
  onStart: () => void;
};

const VisitCard: React.FC<Props> = ({ customer, assignedName, onDetail, onStart }) => {
  const statusColor = getStatusColor(customer.status);
  const priorityColor = getPriorityColor(customer.priority);
  const typeLabel = customer.tariff === "İş Yeri" ? "B2B – Sabit Fiyat" : "B2C – Endeks";

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-[#002D72] dark:hover:border-[#F9C800] rounded-xl p-5 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        {/* SOL TARAF */}
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{customer.name}</div>
            <div className="text-xs text-gray-500">Müşteri No: {customer.customerNumber ?? "-"}</div>
            <div className="text-xs text-gray-500">Tesisat No: {customer.installationNumber ?? "-"}</div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
            <MapPin className="w-4 h-4" /> {customer.address} – {customer.district}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <Chip color={statusColor} variant="soft">{customer.status}</Chip>
            <Chip color={priorityColor} variant="soft">{customer.priority} Öncelik</Chip>
            <Chip color="navy" variant="soft">{typeLabel}</Chip>
            {assignedName && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600">
                <UserCheck className="w-3 h-3 mr-1" /> {assignedName}
              </span>
            )}
          </div>
        </div>

        {/* SAĞ TARAF */}
        <div className="text-right space-y-2 flex flex-col items-end justify-between">
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 flex gap-2">
              <span>{formatDate(customer.visitDate)}</span>
              <span>{customer.plannedTime}</span>
            </div>
            <div className="text-xs text-gray-500">{customer.distance}</div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {/* Detay butonu */}
            <Button
              variant="primary"
              size="sm"
              onClick={onDetail}
              leftIcon={<Eye className="w-4 h-4" />}
            >
              Detay
            </Button>

            {/* Başlat butonu */}
            {customer.status === "Bekliyor" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onStart}
                leftIcon={<Play className="w-4 h-4" />}
              >
                Başlat
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitCard;
