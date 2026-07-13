// src/layouts/AdminLayout.jsx

import { useEffect, useState } from "react";

import { NavLink, Outlet } from "react-router-dom";

import {
  Award,
  BarChart3,
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  ShoppingBag,
  Star,
  Tags,
  Users,
  X,
} from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import useAuth from "@/hooks/useAuth";

import LogoutModal from "@/components/common/LogoutModal";
import { getImageUrl } from "@/utils/image";

const menuItems = [
  {
    to: "/admin/dashboard",
    label: "Tổng quan",
    icon: LayoutDashboard,
  },
  {
    to: "/admin/users",
    label: "Người dùng",
    icon: Users,
  },
  {
    to: "/admin/farms",
    label: "Nông trại",
    icon: Building2,
  },
  {
    to: "/admin/products",
    label: "Sản phẩm",
    icon: ShoppingBag,
  },
  {
    to: "/admin/orders",
    label: "Đơn hàng",
    icon: ClipboardList,
  },
  {
    to: "/admin/categories",
    label: "Danh mục",
    icon: Tags,
  },
  {
    to: "/admin/certifications",
    label: "Chứng chỉ",
    icon: Award,
  },
  {
    to: "/admin/reviews",
    label: "Đánh giá",
    icon: Star,
  },
  {
    to: "/admin/reports",
    label: "Báo cáo",
    icon: BarChart3,
  },
  {
    to: "/admin/settings",
    label: "Cài đặt",
    icon: Settings,
  },
];

function AdminAvatar({ user, size = "large" }) {
  const sizeClass =
    size === "small" ? "h-10 w-10 text-base" : "h-20 w-20 text-2xl";

  return (
    <div
      className={`
        flex
        shrink-0
        items-center
        justify-center

        overflow-hidden
        rounded-full

        bg-red-100

        font-extrabold
        text-red-700

        ${sizeClass}
      `}
    >
      {user?.avatar ? (
        <img
          src={getImageUrl(user.avatar)}
          alt={user?.name || "Admin Avatar"}
          className="
            h-full
            w-full
            object-cover
          "
        />
      ) : (
        <span>{user?.name?.trim()?.charAt(0)?.toUpperCase() || "A"}</span>
      )}
    </div>
  );
}

