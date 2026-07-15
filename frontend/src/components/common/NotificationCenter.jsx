import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Loader2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import notificationService from "../../services/notificationService";
import { useAuthStore } from "../../store/authStore";
import DraggableFloatingButton from "./DraggableFloatingButton";

function resolveNotificationUrl(notification) {
  if (notification.type === "farm.rejected") {
    return "/seller/register";
  }

  // Tương thích các thông báo demo/cũ đã lưu route không tồn tại.
  if (notification.url === "/farm-application") {
    return "/seller/register";
  }

  return notification.url;
}

export default function NotificationCenter() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!token) return;
    if (!silent) setLoading(true);

    try {
      const response = await notificationService.getAll({ per_page: 10 });
      const data = response?.data || {};

      if (mounted.current) {
        setNotifications(data.notifications || []);
        setUnreadCount(Number(data.unread_count || 0));
      }
    } catch (error) {
      if (!silent) {
        toast.error(error?.message || "Không thể tải thông báo.");
      }
    } finally {
      if (mounted.current && !silent) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    mounted.current = true;
    if (!token) return undefined;

    load({ silent: true });
    const interval = window.setInterval(() => load({ silent: true }), 30000);
    const handleFocus = () => load({ silent: true });
    window.addEventListener("focus", handleFocus);

    return () => {
      mounted.current = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [token, load]);

  const openPanel = () => {
    setOpen(true);
    load();
  };

  const selectNotification = async (notification) => {
    try {
      if (!notification.read_at) {
        await notificationService.markAsRead(notification.id);
        setUnreadCount((count) => Math.max(0, count - 1));
        setNotifications((items) =>
          items.map((item) =>
            item.id === notification.id
              ? { ...item, read_at: new Date().toISOString() }
              : item,
          ),
        );
      }
    } finally {
      setOpen(false);
      const destination = resolveNotificationUrl(notification);
      if (destination) navigate(destination);
    }
  };

  const markAll = async () => {
    await notificationService.markAllAsRead();
    setUnreadCount(0);
    setNotifications((items) =>
      items.map((item) => ({ ...item, read_at: item.read_at || "read" })),
    );
  };

  if (!token) return null;

  return (
    <>
      <DraggableFloatingButton
        storageKey="organic_farm_notification_button_position_v2"
        defaultSide="right"
        size={52}
        onClick={openPanel}
        aria-label="Mở trung tâm thông báo"
        title="Mở thông báo · Kéo để đổi vị trí"
        className="z-80 grid h-13 w-13 place-items-center rounded-full bg-green-700 text-white shadow-xl transition hover:scale-105 hover:bg-green-800"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </DraggableFloatingButton>

      {open && (
        <div className="fixed inset-0 z-90 bg-black/35" onMouseDown={() => setOpen(false)}>
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Trung tâm thông báo"
            onMouseDown={(event) => event.stopPropagation()}
            className="absolute bottom-0 right-0 flex max-h-[85dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:bottom-4 sm:right-4 sm:max-h-[75dvh] sm:max-w-md sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-black text-slate-950">Thông báo</h2>
                <p className="text-xs font-semibold text-slate-500">
                  {unreadCount} thông báo chưa đọc
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={markAll}
                  disabled={unreadCount === 0}
                  title="Đánh dấu tất cả đã đọc"
                  className="rounded-xl p-2 text-green-700 hover:bg-green-50 disabled:opacity-40"
                >
                  <CheckCheck size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="min-h-48 flex-1 overflow-y-auto p-3">
              {loading ? (
                <div className="grid min-h-48 place-items-center">
                  <Loader2 className="animate-spin text-green-700" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="grid min-h-48 place-items-center text-center text-sm font-semibold text-slate-400">
                  Chưa có thông báo.
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => selectNotification(notification)}
                      className={`w-full rounded-2xl border p-4 text-left transition hover:border-green-200 ${
                        notification.read_at
                          ? "border-slate-100 bg-white"
                          : "border-green-100 bg-green-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-extrabold text-slate-900">
                          {notification.title}
                        </p>
                        {!notification.read_at && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-green-600" />
                        )}
                      </div>
                      <p className="mt-1 text-sm font-medium leading-5 text-slate-600">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-slate-400">
                        {notification.actor?.name
                          ? `${notification.actor.name} · `
                          : ""}
                        {notification.created_at}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
