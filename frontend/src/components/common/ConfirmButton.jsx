import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function ConfirmButton({
  title, // Tiêu đề hiển thị trong Modal
  tooltip, // Tiêu đề khi hover chuột (Alt/Title)
  onConfirm,
  children,
  type = "danger",
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <>
      {/* trigger */}
      <span
        title={tooltip} // Gắn tooltip vào đây để khi di chuột vào nút sẽ hiện text
        onClick={() => !loading && setOpen(true)}
        className={`inline-flex cursor-pointer ${
          loading ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        {children}
      </span>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-80 rounded-[12px] bg-white p-4 shadow-lg">
            <h2 className="mb-3 font-bold text-gray-800">{title}</h2>

            <div className="flex justify-end gap-2">
              <button
                disabled={loading}
                className="border px-3 py-1 rounded-[6px] hover:bg-gray-50 transition"
                onClick={() => setOpen(false)}
              >
                Hủy
              </button>

              <button
                disabled={loading}
                className={`flex items-center gap-2 rounded px-3 py-1 text-white transition ${
                  type === "danger"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-green-500 hover:bg-green-600"
                }`}
                onClick={async () => {
                  try {
                    setLoading(true);
                    await onConfirm();
                    setOpen(false);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
