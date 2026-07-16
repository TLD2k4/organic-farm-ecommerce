/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { AlertTriangle, Loader2, X } from "lucide-react";

function ActionDialog({ options, finish }) {
  const [value, setValue] = useState(options.defaultValue || "");
  const [error, setError] = useState("");
  const requiresReason = options.mode === "reason";

  const submit = () => {
    if (requiresReason && !value.trim()) {
      setError(options.requiredMessage || "Vui lòng nhập lý do trước khi xác nhận.");
      return;
    }
    finish(requiresReason ? value.trim() : true);
  };

  return (
    <div className="fixed inset-0 z-9999 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0" aria-label="Đóng" onClick={() => finish(requiresReason ? null : false)} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start gap-3 border-b border-slate-100 p-5 sm:p-6"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${options.danger ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}><AlertTriangle size={21} /></span><div className="min-w-0 flex-1"><h2 className="text-xl font-black text-slate-950">{options.title || "Xác nhận thao tác"}</h2><p className="mt-1 text-sm font-semibold leading-6 text-slate-500">{options.description || "Vui lòng kiểm tra trước khi tiếp tục."}</p></div><button type="button" onClick={() => finish(requiresReason ? null : false)} aria-label="Đóng hộp thoại xác nhận" title="Đóng hộp thoại xác nhận" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={19} /></button></div>
        <div className="p-5 sm:p-6">{requiresReason && <><label className="text-sm font-black text-slate-700">Lý do <span className="text-red-500">*</span></label><textarea autoFocus rows={4} maxLength={500} value={value} onChange={(event) => { setValue(event.target.value); setError(""); }} placeholder={options.placeholder || "Nhập lý do cụ thể..."} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100" /><div className="mt-1 flex justify-between text-xs font-semibold"><span className="text-red-600">{error}</span><span className="text-slate-400">{value.length}/500</span></div></>}
          <div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => finish(requiresReason ? null : false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Hủy</button><button type="button" onClick={submit} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black text-white ${options.danger ? "bg-red-600 hover:bg-red-700" : "bg-emerald-700 hover:bg-emerald-800"}`}>{options.loading && <Loader2 size={16} className="animate-spin" />}{options.confirmLabel || "Xác nhận"}</button></div>
        </div>
      </div>
    </div>
  );
}

function openActionDialog(options) {
  return new Promise((resolve) => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    const finish = (result) => {
      root.unmount();
      host.remove();
      resolve(result);
    };
    root.render(<ActionDialog options={options} finish={finish} />);
  });
}

export const confirmAction = (options = {}) => openActionDialog({ ...options, mode: "confirm" });
export const requestReason = (options = {}) => openActionDialog({ ...options, mode: "reason", danger: options.danger ?? true });
