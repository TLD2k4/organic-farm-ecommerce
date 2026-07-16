import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Edit3, Eye, FileCheck2, FilePlus2, Loader2, Send, Trash2, X } from "lucide-react";
import adminSellerPolicyService from "@/services/adminSellerPolicyService";
import { confirmAction, requestReason } from "@/utils/actionDialog";

const EMPTY = { version: "", title: "Chính sách và thỏa thuận người bán", summary: "", content: "", requires_reacceptance: true, effective_at: "", change_note: "" };
const STATUS = { 0: ["Bản nháp", "bg-slate-100 text-slate-700"], 1: ["Đang hiệu lực", "bg-emerald-100 text-emerald-700"], 2: ["Đã hết hiệu lực", "bg-amber-100 text-amber-700"] };
const date = (value) => value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
const firstError = (error, fallback) => Object.values(error?.errors || {})[0]?.[0] || error?.message || fallback;

export default function SellerPoliciesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formPolicy, setFormPolicy] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [viewPolicy, setViewPolicy] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const response = await adminSellerPolicyService.index({ per_page: 50 }); setItems(response?.data?.data || []); }
    catch (error) { toast.error(firstError(error, "Không thể tải chính sách.")); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const publish = async (policy) => {
    const reason = await requestReason({ title: `Công bố phiên bản ${policy.version}`, description: policy.requires_reacceptance ? "Toàn bộ Seller sẽ được thông báo và yêu cầu chấp thuận lại." : "Phiên bản mới không bắt buộc Seller chấp thuận lại.", placeholder: "Mô tả thay đổi của phiên bản này...", confirmLabel: "Công bố" });
    if (!reason) return;
    setActionId(policy.id);
    try { const currentPolicyId = items.find((item) => Number(item.status) === 1)?.id || null; await adminSellerPolicyService.publish(policy.id, reason, currentPolicyId); toast.success("Đã công bố chính sách mới."); await load(); }
    catch (error) { toast.error(firstError(error, "Không thể công bố chính sách.")); }
    finally { setActionId(null); }
  };

  const remove = async (policy) => {
    const ok = await confirmAction({ title: "Xóa bản nháp?", description: `Phiên bản ${policy.version} sẽ bị xóa.`, confirmLabel: "Xóa bản nháp", danger: true });
    if (!ok) return;
    setActionId(policy.id);
    try { await adminSellerPolicyService.remove(policy.id); toast.success("Đã xóa bản nháp."); await load(); }
    catch (error) { toast.error(firstError(error, "Không thể xóa bản nháp.")); }
    finally { setActionId(null); }
  };

  const viewDetails = async (policy) => {
    setViewPolicy(policy);
    setViewLoading(true);
    try {
      const response = await adminSellerPolicyService.show(policy.id);
      setViewPolicy(response?.data || policy);
    } catch (error) {
      toast.error(firstError(error, "Không thể tải chi tiết chính sách."));
      setViewPolicy(null);
    } finally {
      setViewLoading(false);
    }
  };

  return <div className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-black text-slate-950">Chính sách người bán</h1><p className="mt-1 text-sm font-semibold text-slate-500">Quản lý phiên bản, nội dung, người công bố và lịch sử Seller chấp thuận.</p></div><button type="button" onClick={() => setFormPolicy({ ...EMPTY })} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-black text-white"><FilePlus2 size={18} /> Tạo phiên bản</button></div>
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {loading ? <div className="space-y-3 p-5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div> : items.length === 0 ? <div className="p-12 text-center font-bold text-slate-400">Chưa có chính sách.</div> : <div className="overflow-x-auto"><table className="w-full min-w-250 text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Phiên bản</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Người thực hiện</th><th className="px-4 py-3">Chấp thuận</th><th className="px-4 py-3">Hiệu lực</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead><tbody>{items.map((policy) => { const status = STATUS[policy.status] || STATUS[0]; return <tr key={policy.id} className="border-t border-slate-100 align-top"><td className="px-4 py-4"><p className="font-black text-slate-900">{policy.version}</p><p className="mt-1 max-w-80 font-semibold text-slate-500">{policy.title}</p></td><td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs font-black ${status[1]}`}>{status[0]}</span>{policy.requires_reacceptance && <p className="mt-2 text-xs font-bold text-red-600">Bắt đồng ý lại</p>}</td><td className="px-4 py-4 text-xs font-semibold text-slate-600"><p>Tạo: {policy.creator?.name || "Hệ thống"}</p><p className="mt-1">Công bố: {policy.publisher?.name || "—"}</p><p className="mt-1 text-slate-400">{date(policy.published_at)}</p></td><td className="px-4 py-4 font-black text-slate-700">{policy.acceptances_count || 0} Seller</td><td className="px-4 py-4 font-semibold text-slate-600">{date(policy.effective_at)}</td><td className="px-4 py-4"><div className="flex justify-end gap-2">{actionId === policy.id ? <Loader2 className="animate-spin" size={18} /> : <><button type="button" onClick={() => viewDetails(policy)} className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50" title="Xem chi tiết"><Eye size={17} /></button>{Number(policy.status) === 0 ? <><button type="button" onClick={() => setFormPolicy(policy)} className="rounded-lg border border-slate-200 p-2 text-slate-700" title="Sửa"><Edit3 size={17} /></button><button type="button" onClick={() => publish(policy)} className="rounded-lg bg-emerald-600 p-2 text-white" title="Công bố"><Send size={17} /></button><button type="button" onClick={() => remove(policy)} className="rounded-lg bg-red-50 p-2 text-red-700" title="Xóa"><Trash2 size={17} /></button></> : <FileCheck2 className="mt-2 text-emerald-600" size={20} />}</>}</div></td></tr>; })}</tbody></table></div>}
    </div>
    {formPolicy && <PolicyForm policy={formPolicy} onClose={() => setFormPolicy(null)} onSaved={async () => { setFormPolicy(null); await load(); }} />}
    {viewPolicy && <PolicyDetailModal policy={viewPolicy} loading={viewLoading} onClose={() => setViewPolicy(null)} />}
  </div>;
}

function PolicyDetailModal({ policy, loading, onClose }) {
  const status = STATUS[policy.status] || STATUS[0];

  return <div className="fixed inset-0 z-100 grid place-items-center bg-slate-950/60 p-3 backdrop-blur-sm" role="dialog" aria-modal="true">
    <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Đóng" />
    <div className="seller-policy-detail-modal relative max-h-[94dvh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
      <div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-black text-slate-950">Phiên bản {policy.version}</h2><span className={`rounded-full px-3 py-1 text-xs font-black ${status[1]}`}>{status[0]}</span></div><p className="mt-2 font-semibold text-slate-600">{policy.title}</p></div><button type="button" onClick={onClose} aria-label="Đóng chi tiết chính sách" title="Đóng chi tiết chính sách" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100"><X /></button></div>
      {loading ? <div className="flex items-center justify-center gap-2 py-16 font-bold text-slate-500"><Loader2 className="animate-spin" size={20} /> Đang tải chi tiết...</div> : <>
        <div className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600 sm:grid-cols-2"><p>Tạo bởi: <strong>{policy.creator?.name || "Hệ thống"}</strong></p><p>Công bố bởi: <strong>{policy.publisher?.name || "—"}</strong></p><p>Hiệu lực: <strong>{date(policy.effective_at)}</strong></p><p>Đã chấp thuận: <strong>{policy.acceptances_count || 0} Seller</strong></p><p className="sm:col-span-2">Cách áp dụng: <strong>{policy.requires_reacceptance ? "Bắt buộc Seller chấp thuận lại" : "Không bắt buộc, Seller vẫn có thể xác nhận đã đọc"}</strong></p>{policy.change_note && <p className="sm:col-span-2">Ghi chú công bố: <strong>{policy.change_note}</strong></p>}</div>
        {policy.summary && <div className="seller-policy-summary mt-5 whitespace-pre-wrap rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-950">{policy.summary}</div>}
        <div className="seller-policy-section mt-6 whitespace-pre-wrap text-sm font-medium leading-7 text-slate-700 sm:text-base">{policy.content}</div>
      </>}
    </div>
  </div>;
}

function PolicyForm({ policy, onClose, onSaved }) {
  const editing = Boolean(policy.id);
  const [form, setForm] = useState({ ...EMPTY, ...policy, effective_at: policy.effective_at ? String(policy.effective_at).slice(0, 16) : "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const change = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const save = async () => {
    setSaving(true); setError("");
    try { const payload = { version: form.version.trim(), title: form.title.trim(), summary: form.summary.trim() || null, content: form.content.trim(), requires_reacceptance: Boolean(form.requires_reacceptance), effective_at: form.effective_at || null, change_note: form.change_note.trim() || null, last_known_updated_at: editing ? policy.updated_at : null }; if (editing) await adminSellerPolicyService.update(policy.id, payload); else await adminSellerPolicyService.create(payload); toast.success(editing ? "Đã cập nhật bản nháp." : "Đã tạo bản nháp."); await onSaved(); }
    catch (requestError) { setError(firstError(requestError, "Không thể lưu chính sách.")); }
    finally { setSaving(false); }
  };
  return <div className="fixed inset-0 z-100 grid place-items-center bg-slate-950/60 p-3 backdrop-blur-sm" role="dialog" aria-modal="true"><button className="absolute inset-0" onClick={onClose} aria-label="Đóng" /><div className="relative max-h-[94dvh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7"><div className="flex justify-between gap-4"><div><h2 className="text-xl font-black text-slate-950">{editing ? `Sửa bản nháp ${policy.version}` : "Tạo phiên bản chính sách"}</h2><p className="mt-1 text-sm font-semibold text-slate-500">Bản đã công bố không thể sửa; muốn thay đổi hãy tạo phiên bản mới.</p></div><button type="button" onClick={onClose} aria-label="Đóng biểu mẫu chính sách" title="Đóng biểu mẫu chính sách" className="grid h-10 w-10 place-items-center rounded-full bg-slate-100"><X /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Phiên bản" value={form.version} onChange={(v) => change("version", v)} placeholder="Ví dụ: 2026.02" /><Field label="Tiêu đề" value={form.title} onChange={(v) => change("title", v)} /><label className="sm:col-span-2"><span className="text-sm font-black text-slate-700">Tóm tắt (mỗi ý một dòng)</span><textarea rows={4} value={form.summary} onChange={(e) => change("summary", e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm" /></label><label className="sm:col-span-2"><span className="text-sm font-black text-slate-700">Nội dung đầy đủ</span><textarea rows={16} value={form.content} onChange={(e) => change("content", e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm leading-6" /></label><Field type="datetime-local" label="Ngày hiệu lực" value={form.effective_at} onChange={(v) => change("effective_at", v)} /><Field label="Ghi chú thay đổi" value={form.change_note} onChange={(v) => change("change_note", v)} /><label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 sm:col-span-2"><input type="checkbox" checked={form.requires_reacceptance} onChange={(e) => change("requires_reacceptance", e.target.checked)} className="mt-1 accent-red-600" /><span><strong className="block text-sm text-slate-800">Yêu cầu Seller chấp thuận lại</strong><small className="text-slate-500">Khi công bố, Seller sẽ được thông báo và bị chặn thao tác ghi cho đến khi đồng ý.</small></span></label></div>{error && <p className="mt-4 font-bold text-red-600">{error}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" disabled={saving} onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 font-bold">Hủy</button><button type="button" disabled={saving || !form.version.trim() || !form.title.trim() || !form.content.trim()} onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 font-black text-white disabled:opacity-50">{saving && <Loader2 size={17} className="animate-spin" />}{saving ? "Đang lưu" : "Lưu bản nháp"}</button></div></div></div>;
}

function Field({ label, value, onChange, type = "text", placeholder = "" }) { return <label><span className="text-sm font-black text-slate-700">{label}</span><input type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label>; }
