import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, FileClock, Loader2, ShieldCheck } from "lucide-react";
import sellerPolicyService from "@/services/sellerPolicyService";
import { useAuthStore } from "@/store/authStore";

const formatDate = (value) => value
  ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "—";

export default function SellerPolicyPage() {
  const token = useAuthStore((state) => state.token);
  const [policy, setPolicy] = useState(null);
  const [policyStatus, setPolicyStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const requests = [sellerPolicyService.current()];
    if (token) {
      requests.push(sellerPolicyService.status().catch(() => ({ data: null })));
      requests.push(sellerPolicyService.history().catch(() => ({ data: [] })));
    }

    const [current, status = { data: null }, accepted = { data: [] }] = await Promise.all(requests);
    setPolicy(current?.data || null);
    setPolicyStatus(status?.data || null);
    setHistory(accepted?.data || []);
  }, [token]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((error) => toast.error(error?.message || "Không thể tải chính sách người bán."))
      .finally(() => setLoading(false));
  }, [load]);

  const acceptCurrentPolicy = async () => {
    if (!checked) {
      toast.error("Vui lòng xác nhận bạn đã đọc chính sách.");
      return;
    }

    setAccepting(true);
    try {
      await sellerPolicyService.accept(policy);
      toast.success(policyStatus?.requires_acceptance
        ? "Đã chấp thuận chính sách mới."
        : "Đã ghi nhận bạn đã đọc chính sách.");
      setChecked(false);
      await load();
      window.dispatchEvent(new Event("seller-policy-required"));
    } catch (error) {
      toast.error(error?.message || "Không thể ghi nhận xác nhận chính sách.");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-5xl space-y-4 px-4 py-10">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}</div>;
  }

  if (!policy) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center"><ShieldCheck className="mx-auto text-slate-400" size={44} /><h1 className="mt-4 text-2xl font-black">Chưa có chính sách đang hiệu lực</h1></div>;
  }

  const shownPolicy = selected?.policy || policy;
  const canAccept = Boolean(policyStatus?.applicable && !policyStatus?.accepted);
  const acceptanceRequired = Boolean(policyStatus?.requires_acceptance);

  return <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-5">
        {canAccept && <section className={`seller-policy-acceptance rounded-3xl border p-5 shadow-sm ${acceptanceRequired ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
          <h2 className="font-black text-slate-950">
            {acceptanceRequired ? "Bạn cần chấp thuận phiên bản mới" : "Có phiên bản chính sách mới"}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            {acceptanceRequired
              ? "Phiên bản này bắt buộc chấp thuận lại để tiếp tục các thao tác quản lý gian hàng."
              : "Phiên bản này không chặn thao tác Seller, nhưng bạn vẫn có thể xác nhận đã đọc để lưu vào lịch sử."}
          </p>
          <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/80 bg-white/70 p-4">
            <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="mt-1 h-4 w-4 accent-emerald-700" />
            <span className="text-sm font-semibold text-slate-700">Tôi đã đọc và hiểu chính sách người bán phiên bản {policy.version}.</span>
          </label>
          <button type="button" disabled={!checked || accepting} onClick={acceptCurrentPolicy} className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
            {accepting && <Loader2 size={17} className="animate-spin" />}
            {accepting ? "Đang ghi nhận..." : acceptanceRequired ? "Chấp thuận phiên bản mới" : "Xác nhận đã đọc"}
          </button>
        </section>}

        {policyStatus?.applicable && policyStatus?.accepted && !selected && <section className="seller-policy-accepted flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
          <div><p className="font-black">Bạn đã chấp thuận phiên bản {policy.version}</p><p className="mt-1 text-sm font-semibold">Ghi nhận lúc {formatDate(policyStatus.latest_acceptance?.accepted_at)}</p></div>
        </section>}

        <article className="seller-policy-content-card rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><ShieldCheck /></div><div><h1 className="text-2xl font-black text-slate-950 sm:text-3xl">{shownPolicy.title}</h1><p className="mt-2 font-semibold text-slate-500">Phiên bản {shownPolicy.version} · Hiệu lực {formatDate(shownPolicy.effective_at)}</p></div></div>
          {shownPolicy.summary && <div className="seller-policy-summary mt-6 whitespace-pre-wrap rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-950">{shownPolicy.summary}</div>}
          <div className="seller-policy-section mt-7 whitespace-pre-wrap text-sm font-medium leading-7 text-slate-700 sm:text-base">{shownPolicy.content}</div>
          {selected && <button type="button" onClick={() => setSelected(null)} className="mt-7 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-black text-white">Quay lại bản hiện hành</button>}
        </article>
      </div>

      <aside className="h-fit rounded-3xl border border-slate-100 bg-white p-5 shadow-sm lg:sticky lg:top-24">
        <h2 className="flex items-center gap-2 font-black text-slate-900"><FileClock size={19} /> Lịch sử đã chấp thuận</h2>
        {!token ? <p className="mt-3 text-sm font-semibold text-slate-500">Đăng nhập để xem các phiên bản bạn đã chấp thuận.</p> : history.length === 0 ? <p className="mt-3 text-sm font-semibold text-slate-500">Chưa có lịch sử chấp thuận.</p> : <div className="mt-4 space-y-2">{history.map((item) => <button type="button" key={item.id} disabled={!item.policy} onClick={() => setSelected(item)} className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-left hover:border-emerald-200 disabled:opacity-50"><p className="font-black text-slate-800">Phiên bản {item.policy_version}</p><p className="mt-1 text-xs font-semibold text-slate-500">Đồng ý lúc {formatDate(item.accepted_at)}</p></button>)}</div>}
      </aside>
    </div>
  </main>;
}
