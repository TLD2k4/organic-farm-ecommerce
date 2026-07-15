import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Check, Monitor, Moon, Settings, Sun, Type } from "lucide-react";

import {
  getPreferences,
  savePreferences,
} from "../../utils/preferences";
import auditService from "../../services/auditService";

export default function SettingsPage() {
  const [preferences, setPreferences] = useState(() => getPreferences());
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);

  useEffect(() => {
    auditService
      .getAdminLogs({ per_page: 10 })
      .then((response) => setAuditLogs(response?.data?.logs || []))
      .catch(() => setAuditLogs([]))
      .finally(() => setAuditLoading(false));
  }, []);

  const update = (field, value) => {
    const next = savePreferences({ ...preferences, [field]: value });
    setPreferences(next);
  };

  const save = () => {
    setPreferences(savePreferences(preferences));
    toast.success("Đã lưu cài đặt giao diện trên thiết bị này.");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black text-slate-950">
          <Settings className="text-red-600" />
          Cài đặt giao diện
        </h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Tùy chỉnh sáng/tối, cỡ chữ và mật độ hiển thị. Lựa chọn được áp dụng
          cho toàn bộ khu vực người mua, seller và admin trên trình duyệt này.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-black text-slate-900">Chế độ màu</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Choice
            active={preferences.theme === "light"}
            icon={Sun}
            title="Sáng"
            description="Nền sáng, độ tương phản quen thuộc."
            onClick={() => update("theme", "light")}
          />
          <Choice
            active={preferences.theme === "dark"}
            icon={Moon}
            title="Tối"
            description="Giảm độ chói khi làm việc ban đêm."
            onClick={() => update("theme", "dark")}
          />
          <Choice
            active={preferences.theme === "system"}
            icon={Monitor}
            title="Theo hệ thống"
            description="Tự đổi theo thiết bị."
            onClick={() => update("theme", "system")}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-black text-slate-900">
          Nhật ký thao tác quản trị gần đây
        </h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Lưu người thực hiện, đối tượng, chuyển trạng thái, thời gian, IP và lý
          do để đối soát khi có sự cố.
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full min-w-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Người thao tác</th>
                <th className="px-4 py-3">Hành động</th>
                <th className="px-4 py-3">Đối tượng</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Lý do</th>
              </tr>
            </thead>
            <tbody>
              {auditLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="border-t border-slate-100">
                    <td colSpan="6" className="px-4 py-3">
                      <div className="h-5 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                    Chưa có nhật ký thao tác.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-3 font-semibold text-slate-500">
                      {log.created_at}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-700">
                      {log.actor?.name || "Tài khoản đã xóa"}
                    </td>
                    <td className="px-4 py-3 font-extrabold text-red-700">
                      {actionLabel(log.action)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {log.subject_type} #{log.subject_id}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {statusLabel(log.subject_type, log.from_status)} →{" "}
                      {statusLabel(log.subject_type, log.to_status)}
                    </td>
                    <td className="max-w-72 px-4 py-3 text-slate-600">
                      {log.reason || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
          <Type size={20} /> Cỡ chữ
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            [90, "Nhỏ"],
            [100, "Mặc định"],
            [110, "Lớn"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => update("fontScale", value)}
              className={`rounded-xl border p-4 text-left transition ${
                Number(preferences.fontScale) === value
                  ? "border-red-400 bg-red-50 text-red-800"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <p className="font-black">{label}</p>
              <p className="mt-1 text-sm font-semibold opacity-70">{value}%</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-black text-slate-900">Mật độ dữ liệu</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Choice
            active={preferences.density === "comfortable"}
            icon={Monitor}
            title="Thoải mái"
            description="Khoảng cách rộng, dễ thao tác cảm ứng."
            onClick={() => update("density", "comfortable")}
          />
          <Choice
            active={preferences.density === "compact"}
            icon={Monitor}
            title="Gọn"
            description="Hiển thị nhiều hàng dữ liệu hơn."
            onClick={() => update("density", "compact")}
          />
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-black text-white shadow-sm hover:bg-red-700"
        >
          <Check size={18} /> Lưu cài đặt
        </button>
      </div>
    </div>
  );
}

function actionLabel(action) {
  const labels = {
    approve: "Duyệt",
    reject: "Từ chối",
    suspend: "Đình chỉ",
    reopen: "Mở lại",
    lock: "Khóa",
    unlock: "Mở khóa",
    soft_delete: "Xóa mềm",
    restore: "Khôi phục",
    force_delete: "Xóa vĩnh viễn",
    status_update: "Đổi trạng thái",
  };

  return labels[action] || action;
}

function statusLabel(type, status) {
  if (status === null || status === undefined || status === "") return "—";
  const value = Number(status);
  const groups = {
    user: { 0: "Bị khóa", 1: "Đang hoạt động" },
    farm: { 0: "Chờ duyệt", 1: "Đang hoạt động", 2: "Bị từ chối", 3: "Tạm khóa" },
    product: { 0: "Chờ duyệt", 1: "Đang bán", 2: "Bị từ chối", 3: "Tạm ẩn/đình chỉ" },
    certificate: { 0: "Chờ duyệt", 1: "Đã duyệt", 2: "Bị từ chối", 3: "Hết hạn", 4: "Đã thay thế" },
    product_certificate: { 0: "Chờ duyệt", 1: "Đã duyệt", 2: "Bị từ chối", 3: "Hết hạn", 4: "Đã thay thế" },
    order: { 0: "Chờ xác nhận", 1: "Đang xử lý", 2: "Đang giao", 3: "Hoàn thành", 4: "Đã hủy" },
    sub_order: { 0: "Chờ xác nhận", 1: "Đang chuẩn bị", 2: "Đang giao", 3: "Hoàn thành", 4: "Đã hủy" },
    review: { 0: "Đang ẩn", 1: "Đang hiển thị" },
  };
  const rawType = String(type || "").split("\\").pop();
  const normalizedType = rawType
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
  return groups[normalizedType]?.[value] ?? String(status);
}

function Choice({ active, icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        active
          ? "border-red-400 bg-red-50 text-red-800"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <Icon size={21} />
        {active && <Check size={18} />}
      </div>
      <p className="mt-3 font-black">{title}</p>
      <p className="mt-1 text-sm font-semibold opacity-70">{description}</p>
    </button>
  );
}
