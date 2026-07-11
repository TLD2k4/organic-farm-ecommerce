export default function LogoutModal({ open, onClose, onLogout, onLogoutAll }) {
  if (!open) return null;

  return (
    <div
      className="
        fixed
        inset-0

        z-50

        bg-black/40
        backdrop-blur-[2px]

        flex
        items-center
        justify-center
      "
    >
      <div
        className="
          bg-white
          rounded-2xl
          p-6
          w-90

          shadow-[0_10px_40px_rgba(0,0,0,0.12)]
        "
      >
        <h3 className="font-bold text-lg mb-2">Đăng xuất</h3>

        <p className="text-sm text-gray-500 mb-5">
          Bạn muốn đăng xuất như thế nào?
        </p>

        <div className="space-y-3">
          <button
            onClick={onLogout}
            className="
              w-full
              h-11
              rounded-xl

              bg-[#6BAE4F]
              text-white

              hover:bg-[#5f9f46]
              hover:-translate-y-px

              active:scale-[0.98]

              transition-all
              duration-300
            "
          >
            Chỉ thiết bị này
          </button>

          <button
            onClick={onLogoutAll}
            className="
              w-full
              h-11
              rounded-xl

              bg-red-500
              text-white

              hover:bg-red-600
              hover:-translate-y-px

              active:scale-[0.98]

              transition-all
              duration-300
            "
          >
            Tất cả thiết bị
          </button>

          <button
            onClick={onClose}
            className="
              w-full
              h-11
              rounded-xl

              border
              border-[#edf1e8]

              hover:bg-[#f7faf4]
              hover:-translate-y-px

              active:scale-[0.98]

              transition-all
              duration-300
            "
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
