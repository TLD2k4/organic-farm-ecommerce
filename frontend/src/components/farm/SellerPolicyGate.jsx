import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ChevronDown, ChevronUp, Loader2, ShieldAlert, X } from "lucide-react";
import sellerPolicyService from "@/services/sellerPolicyService";

export default function SellerPolicyGate({ onAccepted }) {
  const [policy, setPolicy] = useState(null);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [detailPolicy, setDetailPolicy] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [dismissedVersion, setDismissedVersion] = useState(null);

  useEffect(() => {
    let active = true;
    const refresh = () => sellerPolicyService.status()
      .then((response) => {
        if (!active) return;
        const nextPolicy = response?.data || null;
        setPolicy(nextPolicy);

        const version = nextPolicy?.current_version;
        if (nextPolicy?.requires_acceptance) {
          setDismissedVersion((current) => current === version ? current : null);
        } else {
          const dismissed = version && window.localStorage.getItem(`seller-policy-notice:${version}`) === "dismissed";
          setDismissedVersion(dismissed ? version : null);
        }
      })
      .catch(() => {});
    const onVisibility = () => { if (document.visibilityState === "visible") refresh(); };
    const onPolicyRequired = () => {
      setDismissedVersion(null);
      refresh();
    };

    refresh();
    window.addEventListener("seller-policy-required", onPolicyRequired);
    document.addEventListener("visibilitychange", onVisibility);
    const timer = window.setInterval(refresh, 60_000);

    return () => {
      active = false;
      window.removeEventListener("seller-policy-required", onPolicyRequired);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    setChecked(false);
    setShowDetails(false);
    setDetailPolicy(null);
  }, [policy?.current_version]);

  const required = Boolean(policy?.requires_acceptance);
  const requiredNotice = Boolean(
    required && dismissedVersion !== policy?.current_version,
  );
  const optionalNotice = Boolean(
    policy?.applicable
      && policy?.can_accept
      && !required
      && dismissedVersion !== policy?.current_version,
  );

  if (!requiredNotice && !optionalNotice) return null;

  const dismiss = () => {
    if (!policy?.current_version) return;
    if (!required) {
      window.localStorage.setItem(`seller-policy-notice:${policy.current_version}`, "dismissed");
    }
    setDismissedVersion(policy.current_version);
  };

  const toggleDetails = async () => {
    if (showDetails) {
      setShowDetails(false);
      return;
    }

    setShowDetails(true);
    if (detailPolicy) return;

    setDetailsLoading(true);
    try {
      const response = await sellerPolicyService.current();
      setDetailPolicy(response?.data || null);
    } catch (error) {
      toast.error(error?.message || "Không thể tải nội dung chính sách.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const accept = async () => {
    if (!checked) return toast.error("Bạn cần xác nhận đã đọc chính sách mới.");
    setSaving(true);
    try {
      await sellerPolicyService.accept(policy.current_policy);
      toast.success(required
        ? "Đã chấp thuận chính sách người bán mới."
        : "Đã ghi nhận bạn đã đọc chính sách mới.");
      setPolicy((value) => ({
        ...value,
        requires_acceptance: false,
        accepted: true,
        can_accept: false,
      }));
      onAccepted?.();
      if (required) window.location.reload();
    } catch (error) {
      toast.error(error?.message || "Không thể ghi nhận chấp thuận chính sách.");
    } finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-100 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
    <button type="button" aria-label="Đóng thông báo chính sách" onClick={dismiss} className="absolute inset-0" />
    <div className="seller-policy-gate relative max-h-[94dvh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
      <button type="button" onClick={dismiss} aria-label="Đóng" title="Đóng" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"><X size={20} /></button>
      <div className="flex gap-3 pr-11"><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${required ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}><ShieldAlert /></div><div><h2 className="text-xl font-black text-slate-950">Chính sách người bán đã được cập nhật</h2><p className="mt-1 text-sm font-semibold text-slate-500">Phiên bản {policy.current_version} · hiệu lực {policy.effective_at}</p></div></div>
      <p className="mt-5 text-sm font-medium leading-6 text-slate-600">{required
        ? "Bạn có thể đóng thông báo để tiếp tục xem hệ thống. Chỉ các thao tác cập nhật dữ liệu Seller mới yêu cầu chấp thuận phiên bản này; khi đó hệ thống sẽ mở lại thông báo."
        : "Phiên bản này không bắt buộc chấp thuận lại và không chặn thao tác Seller. Bạn có thể xem chi tiết, xác nhận đã đọc hoặc đóng thông báo để xem sau."}</p>
      <button type="button" onClick={toggleDetails} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-700 hover:bg-emerald-100">
        {showDetails ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        {showDetails ? "Ẩn nội dung chính sách" : "Xem nội dung chính sách"}
      </button>
      {showDetails && <div className="seller-policy-inline-detail mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
        {detailsLoading ? <div className="flex items-center gap-2 py-6 text-sm font-bold text-slate-500"><Loader2 size={18} className="animate-spin" /> Đang tải chính sách...</div> : detailPolicy ? <>
          {detailPolicy.summary && <div className="seller-policy-summary whitespace-pre-wrap rounded-xl border border-emerald-100 bg-white p-3 text-sm font-semibold leading-6 text-emerald-950">{detailPolicy.summary}</div>}
          <div className="mt-4 max-h-72 overflow-y-auto whitespace-pre-wrap pr-2 text-sm font-medium leading-7 text-slate-700">{detailPolicy.content}</div>
        </> : <p className="text-sm font-semibold text-red-600">Không tải được nội dung chính sách. Vui lòng thử lại.</p>}
      </div>}
      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4"><input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="mt-1 h-4 w-4 accent-emerald-700" /><span className="text-sm font-semibold text-slate-700">{required ? `Tôi đã đọc, hiểu và đồng ý với chính sách người bán phiên bản ${policy.current_version}.` : `Tôi xác nhận đã đọc chính sách người bán phiên bản ${policy.current_version}.`}</span></label>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button type="button" disabled={saving} onClick={dismiss} className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 font-black text-slate-700 hover:bg-slate-50">{required ? "Đóng và xem sau" : "Để sau"}</button>
        <button type="button" disabled={!checked || saving} onClick={accept} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-black text-white disabled:opacity-50">{saving && <Loader2 size={18} className="animate-spin" />}{saving ? "Đang ghi nhận..." : required ? "Chấp thuận và tiếp tục" : "Xác nhận đã đọc"}</button>
      </div>
    </div>
  </div>;
}
