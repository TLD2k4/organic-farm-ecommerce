// src/layouts/AdminLayout.jsx

import { useEffect, useState } from "react";

import { Link, NavLink, Outlet } from "react-router-dom";

import {
  Award,
  BarChart3,
  Building2,
  ChevronDown,
  ClipboardList,
  House,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  ShoppingBag,
  Star,
  Store,
  Tags,
  User,
  Users,
  X,
} from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import useAuth from "@/hooks/useAuth";

import LogoutModal from "@/components/common/LogoutModal";
import { getImageUrl } from "@/utils/image";
import { canViewPublicFarm, getFarmEntryPath } from "@/utils/farm";

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

function AccountActionGrid({ user, onNavigate, onOpenLogout }) {
  const farm = user?.farm;
  const hasFarm = Boolean(farm);
  const publicFarmAvailable = canViewPublicFarm(farm);
  const farmEntryPath = getFarmEntryPath(user);

  const farmActionLabel =
    farmEntryPath === "/seller"
      ? "Quản trị gian hàng"
      : hasFarm
        ? "Hồ sơ gian hàng"
        : "Đăng ký gian hàng";

  const itemClass = `
    account-action-card
    account-action-card-admin
    flex
    min-h-18
    min-w-0
    flex-col
    items-center
    justify-center
    gap-2
    rounded-xl
    border
    border-red-100
    bg-red-50/60
    px-2
    py-3
    text-center
    text-xs
    font-bold
    text-slate-700
    transition
    hover:border-red-200
    hover:bg-red-100
    hover:text-red-800
  `;

  return (
    <div className="grid min-w-0 grid-cols-2 gap-2">
      <Link to="/" onClick={onNavigate} className={itemClass}>
        <House size={19} className="text-red-700" />
        <span>Trang chủ</span>
      </Link>

      <Link to="/profile" onClick={onNavigate} className={itemClass}>
        <User size={19} className="text-red-700" />
        <span>Hồ sơ cá nhân</span>
      </Link>

      <Link to="/profile?tab=orders" onClick={onNavigate} className={itemClass}>
        <ClipboardList size={19} className="text-red-700" />
        <span>Đơn hàng</span>
      </Link>

      <Link to={farmEntryPath} onClick={onNavigate} className={itemClass}>
        <Building2 size={19} className="text-red-700" />
        <span className="break-words">{farmActionLabel}</span>
      </Link>

      {publicFarmAvailable && (
        <Link
          to={`/farms/${farm.slug}`}
          onClick={onNavigate}
          className={itemClass}
        >
          <Store size={19} className="text-red-700" />
          <span>Gian hàng công khai</span>
        </Link>
      )}

      <Link to="/admin" onClick={onNavigate} className={itemClass}>
        <Shield size={19} className="text-red-700" />
        <span>Quản trị hệ thống</span>
      </Link>

      <button
        type="button"
        onClick={onOpenLogout}
        className={`${itemClass} col-span-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700`}
      >
        <LogOut size={19} />
        <span>Đăng xuất</span>
      </button>
    </div>
  );
}

