// src/components/layout/customer/MobileMenu.jsx

import { useState } from "react";

import {
  X,
  ChevronRight,
  ChevronDown,
  House,
  Newspaper,
  Phone,
  Sprout,
  User,
  ClipboardList,
  ShoppingCart,
  Package,
  Store,
  Shield,
  LogOut,
} from "lucide-react";

import { Link } from "react-router-dom";

import useAuth from "@/hooks/useAuth";

import { getImageUrl } from "@/utils/image";
import { getFarmEntryPath } from "@/utils/farm";

const navItems = [
  {
    name: "Trang chủ",
    path: "/",
    icon: House,
  },
  {
    name: "Nông trại",
    path: "/farms",
    icon: Sprout,
  },
  {
    name: "Tin tức",
    path: "/news",
    icon: Newspaper,
  },
  {
    name: "Liên hệ",
    path: "/contact",
    icon: Phone,
  },
];

const quickActionClass = `
  flex
  flex-col
  items-center
  justify-center
  gap-2
  rounded-[14px]
  bg-[#f7faf4]
  py-3
  transition-all
  duration-300
  hover:-translate-y-px
  hover:bg-[#eef6e8]
  active:scale-[0.98]
`;

const getChildren = (category) => {
  return category?.active_children ?? category?.children ?? [];
};

