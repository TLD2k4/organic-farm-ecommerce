import { useState } from "react";

import { Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

export default function FarmRejectModal({
  open,
  farm,
  loading,
  onClose,
  onConfirm,
}) {
  const [reason, setReason] = useState("");

  if (!open || !farm) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanReason = reason.trim();

    if (cleanReason.length < 10) {
      toast.error("Lý do từ chối phải có ít nhất 10 ký tự.");

      return;
    }

    try {
      await onConfirm(cleanReason);
      setReason("");
      onClose();
    } catch {
      // Toast đã được xử lý ở trang cha.
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <h2 className="text-xl font-extrabold">Từ chối nông trại</h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <p className="text-slate-600">
            Nông trại: <strong>{farm.name}</strong>
          </p>

          <div>
            <label className="mb-2 block font-semibold">Lý do từ chối</label>

            <textarea
              rows={6}
              maxLength={1000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Nhập lý do để chủ nông trại chỉnh sửa hồ sơ..."
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />

            <div className="mt-1 text-right text-xs text-slate-400">
              {reason.length}/1000
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-bold text-white disabled:opacity-60"
            >
              {loading && <Loader2 size={17} className="animate-spin" />}
              Xác nhận từ chối
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