function SidebarContent({
  user,
  mobile = false,
  accountOpen,
  onToggleAccount,
  onCloseAccount,
  onClose,
  onOpenLogout,
}) {
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

          max-h-[65dvh]
          overflow-y-auto
          overscroll-contain

          border-t
          border-slate-100

          bg-white

          p-4

          lg:px-5
          lg:pb-5
          lg:pt-4
        "
      >
        <div data-layout-account>
          <button
            type="button"
            aria-expanded={accountOpen}
            aria-label="Mở menu tài khoản quản trị viên"
            onClick={onToggleAccount}
            className={`
              account-summary-trigger
              account-summary-trigger-admin
              relative
              flex
              w-full
              min-w-0
              items-center
              rounded-2xl
              border
              p-3
              text-left
              transition

              ${
                accountOpen
                  ? "border-red-200 bg-red-50"
                  : "border-transparent hover:bg-red-50"
              }

              ${mobile ? "gap-3" : "flex-col text-center"}
            `}
          >
            <AdminAvatar user={user} size={mobile ? "small" : "large"} />

            <div className={`min-w-0 ${mobile ? "flex-1" : "mt-3 w-full"}`}>
              <h3 className="truncate text-sm font-extrabold text-slate-900 lg:text-base">
                {user?.name || "Quản trị viên"}
              </h3>

              <p className="mt-0.5 truncate text-xs font-medium text-slate-500 lg:text-sm">
                {user?.email}
              </p>

              <span className="mt-1.5 inline-flex rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 lg:text-xs">
                Admin
              </span>
            </div>

            <ChevronDown
              size={18}
              className={`shrink-0 text-slate-400 transition-transform ${
                accountOpen ? "rotate-180 text-red-700" : ""
              } ${mobile ? "" : "absolute right-3 top-3"}`}
            />
          </button>

          {accountOpen && (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <AccountActionGrid
                user={user}
                onNavigate={() => {
                  onCloseAccount();
                  onClose();
                }}
                onOpenLogout={() => {
                  onCloseAccount();
                  onOpenLogout();
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const user = useAuthStore((state) => state.user);

  const { logout, logoutAll } = useAuth();

  const [openLogout, setOpenLogout] = useState(false);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarAccountOpen, setSidebarAccountOpen] = useState(false);
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);

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

  useEffect(() => {
    if (!sidebarAccountOpen && !mobileAccountOpen) return undefined;

    const handlePointerDown = (event) => {
      if (event.target.closest?.("[data-layout-account]")) return;

      setSidebarAccountOpen(false);
      setMobileAccountOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSidebarAccountOpen(false);
        setMobileAccountOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarAccountOpen, mobileAccountOpen]);

  const handleOpenLogout = () => {
    setMobileSidebarOpen(false);
    setSidebarAccountOpen(false);
    setMobileAccountOpen(false);
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
              onClick={() => {
                setMobileAccountOpen(false);
                setMobileSidebarOpen(true);
              }}
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

          <div data-layout-account className="relative shrink-0">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={mobileAccountOpen}
              aria-label="Mở menu tài khoản"
              onClick={() => {
                setMobileSidebarOpen(false);
                setSidebarAccountOpen(false);
                setMobileAccountOpen((current) => !current);
              }}
              className={`rounded-full ring-offset-2 transition ${
                mobileAccountOpen
                  ? "ring-2 ring-red-500"
                  : "hover:ring-2 hover:ring-red-200"
              }`}
            >
              <AdminAvatar user={user} size="small" />
            </button>

            {mobileAccountOpen && (
              <div
                role="menu"
                className="account-popover account-popover-admin absolute right-0 top-[calc(100%+0.75rem)] z-50 w-76 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-red-100 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.2)]"
              >
                <div className="mb-3 border-b border-slate-100 px-1 pb-3">
                  <p className="truncate text-sm font-extrabold text-slate-900">
                    {user?.name || "Quản trị viên"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {user?.email}
                  </p>
                </div>

                <AccountActionGrid
                  user={user}
                  onNavigate={() => setMobileAccountOpen(false)}
                  onOpenLogout={handleOpenLogout}
                />
              </div>
            )}
          </div>
        </header>

        {/* MOBILE OVERLAY */}
        <button
          type="button"
          aria-label="Đóng menu quản trị"
          onClick={() => {
            setMobileSidebarOpen(false);
            setSidebarAccountOpen(false);
          }}
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
            accountOpen={sidebarAccountOpen}
            onToggleAccount={() => setSidebarAccountOpen((current) => !current)}
            onCloseAccount={() => setSidebarAccountOpen(false)}
            onClose={() => {
              setMobileSidebarOpen(false);
              setSidebarAccountOpen(false);
            }}
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
            accountOpen={sidebarAccountOpen}
            onToggleAccount={() => setSidebarAccountOpen((current) => !current)}
            onCloseAccount={() => setSidebarAccountOpen(false)}
            onClose={() => setSidebarAccountOpen(false)}
            onOpenLogout={handleOpenLogout}
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
