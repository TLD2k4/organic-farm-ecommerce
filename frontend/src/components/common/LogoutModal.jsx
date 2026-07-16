// src/components/common/LogoutModal.jsx

import { useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, LogOut, X } from "lucide-react";

const LogoutModal = ({ open, onClose, onLogout, onLogoutAll }) => {
  const [submitting, setSubmitting] = useState(null);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const handleLogout = async () => {
    if (submitting) return;

    try {
      setSubmitting("current");
      await onLogout?.();
    } finally {
      setSubmitting(null);
    }
  };

  const handleLogoutAll = async () => {
    if (submitting) return;

    try {
      setSubmitting("all");
      await onLogoutAll?.();
    } finally {
      setSubmitting(null);
    }
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !submitting) {
      onClose?.();
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
      onMouseDown={handleBackdropClick}
      className="
        fixed
        inset-0
        z-9999
        flex
        items-center
        justify-center
        bg-black/50
        p-4
        backdrop-blur-[2px]
      "
    >
      <div
        onMouseDown={(event) => event.stopPropagation()}
        className="
          relative
          w-full
          max-w-md
          rounded-3xl
          border
          border-slate-100
          bg-white
          p-6
          shadow-2xl
        "
      >
        <button
          type="button"
          onClick={onClose}
          disabled={Boolean(submitting)}
          aria-label="Đóng"
          className="
            absolute
            right-4
            top-4
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            text-slate-400
            transition
            hover:bg-slate-100
            hover:text-slate-700
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <X size={20} />
        </button>

        <div
          className="
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-2xl
            bg-red-50
            text-red-500
          "
        >
          <LogOut size={26} />
        </div>

        <h2
          id="logout-modal-title"
          className="mt-5 text-xl font-extrabold text-slate-900"
        >
          Xác nhận đăng xuất
        </h2>

        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
          Bạn muốn đăng xuất khỏi thiết bị hiện tại hay đăng xuất khỏi tất cả
          thiết bị?
        </p>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={Boolean(submitting)}
            className="
    flex
    h-12
    w-full
    items-center
    justify-center
    gap-2

    rounded-2xl
    border
    border-green-600

    bg-white

    text-sm
    font-extrabold
    text-green-700

    transition-all
    duration-200

    hover:bg-green-100
    disabled:cursor-not-allowed
    disabled:opacity-60
  "
          >
            {submitting === "current" && (
              <Loader2 size={18} className="animate-spin" />
            )}
            Đăng xuất thiết bị này
          </button>

          <button
            type="button"
            onClick={handleLogoutAll}
            disabled={Boolean(submitting)}
            className="
              flex
              h-12
              w-full
              items-center
              justify-center
              gap-2

              rounded-2xl
              border
              border-red-200

              bg-white

              text-sm
              font-extrabold
              text-red-500

              transition
              hover:bg-red-100

              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {submitting === "all" && (
              <Loader2 size={18} className="animate-spin" />
            )}
            Đăng xuất tất cả thiết bị
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(submitting)}
            className="
              h-11
              w-full

              rounded-2xl

              text-sm
              font-bold
              text-slate-500

              transition
              hover:bg-slate-200

              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Hủy
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default LogoutModal;
