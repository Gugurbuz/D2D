import React, { useMemo, useRef, useState } from "react";
import {
  Users,
  UserPlus,
  Upload,
  Download,
  Search,
  Filter,
  Settings2,
  Trash2,
  RotateCcw,
  MoreVertical,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
} from "lucide-react";
import type { Role } from "../types";

/* ============ Tipler ============ */
type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: Role; // 'sales_rep' | 'manager' | 'admin' | 'operations_manager'
  active: boolean;
  lastLogin?: string;
};

type Banner = { type: "success" | "error" | "info"; message: string } | null;

/* ============ Mock Başlangıç Verisi (kurmaca) ============ */
const initialUsers: UserRecord[] = [
  { id: "u1", name: "Ali Demir",    email: "ali.demir@example.com",    role: "admin",               active: true,  lastLogin: "2025-09-07T18:30:00Z" },
  { id: "u2", name: "Ayşe Kılıç",   email: "ayse.kilic@example.com",   role: "manager",             active: true,  lastLogin: "2025-09-07T08:20:00Z" },
  { id: "u3", name: "Mehmet Kaya",  email: "mehmet.kaya@example.com",  role: "sales_rep",           active: true,  lastLogin: "2025-09-06T15:12:00Z" },
  { id: "u4", name: "Elif Yıldız",  email: "elif.yildiz@example.com",  role: "operations_manager",  active: false, lastLogin: undefined },
  { id: "u5", name: "Can Aksoy",    email: "can.aksoy@example.com",    role: "sales_rep",           active: true,  lastLogin: "2025-09-05T12:00:00Z" },
  { id: "u6", name: "Derya Yaman",  email: "derya.yaman@example.com",  role: "manager",             active: true,  lastLogin: "2025-09-04T09:50:00Z" },
];

/* ============ Yardımcılar ============ */
const roleLabel: Record<Role, string> = {
  admin: "Admin",
  manager: "Yönetici",
  sales_rep: "Saha Temsilcisi",
  operations_manager: "Operasyon Yöneticisi",
};

const roleTone: Record<Role, string> = {
  admin: "bg-purple-100 text-purple-700",
  manager: "bg-amber-100 text-amber-700",
  sales_rep: "bg-blue-100 text-blue-700",
  operations_manager: "bg-teal-100 text-teal-700",
};

const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}>
    {active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
    {active ? "Aktif" : "Pasif"}
  </span>
);

