import { useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";

const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 1000;

export default function AdminProductRejectModal({
  context,
  loading = false,
  onClose,
  onConfirm,
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const cleanReason = useMemo(
    () => reason.replace(/\s+/g, " ").trim(),
    [reason],
  );

  if (!context) {
    return null;
  }

  const isCertificate = context.type === "certificate";

  const title = isCertificate
    ? "Từ chối hồ sơ chứng chỉ"
    : "Từ chối sản phẩm";

  const targetName = isCertificate
    ? `${context.certificationName || "Chứng chỉ"} — ${context.certificateNumber || "Không có số"}`
    : context.productName;

  const handleClose = () => {
    if (!loading) {
      onClose?.();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!cleanReason) {
      setError("Lý do từ chối không được để trống.");
      return;
    }

    if (cleanReason.length < MIN_REASON_LENGTH) {
      setError(
        `Lý do từ chối phải có ít nhất ${MIN_REASON_LENGTH} ký tự.`,
      );
      return;
    }

    if (cleanReason.length > MAX_REASON_LENGTH) {
      setError(
        `Lý do từ chối tối đa ${MAX_REASON_LENGTH} ký tự.`,
      );
      return;
    }

    try {
      await onConfirm(cleanReason);
    } catch (submitError) {
      const responseError =
        submitError?.response?.data ?? submitError;

      const serverMessage =
        responseError?.errors?.rejection_reason?.[0] ||
        responseError?.message;

      setError(
        serverMessage || "Không thể thực hiện thao tác từ chối.",
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-product-reject-title"
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 p-3 sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4 sm:p-5">
          <div className="min-w-0">
            <h2
              id="admin-product-reject-title"
              className="text-lg font-extrabold text-slate-900 sm:text-xl"
            >
              {title}
            </h2>
            <p className="mt-1 wrap-break-word text-sm text-slate-500">
              {targetName || "Đối tượng kiểm duyệt"}
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleClose}
            aria-label="Đóng"
            className="shrink-0 rounded-lg p-2 transition hover:bg-slate-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form
          noValidate
          onSubmit={handleSubmit}
          className="space-y-4 p-4 sm:p-5"
        >
          <div>
            <label
              htmlFor="admin-product-rejection-reason"
              className="mb-2 block font-semibold text-slate-800"
            >
              Lý do từ chối
              <span className="ml-1 text-red-500">*</span>
            </label>

            <textarea
              id="admin-product-rejection-reason"
              rows={6}
              value={reason}
              disabled={loading}
              maxLength={MAX_REASON_LENGTH}
              aria-invalid={Boolean(error)}
              placeholder={
                isCertificate
                  ? "Ví dụ: Hồ sơ không rõ đơn vị cấp, số chứng chỉ không khớp hoặc file minh chứng không đọc được..."
                  : "Ví dụ: Tên và mô tả sản phẩm chưa chính xác, hình ảnh không đúng sản phẩm hoặc thông tin giá cần chỉnh sửa..."
              }
              onChange={(event) => {
                setReason(event.target.value);
                if (error) setError("");
              }}
              className={`w-full resize-y rounded-xl border px-4 py-3 outline-none transition focus:ring-2 disabled:bg-slate-100 ${
                error
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                  : "border-slate-200 focus:border-red-500 focus:ring-red-100"
              }`}
            />

            <div className="mt-1 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">
                  Nêu rõ nội dung seller cần chỉnh sửa rồi gửi lại.
                </p>

                {error && (
                  <p className="mt-1 text-sm font-medium text-red-600">
                    {error}
                  </p>
                )}
              </div>

              <span className="shrink-0 text-xs text-slate-400">
                {reason.length}/{MAX_REASON_LENGTH}
              </span>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={loading}
              onClick={handleClose}
              className="rounded-xl border border-slate-200 px-5 py-3 font-semibold transition hover:bg-slate-50 disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={
                loading || cleanReason.length < MIN_REASON_LENGTH
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <Loader2 size={18} className="animate-spin" />
              )}
              {loading ? "Đang xử lý..." : "Xác nhận từ chối"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
