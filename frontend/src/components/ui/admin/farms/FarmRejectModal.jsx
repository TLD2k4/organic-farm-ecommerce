import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 1000;

export default function FarmRejectModal({
  open,
  farm,
  loading = false,
  onClose,
  onConfirm,
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
      setError("");
    }
  }, [open, farm?.id]);

  const cleanReason = useMemo(
    () => reason.replace(/\s+/g, " ").trim(),
    [reason],
  );

  const remaining = MAX_REASON_LENGTH - reason.length;
  const valid =
    cleanReason.length >= MIN_REASON_LENGTH &&
    cleanReason.length <= MAX_REASON_LENGTH;

  if (!open || !farm) return null;

  const handleClose = () => {
    if (loading) return;
    setReason("");
    setError("");
    onClose?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!cleanReason) {
      setError("Lý do từ chối không được để trống.");
      return;
    }

    if (cleanReason.length < MIN_REASON_LENGTH) {
      setError(`Lý do từ chối phải có ít nhất ${MIN_REASON_LENGTH} ký tự.`);
      return;
    }

    if (cleanReason.length > MAX_REASON_LENGTH) {
      setError(`Lý do từ chối tối đa ${MAX_REASON_LENGTH} ký tự.`);
      return;
    }

    try {
      await onConfirm(cleanReason);
      setReason("");
      setError("");
      onClose?.();
    } catch (submitError) {
      const message =
        submitError?.response?.data?.errors?.reason?.[0] ||
        submitError?.errors?.reason?.[0] ||
        submitError?.response?.data?.message ||
        submitError?.message;

      if (message) {
        setError(message);
      } else {
        toast.error("Không thể từ chối nông trại.");
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="farm-reject-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 id="farm-reject-title" className="text-xl font-extrabold">
              Từ chối nông trại
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Chủ nông trại sẽ nhìn thấy lý do này để chỉnh sửa hồ sơ.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Đóng"
            className="rounded-lg p-2 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 p-5">
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-slate-600">
            Nông trại: <strong className="text-slate-900">{farm.name}</strong>
          </div>

          <div>
            <label htmlFor="farm-reject-reason" className="mb-2 block font-semibold">
              Lý do từ chối <span className="text-red-500">*</span>
            </label>

            <textarea
              id="farm-reject-reason"
              rows={6}
              maxLength={MAX_REASON_LENGTH}
              value={reason}
              disabled={loading}
              aria-invalid={Boolean(error)}
              aria-describedby="farm-reject-help farm-reject-error"
              onChange={(event) => {
                setReason(event.target.value);
                if (error) setError("");
              }}
              placeholder="Ví dụ: Hồ sơ chưa có địa chỉ đầy đủ và ảnh chứng minh nguồn gốc sản phẩm. Vui lòng cập nhật rồi gửi duyệt lại."
              className={`w-full resize-y rounded-xl border px-4 py-3 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 ${
                error
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                  : "border-slate-200 focus:border-red-500 focus:ring-red-100"
              }`}
            />

            <div className="mt-1 flex items-start justify-between gap-3">
              <div>
                <p id="farm-reject-help" className="text-xs text-slate-500">
                  Nhập từ {MIN_REASON_LENGTH} đến {MAX_REASON_LENGTH} ký tự, nêu rõ phần cần sửa.
                </p>
                {error && (
                  <p id="farm-reject-error" className="mt-1 text-sm text-red-600">
                    {error}
                  </p>
                )}
              </div>
              <span className={`shrink-0 text-xs ${remaining < 50 ? "text-amber-600" : "text-slate-400"}`}>
                {reason.length}/{MAX_REASON_LENGTH}
              </span>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={loading}
              onClick={handleClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={loading || !valid}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 size={17} className="animate-spin" />}
              {loading ? "Đang xử lý..." : "Xác nhận từ chối"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}