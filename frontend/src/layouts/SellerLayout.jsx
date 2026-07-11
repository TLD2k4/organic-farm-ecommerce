import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import {
  Home,
  Package,
  ClipboardList,
  ShoppingBag,
  BarChart3,
  Star,
  Bell,
  LogOut,
  Leaf,
  Building2,
} from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import useAuth from "@/hooks/useAuth";
import LogoutModal from "@/components/common/LogoutModal";
import { getImageUrl } from "@/utils/image";

function SellerLayout() {
  const user = useAuthStore((state) => state.user);
  const { logout, logoutAll } = useAuth();
  const [openLogout, setOpenLogout] = useState(false);

  const menuItems = [
    {
      to: "/seller/dashboard",
      label: "Tổng quan",
      icon: Home,
    },
    {
      to: "/seller/products",
      label: "Sản phẩm",
      icon: Package,
    },
    {
      to: "/seller/harvest-lots",
      label: "Lô thu hoạch",
      icon: ClipboardList,
    },
    {
      to: "/seller/orders",
      label: "Đơn hàng",
      icon: ShoppingBag,
    },
    {
      to: "/seller/revenue",
      label: "Thống kê doanh thu",
      icon: BarChart3,
    },
    {
      to: "/seller/reviews",
      label: "Đánh giá",
      icon: Star,
    },
    {
      to: "/seller/farm",
      label: "Thông tin nông trại",
      icon: Building2,
    },
  ];

  return (
    <>
      <div className="min-h-[125vh] bg-[#f6f8f6] text-slate-900 zoom-[0.8]">
        <aside className="fixed left-0 top-0 z-30 flex h-[125vh] w-70 flex-col border-r border-slate-100 bg-white px-5 py-6">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
              <Leaf size={30} />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-green-700">
                GreenFarm
              </h1>
              <p className="text-sm font-medium text-slate-500">
                Seller Dashboard
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "relative flex h-12 items-center gap-4 rounded-xl px-4 text-[15px] font-bold transition",
                      isActive
                        ? "bg-green-50 text-green-700"
                        : "text-slate-700 hover:bg-green-50 hover:text-green-700",
                    ].join(" ")
                  }
                >
                  <Icon size={22} />
                  <span>{item.label}</span>

                  {item.badge && (
                    <span className="ml-auto flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto pt-5">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
                {/* AVATAR SELLER */}
                {user?.avatar ? (
                  <img
                    src={getImageUrl(user.avatar)}
                    alt={user?.name || "Avatar"}
                    className="h-20 w-20 rounded-full border-4 border-green-100 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-2xl font-extrabold text-green-700">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </div>

              <h3 className="mt-4 text-base font-extrabold text-slate-900">
                {user?.name}
              </h3>

              <p className="mt-1 max-w-47.5 truncate text-sm font-medium text-slate-500">
                {user?.email}
              </p>

              <span className="mt-3 inline-flex rounded-lg bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                Nông dân
              </span>
            </div>

            <button
              onClick={() => setOpenLogout(true)}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white font-bold text-slate-700 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={19} />
              Đăng xuất
            </button>
          </div>
        </aside>

        <main className="ml-70 min-h-[125vh]">
          <section className="px-8 py-7">
            <Outlet />
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

export default SellerLayout;