const MobileMenu = ({
  open,
  onClose,
  onOpenLogout,
  categories = [],
  categoriesLoading = false,
}) => {
  const [showCategories, setShowCategories] = useState(false);

  const [openCategoryId, setOpenCategoryId] = useState(null);

  const { user, isAuthenticated } = useAuth();

  const isAdmin = user?.roles?.includes("admin");

  const isSeller = user?.roles?.includes("seller");

  const farm = user?.farm;

  const hasFarm = Boolean(farm);

  const farmEntryPath = getFarmEntryPath(user);

  const canManageFarm = farmEntryPath === "/seller";

  const farmActionLabel = canManageFarm
    ? "Quản trị gian hàng"
    : hasFarm
      ? "Hồ sơ gian hàng"
      : "Đăng ký gian hàng";

  const resetCategoryMenu = () => {
    setShowCategories(false);

    setOpenCategoryId(null);
  };

  const handleClose = () => {
    resetCategoryMenu();

    onClose();
  };

  const handleOpenLogout = () => {
    resetCategoryMenu();

    onOpenLogout();
  };

  const handleToggleCategories = () => {
    if (showCategories) {
      setOpenCategoryId(null);
    }

    setShowCategories((current) => !current);
  };

  const handleToggleCategory = (categoryId) => {
    setOpenCategoryId((currentCategoryId) =>
      currentCategoryId === categoryId ? null : categoryId,
    );
  };

  return (
    <>
      {/* OVERLAY */}
      <div
        onClick={handleClose}
        className={`
          fixed
          inset-0
          z-90
          bg-black/40
          backdrop-blur-[2px]
          transition-all
          duration-300

          ${open ? "visible opacity-100" : "invisible opacity-0"}
        `}
      />

      {/* SIDEBAR */}
      <div
        className={`
          fixed
          left-0
          top-0
          z-95
          h-screen
          w-[88%]
          max-w-85
          overflow-y-auto
          overscroll-contain
          bg-white
          shadow-[0_10px_40px_rgba(0,0,0,0.15)]
          transition-all
          duration-300

          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* HEADER */}
        <div
          className="
            sticky
            top-0
            z-10
            flex
            h-18
            items-center
            justify-between
            border-b
            border-[#edf1e8]
            bg-white
            px-4
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                bg-[#6BAE4F]
                text-[20px]
                text-white
              "
            >
              🌿
            </div>

            <div>
              <h2 className="font-bold text-[#2d5d1f]">Organic Farm</h2>

              <p className="text-[12px] text-[#777]">
                Nông sản sạch cho mọi nhà
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Đóng menu"
            onClick={handleClose}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              bg-[#f7faf4]
              transition-all
              duration-300
              hover:-translate-y-px
              hover:bg-[#eef6e8]
              active:scale-[0.98]
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* USER */}
        {isAuthenticated && (
          <div className="border-b border-[#edf1e8] p-4">
            <div className="flex items-center gap-3">
              <img
                src={
                  user?.avatar
                    ? getImageUrl(user.avatar)
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user?.name || "User",
                      )}`
                }
                alt={user?.name || "User Avatar"}
                className="
                  h-12
                  w-12
                  shrink-0
                  rounded-full
                  object-cover
                "
              />

              <div className="min-w-0">
                <p className="truncate font-semibold">{user?.name}</p>

                <p className="text-xs text-[#777]">
                  {isAdmin
                    ? "Quản trị viên"
                    : isSeller
                      ? "Người bán"
                      : "Khách hàng"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* QUICK ACTIONS */}
        <div
          className="
            grid
            grid-cols-2
            gap-2
            border-b
            border-[#edf1e8]
            p-4
          "
        >
          {/* ACCOUNT */}
          <Link
            to={isAuthenticated ? "/profile" : "/login"}
            onClick={handleClose}
            className={quickActionClass}
          >
            <User size={20} className="text-[#6BAE4F]" />

            <span className="text-[12px] font-medium">
              {isAuthenticated ? "Hồ sơ cá nhân" : "Tài khoản"}
            </span>
          </Link>

          {/* ORDERS */}
          <Link
            to={isAuthenticated ? "/profile?tab=orders" : "/login"}
            onClick={handleClose}
            className={quickActionClass}
          >
            <ClipboardList size={20} className="text-[#6BAE4F]" />

            <span className="text-[12px] font-medium">Đơn hàng</span>
          </Link>

          {/* CART */}
          <Link to="/cart" onClick={handleClose} className={quickActionClass}>
            <ShoppingCart size={20} className="text-[#6BAE4F]" />

            <span className="text-[12px] font-medium">Giỏ hàng</span>
          </Link>

          {/* SELLER */}
          <Link
            to={farmEntryPath}
            onClick={handleClose}
            className={quickActionClass}
          >
            <Store size={20} className="text-[#6BAE4F]" />

            <span className="text-center text-[12px] font-medium">
              {farmActionLabel}
            </span>
          </Link>

          {/* ADMIN */}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={handleClose}
              className={`${quickActionClass} col-span-2`}
            >
              <Shield size={20} className="text-[#6BAE4F]" />

              <span className="text-[12px] font-medium">Quản trị hệ thống</span>
            </Link>
          )}
        </div>

        {/* NAVIGATION */}
        <div className="px-3 py-3">
          <p
            className="
              mb-2
              px-3
              text-[12px]
              font-bold
              uppercase
              tracking-wide
              text-[#777]
            "
          >
            Menu
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleClose}
                className="
                  flex
                  h-12.5
                  items-center
                  justify-between
                  rounded-[14px]
                  px-3
                  transition-all
                  duration-300
                  hover:bg-[#eef6e8]
                  active:scale-[0.99]
                "
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className="text-[#6BAE4F]" />

                  <span className="font-medium text-[#222]">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* CATEGORY */}
        <div className="px-3 pb-6">
          <button
            type="button"
            aria-expanded={showCategories}
            onClick={handleToggleCategories}
            className="
              flex
              h-13
              w-full
              items-center
              justify-between
              rounded-[14px]
              bg-[#f7faf4]
              px-3
              shadow-sm
              transition-all
              duration-300
              ease-out
              hover:-translate-y-px
              hover:bg-[#eef6e8]
              hover:shadow-md
              active:scale-[0.98]
            "
          >
            <div className="flex items-center gap-3">
              <Package size={18} className="text-[#6BAE4F]" />

              <span className="text-[14px] font-semibold text-[#222]">
                Danh mục sản phẩm
              </span>
            </div>

            <ChevronDown
              size={18}
              className={`
                text-[#777]
                transition-all
                duration-300
                ease-out

                ${
                  showCategories
                    ? "-translate-y-px rotate-180 scale-110"
                    : "rotate-0 scale-100"
                }
              `}
            />
          </button>

          {showCategories && (
            <div className="mt-3 space-y-1">
              {/* ALL PRODUCTS */}
              <Link
                to="/products"
                onClick={handleClose}
                className="
                  flex
                  min-h-14
                  items-center
                  justify-between
                  rounded-[14px]
                  bg-[#f7faf4]
                  px-3
                  py-2
                  transition-all
                  duration-300
                  hover:bg-[#eef6e8]
                  active:scale-[0.99]
                "
              >
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-full
                      bg-[#6BAE4F]
                      text-white
                    "
                  >
                    <Package size={18} />
                  </div>

                  <div>
                    <h3 className="text-[14px] font-semibold">
                      Tất cả sản phẩm
                    </h3>

                    <p className="text-[12px] text-[#777]">
                      Xem toàn bộ sản phẩm
                    </p>
                  </div>
                </div>

                <ChevronRight size={15} className="shrink-0 text-[#999]" />
              </Link>

              {/* LOADING */}
              {categoriesLoading ? (
                <div className="space-y-2 pt-1">
                  {[...Array(5)].map((_, index) => (
                    <div
                      key={index}
                      className="
                          h-14
                          animate-pulse
                          rounded-[14px]
                          bg-slate-100
                        "
                    />
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <div
                  className="
                    rounded-[14px]
                    bg-[#f7faf4]
                    px-3
                    py-6
                    text-center
                    text-sm
                    text-[#777]
                  "
                >
                  Chưa có danh mục.
                </div>
              ) : (
                categories.map((item) => {
                  const children = getChildren(item);

                  const hasChildren = children.length > 0;

                  const isCategoryOpen = openCategoryId === item.id;

                  if (hasChildren) {
                    return (
                      <div
                        key={item.id}
                        className="
                          overflow-hidden
                          rounded-[14px]
                          border
                          border-transparent
                          transition-colors
                          duration-200
                        "
                      >
                        <button
                          type="button"
                          aria-expanded={isCategoryOpen}
                          aria-controls={`mobile-category-${item.id}`}
                          onClick={() => handleToggleCategory(item.id)}
                          className={`
                            flex
                            min-h-14
                            w-full
                            items-center
                            justify-between
                            gap-2
                            rounded-[14px]
                            px-3
                            py-2
                            text-left
                            transition-all
                            duration-200
                            active:scale-[0.99]

                            ${
                              isCategoryOpen
                                ? "bg-[#eef6e8]"
                                : "hover:bg-[#f7faf4]"
                            }
                          `}
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            {item.image ? (
                              <img
                                src={getImageUrl(item.image)}
                                alt={item.name}
                                className="
                                  h-10
                                  w-10
                                  shrink-0
                                  rounded-full
                                  object-cover
                                "
                              />
                            ) : (
                              <div
                                className="
                                  flex
                                  h-10
                                  w-10
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-full
                                  bg-[#f7faf4]
                                  text-[#6BAE4F]
                                "
                              >
                                <Package size={18} />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <h3
                                className={`
                                  line-clamp-2
                                  text-[14px]
                                  font-semibold
                                  leading-[1.35]

                                  ${
                                    isCategoryOpen
                                      ? "text-[#5d9d43]"
                                      : "text-[#222]"
                                  }
                                `}
                              >
                                {item.name}
                              </h3>

                              <p className="mt-0.5 text-[12px] text-[#777]">
                                {children.length} danh mục con
                              </p>
                            </div>
                          </div>

                          <ChevronDown
                            size={16}
                            className={`
                              shrink-0
                              text-[#777]
                              transition-transform
                              duration-200

                              ${
                                isCategoryOpen
                                  ? "rotate-180 text-[#5d9d43]"
                                  : ""
                              }
                            `}
                          />
                        </button>

                        {isCategoryOpen && (
                          <div
                            id={`mobile-category-${item.id}`}
                            className="
                              ml-5
                              mt-1
                              space-y-1
                              border-l
                              border-[#dfe8d8]
                              pb-1
                              pl-3
                            "
                          >
                            <Link
                              to={`/products?category=${encodeURIComponent(
                                item.slug,
                              )}`}
                              onClick={handleClose}
                              className="
                                flex
                                min-h-11
                                items-center
                                justify-between
                                gap-2
                                rounded-xl
                                bg-[#f7faf4]
                                px-3
                                py-2
                                transition-colors
                                duration-200
                                hover:bg-[#eef6e8]
                                active:scale-[0.99]
                              "
                            >
                              <div className="flex min-w-0 items-center gap-2.5">
                                <div
                                  className="
                                    flex
                                    h-8
                                    w-8
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-[#eaf4e4]
                                    text-[#5d9d43]
                                  "
                                >
                                  <Package size={15} />
                                </div>

                                <p className="line-clamp-2 text-[13px] font-semibold leading-[1.35] text-[#5d9d43]">
                                  Tất cả {item.name}
                                </p>
                              </div>

                              <ChevronRight
                                size={14}
                                className="shrink-0 text-[#7da76b]"
                              />
                            </Link>

                            {children.map((child) => (
                              <Link
                                key={child.id}
                                to={`/products?category=${encodeURIComponent(
                                  child.slug,
                                )}`}
                                onClick={handleClose}
                                className="
                                    flex
                                    min-h-12
                                    items-center
                                    justify-between
                                    gap-2
                                    rounded-xl
                                    px-3
                                    py-2
                                    transition-all
                                    duration-200
                                    hover:bg-[#f7faf4]
                                    active:scale-[0.99]
                                  "
                              >
                                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                  {child.image ? (
                                    <img
                                      src={getImageUrl(child.image)}
                                      alt={child.name}
                                      className="
                                          h-8
                                          w-8
                                          shrink-0
                                          rounded-full
                                          object-cover
                                        "
                                    />
                                  ) : (
                                    <div
                                      className="
                                          flex
                                          h-8
                                          w-8
                                          shrink-0
                                          items-center
                                          justify-center
                                          rounded-full
                                          bg-[#f7faf4]
                                          text-[#6BAE4F]
                                        "
                                    >
                                      <Package size={14} />
                                    </div>
                                  )}

                                  <div className="min-w-0 flex-1">
                                    <p className="line-clamp-2 text-[13px] font-medium leading-[1.35] text-[#333]">
                                      {child.name}
                                    </p>

                                    <p className="mt-0.5 line-clamp-1 text-[10.5px] text-[#888]">
                                      {child.description || "Xem sản phẩm"}
                                    </p>
                                  </div>
                                </div>

                                <ChevronRight
                                  size={14}
                                  className="shrink-0 text-[#aaa]"
                                />
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.id}
                      to={`/products?category=${encodeURIComponent(item.slug)}`}
                      onClick={handleClose}
                      className="
                        flex
                        min-h-14
                        items-center
                        justify-between
                        gap-2
                        rounded-[14px]
                        px-3
                        py-2
                        transition-all
                        duration-300
                        hover:bg-[#eef6e8]
                        active:scale-[0.99]
                      "
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        {item.image ? (
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.name}
                            className="
                              h-10
                              w-10
                              shrink-0
                              rounded-full
                              object-cover
                            "
                          />
                        ) : (
                          <div
                            className="
                              flex
                              h-10
                              w-10
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              bg-[#f7faf4]
                              text-[#6BAE4F]
                            "
                          >
                            <Package size={18} />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 text-[14px] font-semibold leading-[1.35]">
                            {item.name}
                          </h3>

                          <p className="mt-0.5 line-clamp-1 text-[12px] text-[#777]">
                            {item.description || "Xem sản phẩm"}
                          </p>
                        </div>
                      </div>

                      <ChevronRight
                        size={15}
                        className="shrink-0 text-[#999]"
                      />
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* LOGOUT */}
        {isAuthenticated && (
          <div className="px-3 pb-6">
            <button
              type="button"
              onClick={handleOpenLogout}
              className="
                flex
                h-13
                w-full
                items-center
                justify-center
                gap-2
                rounded-[14px]
                bg-red-50
                text-red-500
                transition-all
                duration-300
                hover:bg-red-100
              "
            >
              <LogOut size={18} />

              <span className="font-medium">Đăng xuất</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default MobileMenu;