function SidebarContent({ user, mobile = false, onClose, onOpenLogout }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* BRAND */}
      <div
        className={`
          flex
          shrink-0
          items-center
          justify-between

          border-b
          border-slate-100

          ${mobile ? "px-4 py-4" : "px-5 py-6"}
        `}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center

              rounded-2xl

              bg-red-100

              text-red-700

              lg:h-12
              lg:w-12
            "
          >
            <Shield size={mobile ? 27 : 30} />
          </div>

          <div className="min-w-0">
            <h1
              className="
                truncate

                text-xl
                font-extrabold
                text-red-700

                lg:text-2xl
              "
            >
              GreenFarm
            </h1>

            <p className="text-xs font-medium text-slate-500 lg:text-sm">
              Admin Panel
            </p>
          </div>
        </div>

        {mobile && (
          <button
            type="button"
            aria-label="Đóng menu quản trị"
            onClick={onClose}
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center

              rounded-xl

              bg-slate-100

              text-slate-700

              transition-colors

              hover:bg-red-50
              hover:text-red-700
            "
          >
            <X size={21} />
          </button>
        )}
      </div>

      {/* MENU */}
      <nav
        className="
          min-h-0
          flex-1

          space-y-1.5

          overflow-y-auto
          overscroll-contain

          px-3
          py-4

          lg:px-5
        "
      >
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin/dashboard"}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  `
                    relative

                    flex
                    min-h-12
                    items-center

                    gap-3

                    rounded-xl

                    px-4

                    text-[14px]
                    font-bold

                    transition-all
                    duration-200

                    lg:gap-4
                    lg:text-[15px]
                  `,
                  isActive
                    ? `
                      bg-red-50
                      text-red-700

                      shadow-[inset_3px_0_0_#b91c1c]
                    `
                    : `
                      text-slate-700

                      hover:bg-red-50
                      hover:text-red-700
                    `,
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={21}
                    className={isActive ? "text-red-700" : "text-slate-500"}
                  />

                  <span className="truncate">{item.label}</span>

                  {item.badge && (
                    <span
                      className="
                        ml-auto

                        flex
                        h-6
                        min-w-6
                        items-center
                        justify-center

                        rounded-full

                        bg-red-500

                        px-2

                        text-xs
                        font-bold
                        text-white
                      "
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* USER */}
      <div
        className="
          shrink-0

          border-t
          border-slate-100

          bg-white

          p-4

          lg:px-5
          lg:pb-5
          lg:pt-4
        "
      >
        {mobile ? (
          <div className="flex items-center gap-3">
            <AdminAvatar user={user} size="small" />

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-extrabold text-slate-900">
                {user?.name || "Quản trị viên"}
              </h3>

              <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                {user?.email}
              </p>

              <span
                className="
                  mt-1.5

                  inline-flex

                  rounded-md

                  bg-red-100

                  px-2
                  py-0.5

                  text-[10px]
                  font-bold
                  text-red-700
                "
              >
                Admin
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <AdminAvatar user={user} />

            <h3 className="mt-3 max-w-full truncate text-base font-extrabold text-slate-900">
              {user?.name || "Quản trị viên"}
            </h3>

            <p className="mt-1 max-w-52.5 truncate text-sm font-medium text-slate-500">
              {user?.email}
            </p>

            <span
              className="
                mt-2

                inline-flex

                rounded-lg

                bg-red-100

                px-3
                py-1

                text-xs
                font-bold
                text-red-700
              "
            >
              Admin
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={onOpenLogout}
          className="
            mt-4

            flex
            h-11
            w-full
            items-center
            justify-center

            gap-2

            rounded-xl

            bg-white

            font-bold
            text-slate-700

            transition-colors

            hover:bg-red-50
            hover:text-red-600

            lg:h-12
          "
        >
          <LogOut size={19} />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const user = useAuthStore((state) => state.user);

  const { logout, logoutAll } = useAuth();

  const [openLogout, setOpenLogout] = useState(false);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  /*
   * Khi sidebar mobile mở:
   * - khóa cuộn body;
   * - nhấn Escape để đóng.
   */
  useEffect(() => {
    if (!mobileSidebarOpen) {
      return undefined;
    }

    const oldOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = oldOverflow;

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileSidebarOpen]);

  const handleOpenLogout = () => {
    setMobileSidebarOpen(false);
    setOpenLogout(true);
  };

  return (
    <>
      <div
        className="
          min-h-screen
          w-full

          overflow-x-hidden

          bg-[#f6f8f6]
          text-slate-900
        "
      >
        {/* MOBILE HEADER */}
        <header
          className="
            sticky
            top-0
            z-30

            flex
            h-16
            items-center
            justify-between

            border-b
            border-slate-200

            bg-white/95

            px-4

            shadow-sm
            backdrop-blur

            sm:px-6

            lg:hidden
          "
        >
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Mở menu quản trị"
              aria-expanded={mobileSidebarOpen}
              onClick={() => setMobileSidebarOpen(true)}
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center

                rounded-xl

                bg-red-50

                text-red-700

                transition-colors

                hover:bg-red-100
              "
            >
              <Menu size={22} />
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-base font-extrabold text-red-700 sm:text-lg">
                GreenFarm Admin
              </h1>

              <p className="hidden text-xs text-slate-500 sm:block">
                Hệ thống quản trị
              </p>
            </div>
          </div>

          <AdminAvatar user={user} size="small" />
        </header>

        {/* MOBILE OVERLAY */}
        <button
          type="button"
          aria-label="Đóng menu quản trị"
          onClick={() => setMobileSidebarOpen(false)}
          className={`
            fixed
            inset-0
            z-40

            bg-slate-950/50

            backdrop-blur-[1px]

            transition-all
            duration-300

            lg:hidden

            ${
              mobileSidebarOpen
                ? `
                  visible
                  pointer-events-auto
                  opacity-100
                `
                : `
                  invisible
                  pointer-events-none
                  opacity-0
                `
            }
          `}
        />

        {/* MOBILE SIDEBAR */}
        <aside
          className={`
            fixed
            inset-y-0
            left-0
            z-50

            w-[86vw]
            max-w-77.5

            bg-white

            shadow-[10px_0_40px_rgba(15,23,42,0.18)]

            transition-transform
            duration-300
            ease-out

            lg:hidden

            ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <SidebarContent
            user={user}
            mobile
            onClose={() => setMobileSidebarOpen(false)}
            onOpenLogout={handleOpenLogout}
          />
        </aside>

        {/* DESKTOP SIDEBAR */}
        <aside
          className="
            fixed
            inset-y-0
            left-0
            z-30

            hidden
            w-70

            border-r
            border-slate-100

            bg-white

            lg:block
          "
        >
          <SidebarContent
            user={user}
            onClose={() => {}}
            onOpenLogout={() => setOpenLogout(true)}
          />
        </aside>

        {/* CONTENT */}
        <main
          className="
            min-h-[calc(100vh-64px)]
            min-w-0

            lg:ml-70
            lg:min-h-screen
          "
        >
          <section
            className="
              min-w-0

              px-3
              py-4

              sm:px-5
              sm:py-5

              md:px-6

              lg:px-8
              lg:py-7

              xl:px-10
            "
          >
            {/*
              overflow-x-auto giúp những trang có
              bảng rộng không phá layout mobile.
            */}
            <div className="min-w-0">
              <Outlet />
            </div>
          </section>
        </main>
      </div>

      <LogoutModal
        open={openLogout}
        onClose={() => setOpenLogout(false)}
        onLogout={async () => {
          setOpenLogout(false);
          await logout();
        }}
        onLogoutAll={async () => {
          setOpenLogout(false);
          await logoutAll();
        }}
      />
    </>
  );
}
