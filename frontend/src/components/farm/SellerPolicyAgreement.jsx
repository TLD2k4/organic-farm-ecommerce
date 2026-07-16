import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, FileText, ShieldCheck, X } from "lucide-react";

import {
  SELLER_POLICY_EFFECTIVE_DATE,
  SELLER_POLICY_SECTIONS,
  SELLER_POLICY_SUMMARY,
  SELLER_POLICY_VERSION,
} from "@/constants/sellerPolicy";
import sellerPolicyService from "@/services/sellerPolicyService";

export default function SellerPolicyAgreement({
  checked,
  disabled = false,
  error = null,
  onChange,
  onPolicyLoaded,
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const checkboxId = useId();
  const closeButtonRef = useRef(null);
  const [policy, setPolicy] = useState(null);

  useEffect(() => {
    sellerPolicyService.current().then((response) => {
      const current = response?.data || null;
      setPolicy(current);
      onPolicyLoaded?.(current);
    }).catch(() => onPolicyLoaded?.(null));
  }, [onPolicyLoaded]);

  const summaryItems = policy?.summary
    ? policy.summary.split("\n").map((item) => item.trim()).filter(Boolean)
    : SELLER_POLICY_SUMMARY;
  const version = policy?.version || SELLER_POLICY_VERSION;
  const effectiveDate = policy?.effective_at
    ? new Intl.DateTimeFormat("vi-VN").format(new Date(policy.effective_at))
    : SELLER_POLICY_EFFECTIVE_DATE;

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <section
        className={`seller-policy-summary rounded-2xl border p-4 transition sm:p-5 ${
          error
            ? "border-red-300 bg-red-50/60"
            : "border-emerald-200 bg-emerald-50/60"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <ShieldCheck size={21} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-extrabold text-slate-950">
              Chính sách dành cho người bán
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Trước khi gửi đăng ký, bạn cần đọc và chấp thuận các trách nhiệm
              cơ bản khi vận hành gian hàng.
            </p>
          </div>
        </div>

        <ul className="mt-4 grid gap-2 text-sm leading-5 text-slate-700 sm:grid-cols-2">
          {summaryItems.map((item) => (
            <li key={item} className="flex min-w-0 items-start gap-2">
              <CheckCircle2
                size={16}
                className="mt-0.5 shrink-0 text-emerald-600"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 border-t border-emerald-200/70 pt-4">
          <div className="flex items-start gap-3">
            <input
              id={checkboxId}
              name="policy_accepted"
              type="checkbox"
              checked={checked}
              disabled={disabled}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${checkboxId}-error` : undefined}
              onChange={(event) => onChange(event.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 text-emerald-600 accent-emerald-600 focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="min-w-0 flex-1 text-sm leading-6 text-slate-700">
              <label htmlFor={checkboxId} className="cursor-pointer font-semibold">
                Tôi đã đọc và đồng ý với Thỏa thuận người bán, Quy chế hoạt
                động và Chính sách bảo vệ dữ liệu cá nhân.
              </label>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="inline-flex items-center gap-1.5 font-bold text-emerald-700 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-800"
                >
                  <FileText size={16} />
                  Xem chính sách chi tiết
                </button>

                <span className="text-xs text-slate-500">
                  Phiên bản {version} · Hiệu lực {" "}
                  {effectiveDate}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <p
              id={`${checkboxId}-error`}
              role="alert"
              className="mt-2 text-sm font-semibold text-red-600"
            >
              {error}
            </p>
          )}
        </div>
      </section>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-200 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setOpen(false);
                }
              }}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="seller-policy-modal flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[88dvh] sm:rounded-3xl"
              >
                <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
                  <div className="min-w-0">
                    <h2
                      id={titleId}
                      className="text-lg font-extrabold text-slate-950 sm:text-2xl"
                    >
                      Chính sách và thỏa thuận người bán
                    </h2>

                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                      Phiên bản {version} · Hiệu lực từ {" "}
                      {effectiveDate}
                    </p>
                  </div>

                  <button
                    ref={closeButtonRef}
                    type="button"
                    aria-label="Đóng chính sách"
                    onClick={() => setOpen(false)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                  >
                    <X size={20} />
                  </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
                  <div className="seller-policy-notice rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
                    Việc chấp thuận chính sách này là điều kiện để mở gian
                    hàng. Nội dung không bao gồm sự đồng ý nhận email, tin nhắn
                    quảng cáo hoặc chia sẻ dữ liệu cho mục đích tiếp thị.
                  </div>

                  {policy?.content ? (
                    <div className="mt-5 whitespace-pre-wrap text-sm font-medium leading-7 text-slate-700 sm:text-base">{policy.content}</div>
                  ) : <div className="mt-5 space-y-5">
                    {SELLER_POLICY_SECTIONS.map((section) => (
                      <article key={section.title} className="seller-policy-section">
                        <h3 className="font-extrabold text-slate-900 sm:text-lg">
                          {section.title}
                        </h3>

                        <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700 sm:text-base">
                          {section.items.map((item) => (
                            <li key={item} className="flex items-start gap-2.5">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>}
                </div>

                <footer className="seller-policy-footer shrink-0 border-t border-slate-200 bg-white p-4 sm:px-6">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700"
                  >
                    Đã đọc xong
                  </button>
                </footer>
              </section>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
