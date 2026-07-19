// src/components/ui/customer/profile/ProfileSidebar.jsx

import {
  User,
  Lock,
  MapPin,
  ClipboardList,
  Star,
  Store,
  Shield,
  StoreIcon,
  LogOut,
} from "lucide-react";

import { useState } from "react";

import { Link, useSearchParams } from "react-router-dom";

import LogoutModal from "@/components/common/LogoutModal";

import useAuth from "@/hooks/useAuth";

import { getImageUrl } from "@/utils/image";
import { canViewPublicFarm, getFarmEntryPath } from "@/utils/farm";

export default function ProfileSidebar() {
  const { user, logout, logoutAll } = useAuth();

  const [openLogout, setOpenLogout] = useState(false);

  const [searchParams] = useSearchParams();

  const tab = searchParams.get("tab") || "info";

  const isAdmin = user?.roles?.includes("admin");

  const farm = user?.farm;

  const hasFarm = Boolean(farm);

  const publicFarmAvailable = canViewPublicFarm(farm);

  const farmEntryPath = getFarmEntryPath(user);

  const canManageFarm = farmEntryPath === "/seller";

  const farmActionLabel = canManageFarm
    ? "Quản trị gian hàng"
    : hasFarm
      ? "Hồ sơ gian hàng"
      : "Đăng ký gian hàng";

  const menus = [
    {
      key: "info",
      label: "Thông tin cá nhân",
      icon: User,
    },
    {
      key: "password",
      label: "Đổi mật khẩu",
      icon: Lock,
    },
    {
      key: "address",
      label: "Địa chỉ giao hàng",
      icon: MapPin,
    },
    {
      key: "orders",
      label: "Đơn hàng của tôi",
      icon: ClipboardList,
    },
    {
      key: "reviews",
      label: "Đánh giá & bình luận",
      icon: Star,
    },
  ];

  return (
    <div className="profile-sidebar h-fit w-full min-w-0 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
      <div className="border-b pb-5 text-center">
        <img
          src={
            getImageUrl(user?.avatar) ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              user?.name || "User",
            )}`
          }
          alt={user?.name}
          className="
            mx-auto
            h-24
            w-24
            rounded-full
            object-cover
          "
        />

        <h3 className="mt-3 text-lg font-bold">{user?.name}</h3>

        <p className="text-sm text-gray-500">{user?.email}</p>
      </div>

      <div className="mt-4">
        {/* TÀI KHOẢN */}
        <div>
          <p className="mb-2 px-3 text-xs font-semibold uppercase text-gray-400">
            Tài khoản
          </p>

          <div className="space-y-1">
            {menus.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.key}
                  to={`/profile?tab=${item.key}`}
                  className={`
                    profile-sidebar-link
                    flex
                    h-11
                    items-center
                    gap-3
                    rounded-xl
                    px-3
                    transition

                    ${
                      tab === item.key
                        ? "profile-sidebar-link-active bg-green-100 text-green-600"
                        : "hover:bg-gray-100"
                    }
                  `}
                >
                  <Icon size={18} />

                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* GIAN HÀNG */}
        <div className="mt-6">
          <p className="mb-2 px-3 text-xs font-semibold uppercase text-gray-400">
            Gian hàng
          </p>

          <div className="space-y-1">
            {publicFarmAvailable && (
              <Link
                to={`/farms/${farm.slug}`}
                className="
                  profile-sidebar-link
                  flex
                  h-11
                  items-center
                  gap-3
                  rounded-xl
                  px-3
                  transition
                  hover:bg-gray-100
                "
              >
                <StoreIcon size={18} />
                Gian hàng công khai
              </Link>
            )}

            <Link
              to={farmEntryPath}
              className="
                profile-sidebar-link
                flex
                h-11
                items-center
                gap-3
                rounded-xl
                px-3
                transition
                hover:bg-gray-100
              "
            >
              <Store size={18} />

              {farmActionLabel}
            </Link>
          </div>
        </div>

        {/* HỆ THỐNG */}
        {isAdmin && (
          <div className="mt-6">
            <p className="mb-2 px-3 text-xs font-semibold uppercase text-gray-400">
              Hệ thống
            </p>

            <Link
              to="/admin"
              className="
                profile-sidebar-link
                flex
                h-11
                items-center
                gap-3
                rounded-xl
                px-3
                transition
                hover:bg-gray-100
              "
            >
              <Shield size={18} />
              Quản trị hệ thống
            </Link>
          </div>
        )}

        <div className="mt-6 border-t pt-4">
          <button
            type="button"
            onClick={() => setOpenLogout(true)}
            className="
              profile-sidebar-logout
              flex
              h-11
              w-full
              items-center
              gap-3
              rounded-xl
              px-3
              text-red-500
              transition
              hover:bg-red-50
            "
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
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
    </div>
  );
}