const RoleBadge: React.FC<{ role: Role }> = ({ role }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${roleTone[role]}`}>
    {roleLabel[role]}
  </span>
);

const Avatar: React.FC<{ name: string }> = ({ name }) => {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || "")
    .join("");
  return (
    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 grid place-items-center text-sm font-semibold">
      {initials || "U"}
    </div>
  );
};

const toLocal = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "-");

const downloadFile = (filename: string, content: string, type = "text/csv;charset=utf-8;") => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/* ============ Bileşen ============ */
const UserManagementScreen: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>(initialUsers);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [banner, setBanner] = useState<Banner>(null);

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [sortKey, setSortKey] = useState<keyof UserRecord>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Modallar
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);

  const [confirmType, setConfirmType] = useState<null | { action: "delete" | "reset"; user?: UserRecord; bulk?: boolean }>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* --------- Filtre + Sıralama + Sayfalama --------- */
  const filtered = useMemo(() => {
    let data = [...users];

    if (q.trim()) {
      const s = q.toLowerCase();
      data = data.filter(
        (u) =>
          u.name.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s) ||
          roleLabel[u.role].toLowerCase().includes(s)
      );
    }
    if (roleFilter !== "all") data = data.filter((u) => u.role === roleFilter);
    if (statusFilter !== "all")
      data = data.filter((u) => (statusFilter === "active" ? u.active : !u.active));

    data.sort((a, b) => {
      const va = (a[sortKey] ?? "") as any;
      const vb = (b[sortKey] ?? "") as any;
      let cmp = 0;
      if (sortKey === "lastLogin") {
        cmp = (va ? +new Date(va) : 0) - (vb ? +new Date(vb) : 0);
      } else if (typeof va === "string" && typeof vb === "string") {
        cmp = va.localeCompare(vb);
      } else if (typeof va === "boolean" && typeof vb === "boolean") {
        cmp = Number(va) - Number(vb);
      } else {
        cmp = (va ?? 0) - (vb ?? 0);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return data;
  }, [users, q, roleFilter, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: keyof UserRecord) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelected(new Set(pageData.map((u) => u.id)));
    else setSelected(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* --------- CRUD & Aksiyonlar --------- */
  const onAddNew = () => {
    setEditUser({
      id: crypto.randomUUID(),
      name: "",
      email: "",
      role: "sales_rep",
      active: true,
    });
    setShowForm(true);
  };

  const onEdit = (u: UserRecord) => {
    setEditUser({ ...u });
    setShowForm(true);
  };

  const saveUser = () => {
    if (!editUser) return;
    const { name, email } = editUser;
    if (!name.trim() || !email.includes("@")) {
      setBanner({ type: "error", message: "İsim ve geçerli e-posta zorunludur." });
      return;
    }
    setUsers((prev) => {
      const exists = prev.some((x) => x.id === editUser.id);
      return exists ? prev.map((x) => (x.id === editUser.id ? editUser : x)) : [editUser, ...prev];
    });
    setShowForm(false);
    setBanner({ type: "success", message: existsMsg(editUser) });
  };

  const existsMsg = (u: UserRecord) => (users.some((x) => x.id === u.id) ? "Kullanıcı güncellendi." : "Kullanıcı oluşturuldu.");

  const askDelete = (u?: UserRecord) => setConfirmType({ action: "delete", user: u, bulk: !u });
  const askReset = (u: UserRecord) => setConfirmType({ action: "reset", user: u });

  const doDelete = () => {
    if (!confirmType) return;
    if (confirmType.bulk) {
      setUsers((prev) => prev.filter((u) => !selected.has(u.id)));
      setSelected(new Set());
      setBanner({ type: "success", message: "Seçili kullanıcılar silindi." });
    } else if (confirmType.user) {
      setUsers((prev) => prev.filter((u) => u.id !== confirmType.user!.id));
      setBanner({ type: "success", message: "Kullanıcı silindi." });
    }
    setConfirmType(null);
  };

  const doReset = () => {
    if (confirmType?.user) {
      // gerçek sistemde: backend'e reset maili yolla
      setBanner({ type: "success", message: `Şifre sıfırlama bağlantısı ${confirmType.user.email} adresine gönderildi (mock).` });
    }
    setConfirmType(null);
  };

  const bulkActivate = (active: boolean) => {
    setUsers((prev) => prev.map((u) => (selected.has(u.id) ? { ...u, active } : u)));
    setBanner({ type: "success", message: active ? "Seçili kullanıcılar aktifleştirildi." : "Seçili kullanıcılar pasifleştirildi." });
    setSelected(new Set());
  };

  /* --------- CSV Import/Export (basit) --------- */
  const exportCsv = () => {
    const header = "id,name,email,role,active,lastLogin\n";
    const rows = users
      .map((u) => [u.id, u.name, u.email, u.role, u.active, u.lastLogin || ""].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    downloadFile("users.csv", header + rows);
  };

  const importCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length <= 1) {
      setBanner({ type: "error", message: "CSV içeriği bulunamadı." });
      return;
    }
    const [header, ...rest] = lines;
    const cols = header.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const idx = (k: string) => cols.indexOf(k);

    const need = ["id", "name", "email", "role", "active"];
    if (!need.every((n) => idx(n) >= 0)) {
      setBanner({ type: "error", message: "CSV başlıkları eksik. Gerekli: id,name,email,role,active" });
      return;
    }

    const parsed: UserRecord[] = rest.map((line) => {
      const cells = line.match(/("([^"]|"")*"|[^,]+)/g) || [];
      const cell = (i: number) => (cells[i] || "").replace(/^"|"$/g, "").replace(/""/g, '"');
      const r = (cell(idx("role")) || "sales_rep") as Role;
      return {
        id: cell(idx("id")) || crypto.randomUUID(),
        name: cell(idx("name")),
        email: cell(idx("email")),
        role: (["admin", "manager", "sales_rep", "operations_manager"].includes(r) ? r : "sales_rep") as Role,
        active: /^true$/i.test(cell(idx("active"))),
        lastLogin: cell(idx("lastLogin")) || undefined,
      };
    });

    setUsers((prev) => {
      const map = new Map(prev.map((u) => [u.id, u]));
      for (const u of parsed) map.set(u.id, u);
      return Array.from(map.values());
    });
    setBanner({ type: "success", message: "CSV içe aktarıldı." });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* --------- UI --------- */
  return (
    <div className="p-6">
      {/* Başlık */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" /> Kullanıcı Yönetimi
          </h1>
          <p className="text-gray-500">Kullanıcı ekle, düzenle, filtrele ve toplu işlemler uygula.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onAddNew}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4" /> Yeni Kullanıcı
          </button>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50"
          >
            <Download className="w-4 h-4" /> Dışa Aktar
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50"
          >
            <Upload className="w-4 h-4" /> İçe Aktar
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={importCsv} />
          </button>
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div
          className={`mb-4 p-3 rounded-xl border text-sm flex items-start gap-2 ${
            banner.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : banner.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-blue-50 border-blue-200 text-blue-700"
          }`}
        >
          {banner.type === "error" ? <AlertTriangle className="w-4 h-4 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 mt-0.5" />}
          <div className="flex-1">{banner.message}</div>
          <button onClick={() => setBanner(null)} className="p-1 rounded hover:bg-black/5">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filtreler */}
      <div className="bg-white rounded-xl border p-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="İsim, e-posta veya rol ara…"
              className="w-64 pl-9 pr-3 py-2 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as any);
                setPage(1);
              }}
              className="rounded-lg border-gray-300"
            >
              <option value="all">Tüm Roller</option>
              <option value="admin">Admin</option>
              <option value="manager">Yönetici</option>
              <option value="operations_manager">Operasyon Yöneticisi</option>
              <option value="sales_rep">Saha Temsilcisi</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="rounded-lg border-gray-300"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
            </select>
          </div>

          {/* Bulk aksiyonlar */}
          <div className="ml-auto flex items-center gap-2">
            <button
              disabled={selected.size === 0}
              onClick={() => bulkActivate(true)}
              className="disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50"
              title="Seçili kullanıcıları aktifleştir"
            >
              <CheckCircle2 className="w-4 h-4" /> Aktifleştir
            </button>
            <button
              disabled={selected.size === 0}
              onClick={() => bulkActivate(false)}
              className="disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50"
              title="Seçili kullanıcıları pasifleştir"
            >
              <Circle className="w-4 h-4" /> Pasifleştir
            </button>
            <button
              disabled={selected.size === 0}
              onClick={() => askDelete()}
              className="disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50"
              title="Seçili kullanıcıları sil"
            >
              <Trash2 className="w-4 h-4" /> Sil
            </button>
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2 pl-3">
                <input
                  type="checkbox"
                  aria-label="Tümünü seç"
                  checked={pageData.length > 0 && pageData.every((u) => selected.has(u.id))}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                />
              </th>
              <Th label="Kullanıcı" sortKey="name" sortState={{ sortKey, sortDir }} onClick={toggleSort} />
              <Th label="E-posta" sortKey="email" sortState={{ sortKey, sortDir }} onClick={toggleSort} />
              <Th label="Rol" sortKey="role" sortState={{ sortKey, sortDir }} onClick={toggleSort} />
              <Th label="Durum" sortKey="active" sortState={{ sortKey, sortDir }} onClick={toggleSort} />
              <Th label="Son Giriş" sortKey="lastLogin" sortState={{ sortKey, sortDir }} onClick={toggleSort} />
              <th className="py-2 pr-3 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((u) => (
              <tr key={u.id} className="border-b last:border-b-0">
                <td className="py-2 pl-3 align-middle">
                  <input
                    type="checkbox"
                    checked={selected.has(u.id)}
                    onChange={() => toggleSelect(u.id)}
                    aria-label={`${u.name} seç`}
                  />
                </td>
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={u.name} />
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate">{u.name}</div>
                    </div>
                  </div>
                </td>
                <td className="py-2 pr-3">
                  <div className="text-gray-800">{u.email}</div>
                </td>
                <td className="py-2 pr-3">
                  <RoleBadge role={u.role} />
                </td>
                <td className="py-2 pr-3">
                  <StatusBadge active={u.active} />
                </td>
                <td className="py-2 pr-3 text-gray-500">{toLocal(u.lastLogin)}</td>
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => askReset(u)}
                      className="px-2 py-1 rounded-lg border hover:bg-gray-50"
                      title="Şifre Sıfırla"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(u)}
                      className="px-2 py-1 rounded-lg border hover:bg-gray-50"
                      title="Düzenle"
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => askDelete(u)}
                      className="px-2 py-1 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pageData.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  Sonuç yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Sayfalama */}
        <div className="flex items-center justify-between p-3 border-t bg-gray-50">
          <div className="text-xs text-gray-500">
            {filtered.length} kayıt • {page}/{totalPages} sayfa
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1 px-2 py-1 rounded border bg-white hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" /> Önceki
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1 px-2 py-1 rounded border bg-white hover:bg-gray-50"
            >
              Sonraki <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Form Modal (Ekle/Düzenle) */}
      {showForm && editUser && (
        <Modal onClose={() => setShowForm(false)} title={users.some((x) => x.id === editUser.id) ? "Kullanıcıyı Düzenle" : "Yeni Kullanıcı"}>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Ad Soyad</label>
              <input
                className="w-full rounded-lg border-gray-300"
                value={editUser.name}
                onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">E-posta</label>
              <input
                className="w-full rounded-lg border-gray-300"
                value={editUser.email}
                onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-600">Rol</label>
                <select
                  className="w-full rounded-lg border-gray-300"
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value as Role })}
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Yönetici</option>
                  <option value="operations_manager">Operasyon Yöneticisi</option>
                  <option value="sales_rep">Saha Temsilcisi</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editUser.active}
                    onChange={(e) => setEditUser({ ...editUser, active: e.target.checked })}
                  />
                  Aktif
                </label>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">
              İptal
            </button>
            <button onClick={saveUser} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
              Kaydet
            </button>
          </div>
        </Modal>
      )}

      {/* Onay Modalları */}
      {confirmType && confirmType.action === "delete" && (
        <Confirm
          title="Silme Onayı"
          message={confirmType.bulk ? "Seçili kullanıcıları silmek istediğinize emin misiniz?" : "Bu kullanıcıyı silmek istediğinize emin misiniz?"}
          confirmText="Sil"
          confirmTone="danger"
          onCancel={() => setConfirmType(null)}
          onConfirm={doDelete}
        />
      )}

      {confirmType && confirmType.action === "reset" && confirmType.user && (
        <Confirm
          title="Şifre Sıfırla"
          message={`${confirmType.user.email} adresine şifre sıfırlama bağlantısı gönderilecek.`}
          confirmText="Gönder"
          onCancel={() => setConfirmType(null)}
          onConfirm={doReset}
        />
      )}
    </div>
  );
};

/* ============ Alt Bileşenler ============ */
const Th: React.FC<{
  label: string;
  sortKey: keyof UserRecord;
  sortState: { sortKey: keyof UserRecord; sortDir: "asc" | "desc" };
  onClick: (k: keyof UserRecord) => void;
}> = ({ label, sortKey, sortState, onClick }) => {
  const active = sortState.sortKey === sortKey;
  return (
    <th
      className={`py-2 pr-3 select-none cursor-pointer ${active ? "text-gray-900" : ""}`}
      onClick={() => onClick(sortKey)}
      title="Sırala"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          <MoreVertical
            className={`w-3.5 h-3.5 ${sortState.sortDir === "asc" ? "rotate-90" : "-rotate-90"} transition-transform`}
          />
        ) : null}
      </span>
    </th>
  );
};

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40" onClick={onClose} />
    <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-lg">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="font-semibold text-gray-900">{title}</div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

const Confirm: React.FC<{
  title: string;
  message: string;
  confirmText: string;
  confirmTone?: "danger" | "primary";
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ title, message, confirmText, confirmTone = "primary", onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-lg">
      <div className="p-4 border-b font-semibold text-gray-900">{title}</div>
      <div className="p-5 text-sm text-gray-700">{message}</div>
      <div className="p-4 border-t flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">
          İptal
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 rounded-lg text-white ${confirmTone === "danger" ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {confirmText}
        </button>
      </div>
    </div>
  </div>
);

export default UserManagementScreen;
