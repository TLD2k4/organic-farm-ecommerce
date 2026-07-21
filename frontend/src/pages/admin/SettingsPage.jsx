import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Check, ChevronLeft, ChevronRight, Eye, Monitor, Moon, Settings, Sun, Type, X } from "lucide-react";

import {
  getPreferences,
  savePreferences,
} from "../../utils/preferences";
import auditService from "../../services/auditService";

export default function SettingsPage() {
  const [preferences, setPreferences] = useState(() => getPreferences());
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPagination, setAuditPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
  });
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);

  useEffect(() => {
    let active = true;

    setAuditLoading(true);
    auditService
      .getAdminLogs({ page: auditPage, per_page: 10 })
      .then((response) => {
        if (!active) return;
        setAuditLogs(response?.data?.logs || []);
        setAuditPagination((previous) => ({
          ...previous,
          ...(response?.data?.pagination || {}),
        }));
      })
      .catch(() => {
        if (!active) return;
        setAuditLogs([]);
        setAuditPagination({
          current_page: auditPage,
          last_page: 1,
          total: 0,
          per_page: 10,
        });
      })
      .finally(() => {
        if (active) setAuditLoading(false);
      });

    return () => {
      active = false;
    };
  }, [auditPage]);

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
                <th className="px-4 py-3 text-center">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {auditLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="border-t border-slate-100">
                    <td colSpan="7" className="px-4 py-3">
                      <div className="h-5 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
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
                      <SubjectReference log={log} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {statusLabel(log.subject_type, log.from_status)} →{" "}
                      {statusLabel(log.subject_type, log.to_status)}
                    </td>
                    <td className="max-w-72 px-4 py-3 text-slate-600">
                      {log.reason || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedAuditLog(log)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-extrabold text-sky-700 transition hover:bg-sky-100"
                      >
                        <Eye size={15} /> Xem
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-slate-500">
            Tổng {Number(auditPagination.total || 0).toLocaleString("vi-VN")} nhật ký
            {auditPagination.last_page > 1
              ? ` · Trang ${auditPagination.current_page}/${auditPagination.last_page}`
              : ""}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={auditLoading || auditPagination.current_page <= 1}
              onClick={() => setAuditPage((page) => Math.max(1, page - 1))}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={17} /> Trước
            </button>

            <button
              type="button"
              disabled={
                auditLoading ||
                auditPagination.current_page >= auditPagination.last_page
              }
              onClick={() =>
                setAuditPage((page) =>
                  Math.min(Number(auditPagination.last_page || 1), page + 1),
                )
              }
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sau <ChevronRight size={17} />
            </button>
          </div>
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

      {selectedAuditLog && (
        <AuditLogDetailModal
          log={selectedAuditLog}
          onClose={() => setSelectedAuditLog(null)}
        />
      )}
    </div>
  );
}

