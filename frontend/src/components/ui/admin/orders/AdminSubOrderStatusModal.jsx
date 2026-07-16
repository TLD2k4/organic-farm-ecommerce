import { useState } from "react";
import { Loader2, X } from "lucide-react";

import ResponsiveSelect from "@/components/common/ResponsiveSelect";

export default function AdminSubOrderStatusModal({
  open,
  subOrder,
  loading = false,
  onClose,
  onSubmit,
}) {
  if (!open || !subOrder) {
    return null;
  }

  const options = Array.isArray(subOrder.allowed_next_statuses)
    ? subOrder.allowed_next_statuses
    : [];

  const modalKey = `${subOrder.id}-${subOrder.status}-${options
    .map((option) => option.value)
    .join("-")}`;

  return (
    <AdminSubOrderStatusContent
      key={modalKey}
      subOrder={subOrder}
      options={options}
      loading={loading}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function AdminSubOrderStatusContent({
  subOrder,
  options,
  loading,
  onClose,
  onSubmit,
}) {
  const [status, setStatus] = useState(() => options[0]?.value ?? "");
  const [reason, setReason] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (typeof onSubmit !== "function" || status === "" || !reason.trim()) {
      return;
    }

    await onSubmit(Number(status), reason.trim());
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-sub-order-status-title"
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose?.();
        }
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2
              id="admin-sub-order-status-title"
              className="text-xl font-extrabold"
            >
              Cập nhật trạng thái
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {subOrder.sub_order_code} · {subOrder.farm?.name || "Nông trại"}
            </p>
          </div>

          <label className="block">
            <span className="mb-2 block font-semibold">
              Lý do cập nhật <b className="text-red-600">*</b>
            </span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              maxLength={500}
              disabled={loading}
              placeholder="Nội dung này được lưu trong lịch sử thao tác."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-red-400"
            />
          </label>

          <button
            type="button"
            disabled={loading}
            aria-label="Đóng"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
            Trạng thái hiện tại: <strong>{subOrder.status_text}</strong>. Trạng
            thái đơn tổng sẽ được backend tự đồng bộ từ các đơn theo nông trại.
          </div>

          <div>
            <label className="mb-2 block font-semibold">Chuyển sang</label>

            <ResponsiveSelect
              value={status}
              options={options}
              disabled={loading}
              placeholder="Chọn trạng thái"
              onChange={setStatus}
            />
          </div>

          {Number(status) === 4 && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              Hủy đơn sẽ hoàn kho theo các lô FIFO đã cấp. Đơn MoMo đã thanh
              toán bị backend chặn vì hệ thống chưa có quy trình hoàn tiền.
            </div>
          )}

          {options.length === 0 && (
            <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-600">
              Đơn này không còn trạng thái tiếp theo để cập nhật.
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-3 font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Đóng
            </button>

            <button
              type="submit"
              disabled={
                loading || status === "" || options.length === 0 || !reason.trim()
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? "Đang xử lý..." : "Xác nhận cập nhật"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