function AuditLogDetailModal({ log, onClose }) {
  const contextEntries = Object.entries(log?.context || {});

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/60 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Chi tiết lịch sử thao tác"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">
              Chi tiết lịch sử thao tác
            </h3>
            <p className="mt-0.5 text-sm font-semibold text-slate-500">
              Nhật ký #{log.id} · {log.created_at}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Đóng"
          >
            <X size={21} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">
              Đối tượng được thao tác
            </p>
            <SubjectReference log={log} />
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailItem
              label="Người thao tác"
              value={log.actor?.name || "Tài khoản đã xóa"}
              description={log.actor?.email || null}
            />
            <DetailItem label="Hành động" value={actionLabel(log.action)} />
            <DetailItem
              label="Trạng thái trước"
              value={statusLabel(log.subject_type, log.from_status)}
            />
            <DetailItem
              label="Trạng thái sau"
              value={statusLabel(log.subject_type, log.to_status)}
            />
            <DetailItem label="Địa chỉ IP" value={log.ip_address || "—"} />
            <DetailItem label="Thời gian" value={log.created_at || "—"} />
          </div>

          <section className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Lý do / ghi chú
            </p>
            <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm font-semibold text-slate-700">
              {log.reason || "Không có lý do hoặc ghi chú."}
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
              Thiết bị
            </p>
            <p className="mt-2 wrap-break-word text-sm text-slate-700">
              {log.user_agent || "Không ghi nhận."}
            </p>
          </section>

          {contextEntries.length > 0 && (
            <section className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Dữ liệu liên quan
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {contextEntries.map(([key, value]) => (
                  <DetailItem
                    key={key}
                    label={contextLabel(key)}
                    value={formatContextValue(key, value)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, description = null }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 wrap-break-word text-sm font-extrabold text-slate-800">
        {value ?? "—"}
      </p>
      {description && (
        <p className="mt-0.5 wrap-break-word text-xs text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}

function contextLabel(key) {
  return {
    actor_id: "Mã người thao tác",
    user_id: "Mã tài khoản",
    farm_id: "Mã nông trại",
    order_id: "Mã đơn tổng",
    sub_order_id: "Mã đơn theo nông trại",
    product_id: "Mã sản phẩm",
    certificate_id: "Mã hồ sơ chứng chỉ",
    category_id: "Mã danh mục",
    seller_id: "Mã người bán",
    buyer_id: "Mã người mua",
    user_name: "Tên tài khoản",
    user_email: "Email tài khoản",
    farm_name: "Tên nông trại",
    product_name: "Tên sản phẩm",
    certificate_number: "Số chứng chỉ",
    order_code: "Mã đơn tổng",
    sub_order_code: "Mã đơn theo nông trại",
    version: "Phiên bản chính sách",
    payment_method: "Phương thức thanh toán",
    payment_status: "Trạng thái thanh toán",
    transaction_id: "Mã giao dịch",
    seller_note: "Ghi chú của người bán",
    admin_note: "Ghi chú của quản trị viên",
    reason: "Lý do",
    rejection_reason: "Lý do từ chối",
    cancel_reason: "Lý do hủy",
    requires_reacceptance: "Yêu cầu chấp thuận lại",
  }[key] || "Thông tin bổ sung";
}

function formatContextValue(key, value) {
  if (value === null || value === undefined || value === "") return "—";

  if (typeof value === "boolean") {
    return value ? "Có" : "Không";
  }

  if (key === "payment_method") {
    return {
      cod: "Thanh toán khi nhận hàng (COD)",
      momo: "Thanh toán MoMo",
    }[normalizeAuditToken(value)] || "Phương thức khác";
  }

  if (key === "payment_status") {
    return {
      0: "Chưa thanh toán",
      1: "Đã thanh toán",
      2: "Thanh toán thất bại",
      3: "Đã hoàn tiền",
      pending: "Chờ thanh toán",
      paid: "Đã thanh toán",
      failed: "Thanh toán thất bại",
      refunded: "Đã hoàn tiền",
    }[normalizeAuditToken(value)] || "Chưa xác định";
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .map(([childKey, childValue]) =>
        `${contextLabel(childKey)}: ${formatContextValue(childKey, childValue)}`,
      )
      .join("; ");
  }

  const normalized = normalizeAuditToken(value);
  const commonValues = {
    true: "Có",
    false: "Không",
    active: "Đang hoạt động",
    inactive: "Ngừng hoạt động",
    pending: "Chờ xử lý",
    approved: "Đã duyệt",
    rejected: "Bị từ chối",
    suspended: "Bị đình chỉ",
    deleted: "Đã xóa mềm",
    purged: "Đã xóa vĩnh viễn",
    published: "Đã công bố",
    archived: "Đã hết hiệu lực",
    draft: "Bản nháp",
  };

  return commonValues[normalized] || String(value);
}

function SubjectReference({ log }) {
  const subject = log?.subject;

  if (!subject) {
    return (
      <span>
        {subjectTypeLabel(log?.subject_type)} #{log?.subject_id}
      </span>
    );
  }

  const content = (
    <span className="block min-w-48">
      <span className="block text-xs font-bold uppercase tracking-wide text-slate-400">
        {subject.type_label || subjectTypeLabel(log?.subject_type)}
      </span>
      <span className="audit-subject-name mt-0.5 block font-extrabold text-slate-800">
        {subject.code || `#${subject.id}`}
        {subject.name ? ` — ${subject.name}` : ""}
      </span>
      {subject.description && (
        <span className="mt-0.5 block text-xs text-slate-500">
          {subject.description}
        </span>
      )}
      {!subject.exists && (
        <span className="mt-0.5 block text-xs font-semibold text-amber-600">
          Đối tượng đã bị xóa vĩnh viễn
        </span>
      )}
    </span>
  );

  if (!subject.detail_url) {
    return content;
  }

  return (
    <Link
      to={subject.detail_url}
      className="audit-subject-link group inline-flex items-start gap-2 rounded-lg p-1 -m-1 transition"
      title="Mở chi tiết đối tượng"
    >
      {content}
      <Eye
        size={16}
        className="mt-4 shrink-0 text-sky-600 opacity-70 group-hover:opacity-100"
      />
    </Link>
  );
}

function normalizeAuditToken(value) {
  return String(value ?? "")
    .split("\\")
    .pop()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s.-]+/g, "_")
    .toLowerCase();
}

function subjectTypeLabel(type) {
  const normalized = normalizeAuditToken(type);

  return {
    user: "Tài khoản",
    farm: "Nông trại",
    product: "Sản phẩm",
    product_certificate: "Hồ sơ chứng chỉ sản phẩm",
    certificate: "Hồ sơ chứng chỉ sản phẩm",
    order: "Đơn hàng tổng",
    sub_order: "Đơn hàng theo nông trại",
    review: "Đánh giá/Bình luận",
    seller_policy: "Chính sách người bán",
  }[normalized] || "Đối tượng khác";
}

function actionLabel(action) {
  const normalized = normalizeAuditToken(action);
  const labels = {
    approve: "Duyệt",
    reject: "Từ chối",
    suspend: "Đình chỉ",
    reopen: "Mở lại",
    lock: "Khóa tài khoản",
    unlock: "Mở khóa tài khoản",
    soft_delete: "Xóa mềm",
    restore: "Khôi phục",
    force_delete: "Xóa vĩnh viễn",
    status_update: "Cập nhật trạng thái",
    cancel: "Hủy",
    cancel_all: "Hủy toàn bộ đơn hàng",
    create: "Tạo mới",
    update: "Cập nhật",
    publish: "Công bố",
    archive: "Cho hết hiệu lực",
  };

  return labels[normalized] || "Thao tác khác";
}

function statusLabel(type, status) {
  if (status === null || status === undefined || status === "") return "—";

  const normalizedStatus = normalizeAuditToken(status);
  const commonStatuses = {
    deleted: "Đã xóa mềm",
    purged: "Đã xóa vĩnh viễn",
    draft: "Bản nháp",
    published: "Đang hiệu lực",
    archived: "Đã hết hiệu lực",
    active: "Đang hoạt động",
    inactive: "Ngừng hoạt động",
    pending: "Chờ xử lý",
    approved: "Đã duyệt",
    rejected: "Bị từ chối",
    suspended: "Bị đình chỉ",
    hidden: "Đang ẩn",
    visible: "Đang hiển thị",
    preparing: "Đang chuẩn bị",
    processing: "Đang xử lý",
    shipping: "Đang giao",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    canceled: "Đã hủy",
    paid: "Đã thanh toán",
    unpaid: "Chưa thanh toán",
    failed: "Thất bại",
    refunded: "Đã hoàn tiền",
    expired: "Hết hạn",
    replaced: "Đã thay thế",
  };

  if (commonStatuses[normalizedStatus]) {
    return commonStatuses[normalizedStatus];
  }

  const numericStatus = Number(status);
  const normalizedType = normalizeAuditToken(type);
  const groups = {
    user: { 0: "Bị khóa", 1: "Đang hoạt động" },
    farm: {
      0: "Chờ duyệt",
      1: "Đang hoạt động",
      2: "Bị từ chối",
      3: "Bị đình chỉ",
    },
    product: {
      0: "Chờ duyệt",
      1: "Đang bán",
      2: "Bị từ chối",
      3: "Tạm ẩn/đình chỉ",
    },
    certificate: {
      0: "Chờ duyệt",
      1: "Đã duyệt",
      2: "Bị từ chối",
      3: "Hết hạn",
      4: "Đã thay thế",
    },
    product_certificate: {
      0: "Chờ duyệt",
      1: "Đã duyệt",
      2: "Bị từ chối",
      3: "Hết hạn",
      4: "Đã thay thế",
    },
    order: {
      0: "Chờ xác nhận",
      1: "Đang xử lý",
      2: "Đang giao",
      3: "Hoàn thành",
      4: "Đã hủy",
    },
    sub_order: {
      0: "Chờ xác nhận",
      1: "Đang chuẩn bị",
      2: "Đang giao",
      3: "Hoàn thành",
      4: "Đã hủy",
    },
    review: { 0: "Đang ẩn", 1: "Đang hiển thị" },
    seller_policy: {
      0: "Bản nháp",
      1: "Đang hiệu lực",
      2: "Đã hết hiệu lực",
    },
  };

  if (Number.isFinite(numericStatus)) {
    return groups[normalizedType]?.[numericStatus] ?? "Trạng thái chưa xác định";
  }

  return "Trạng thái chưa xác định";
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
