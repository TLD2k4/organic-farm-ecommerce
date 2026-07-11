// src/components/layout/customer/Header.jsx

import { useCallback, useEffect, useRef, useState } from "react";

import {
  BadgePlus,
  ClipboardList,
  LogIn,
  LogOut,
  Menu,
  Shield,
  ShoppingCart,
  Store,
  StoreIcon,
  User,
  UserPlus,
} from "lucide-react";

import { Link } from "react-router-dom";

import LogoutModal from "@/components/common/LogoutModal";
import SearchBar from "@/components/common/SearchBar";
import MobileMenu from "./MobileMenu";

import useAuth from "@/hooks/useAuth";

import { getImageUrl } from "@/utils/image";
import { canViewPublicFarm, getFarmEntryPath } from "@/utils/farm";

const Header = ({ categories = [], categoriesLoading = false }) => {
  const accountRef = useRef(null);

  const accountCloseTimerRef = useRef(null);

  const [openMenu, setOpenMenu] = useState(false);

  const [openAccount, setOpenAccount] = useState(false);

  const [accountPinned, setAccountPinned] = useState(false);

  const [openLogout, setOpenLogout] = useState(false);

  const { user, isAuthenticated, logout, logoutAll } = useAuth();

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

  const farmActionTitle = canManageFarm
    ? "Kênh bán hàng"
    : hasFarm
      ? "Hồ sơ gian hàng"
      : "Đăng ký gian hàng";

  const farmActionDescription = canManageFarm
    ? "Quản trị gian hàng"
    : hasFarm
      ? "Theo dõi hồ sơ"
      : "Trở thành người bán";

  const actionIconClass = `
    flex
    h-10
    w-10
    items-center
    justify-center
    rounded-full
    bg-[#f7faf4]
    transition-all
    duration-300
    hover:scale-105
    hover:bg-[#eef6e8]
    active:scale-95
  `;

  const dropdownItemClass = `
    flex
    h-12
    w-full
    items-center
    gap-2
    rounded-[12px]
    px-4
    transition-all
    duration-200
    hover:-translate-y-px
    hover:bg-[#f7faf4]
  `;

  const clearAccountTimer = useCallback(() => {
    if (accountCloseTimerRef.current) {
      clearTimeout(accountCloseTimerRef.current);

      accountCloseTimerRef.current = null;
    }
  }, []);

  const keepAccountOpen = () => {
    clearAccountTimer();

    setOpenAccount(true);
  };

  const requestCloseAccount = () => {
    clearAccountTimer();

    if (accountPinned) {
      return;
    }

    accountCloseTimerRef.current = setTimeout(() => {
      setOpenAccount(false);
    }, 220);
  };

  const toggleAccountMenu = () => {
    clearAccountTimer();

    setAccountPinned((currentPinned) => {
      const nextPinned = !currentPinned;

      setOpenAccount(nextPinned);

      return nextPinned;
    });
  };

  const closeAccountMenu = useCallback(() => {
    clearAccountTimer();

    setOpenAccount(false);

    setAccountPinned(false);
  }, [clearAccountTimer]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (accountRef.current?.contains(event.target)) {
        return;
      }

      closeAccountMenu();
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeAccountMenu();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearAccountTimer();

      document.removeEventListener("pointerdown", handlePointerDown);

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [clearAccountTimer, closeAccountMenu]);

  return (
    <>
      <header
        className="
          sticky
          top-0
          z-80
          bg-white
          shadow-[0_1px_0_rgba(0,0,0,0.04)]
        "
      >
        <div
          className="
            container-main
            flex
            h-17.5
            items-center
            gap-2
            md:h-19
            md:gap-4
            xl:h-23
            xl:gap-8
          "
        >
          {/* MOBILE MENU */}
          <button
            type="button"
            aria-label="Mở menu"
            onClick={() => {
              closeAccountMenu();

              setOpenMenu(true);
            }}
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#f7faf4]
              transition-all
              duration-300
              hover:scale-105
              hover:bg-[#eef6e8]
              active:scale-[0.98]
              md:hidden
            "
          >
            <Menu size={22} className="text-[#6BAE4F]" />
          </button>

          {/* LOGO */}
          <Link
            to="/"
            onClick={closeAccountMenu}
            className="
              flex
              shrink-0
              items-center
              gap-2
              md:gap-3
            "
          >
            <div
              className="
                flex
                h-9.5
                w-9.5
                items-center
                justify-center
                rounded-full
                bg-[#6BAE4F]
                text-[18px]
                text-white
                md:h-10.5
                md:w-10.5
                md:text-[20px]
                xl:h-13
                xl:w-13
                xl:text-[26px]
              "
            >
              🌿
            </div>

            <div className="hidden md:block">
              <h2
                className="
                  text-[16px]
                  font-bold
                  leading-none
                  text-[#2d5d1f]
                  md:text-[18px]
                  lg:text-[20px]
                  xl:text-[27px]
                "
              >
                Organic Farm
              </h2>

              <p
                className="
                  mt-1
                  text-[11px]
                  text-[#777]
                  xl:text-[13px]
                "
              >
                Nông sản sạch cho mọi nhà
              </p>
            </div>
          </Link>

          {/* SEARCH */}
          <div
            className="
              mx-auto
              min-w-0
              max-w-82.5
              flex-1
              md:max-w-120
              lg:max-w-150
              xl:max-w-170
            "
          >
            <SearchBar />
          </div>

          {/* ACTIONS */}
          <div
            className="
              flex
              shrink-0
              items-center
              gap-2
              md:gap-3
              lg:gap-2
              xl:gap-6
            "
          >
            {/* ACCOUNT */}
            <div
              ref={accountRef}
              className="relative"
              onMouseEnter={keepAccountOpen}
              onMouseLeave={requestCloseAccount}
            >
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={openAccount}
                aria-label="Mở menu tài khoản"
                onClick={toggleAccountMenu}
                className="
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  transition-colors
                  duration-200
                "
              >
                <div
                  className={`
                    ${actionIconClass}
                    overflow-hidden

                    ${openAccount ? "bg-[#eef6e8]" : ""}
                  `}
                >
                  {isAuthenticated ? (
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
                        h-full
                        w-full
                        object-cover
                      "
                    />
                  ) : (
                    <User size={22} className="text-[#6BAE4F]" />
                  )}
                </div>

                <div className="hidden text-left lg:block">
                  {isAuthenticated ? (
                    <>
                      <p className="max-w-30 truncate text-[14px] font-bold">
                        {user?.name}
                      </p>

                      <p className="text-[12px] text-[#777]">Tài khoản</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[14px] font-bold">Tài khoản</p>

                      <p className="text-[12px] text-[#777]">Đăng nhập</p>
                    </>
                  )}
                </div>
              </button>

              {/* ACCOUNT DROPDOWN */}
              <div
                role="menu"
                className={`
                  absolute
                  right-0
                  top-full
                  z-100
                  w-60
                  max-w-[calc(100vw-24px)]
                  pt-3
                  transition-all
                  duration-200

                  ${
                    openAccount
                      ? `
                        pointer-events-auto
                        visible
                        translate-y-0
                        opacity-100
                      `
                      : `
                        pointer-events-none
                        invisible
                        translate-y-2
                        opacity-0
                      `
                  }
                `}
              >
                <div
                  className="
                    rounded-[18px]
                    border
                    border-[#edf1e8]
                    bg-white
                    p-2
                    shadow-[0_12px_40px_rgba(0,0,0,0.12)]
                  "
                >
                  {!isAuthenticated ? (
                    <>
                      <Link
                        to="/login"
                        onClick={closeAccountMenu}
                        className={dropdownItemClass}
                      >
                        <LogIn size={18} className="text-[#6BAE4F]" />
                        Đăng nhập
                      </Link>

                      <Link
                        to="/register"
                        onClick={closeAccountMenu}
                        className={dropdownItemClass}
                      >
                        <UserPlus size={18} className="text-[#6BAE4F]" />
                        Đăng ký
                      </Link>

                      <Link
                        to="/seller/register"
                        onClick={closeAccountMenu}
                        className={dropdownItemClass}
                      >
                        <BadgePlus size={18} className="text-[#6BAE4F]" />
                        Đăng ký gian hàng
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/profile"
                        onClick={closeAccountMenu}
                        className={dropdownItemClass}
                      >
                        <User size={18} className="text-[#6BAE4F]" />
                        Hồ sơ
                      </Link>

                      <Link
                        to="/profile?tab=orders"
                        onClick={closeAccountMenu}
                        className={dropdownItemClass}
                      >
                        <ClipboardList size={18} className="text-[#6BAE4F]" />
                        Đơn hàng
                      </Link>

                      {publicFarmAvailable && (
                        <Link
                          to={`/farms/${farm.slug}`}
                          onClick={closeAccountMenu}
                          className={dropdownItemClass}
                        >
                          <StoreIcon size={18} className="text-[#6BAE4F]" />
                          Gian hàng công khai
                        </Link>
                      )}

                      <Link
                        to={farmEntryPath}
                        onClick={closeAccountMenu}
                        className={dropdownItemClass}
                      >
                        {hasFarm ? (
                          <Store size={18} className="text-[#6BAE4F]" />
                        ) : (
                          <BadgePlus size={18} className="text-[#6BAE4F]" />
                        )}

                        {farmActionLabel}
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={closeAccountMenu}
                          className={dropdownItemClass}
                        >
                          <Shield size={18} className="text-[#6BAE4F]" />
                          Quản trị hệ thống
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          closeAccountMenu();

                          setOpenLogout(true);
                        }}
                        className="
                          flex
                          h-12
                          w-full
                          items-center
                          gap-2
                          rounded-[12px]
                          px-4
                          text-red-500
                          transition-all
                          duration-200
                          hover:bg-red-50
                        "
                      >
                        <LogOut size={18} />
                        Đăng xuất
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ORDERS */}
            <Link
              to="/profile?tab=orders"
              onClick={closeAccountMenu}
              className="
                hidden
                items-center
                gap-2
                md:flex
              "
            >
              <div className={actionIconClass}>
                <ClipboardList size={22} className="text-[#6BAE4F]" />
              </div>

              <div className="hidden lg:block">
                <p className="text-[14px] font-bold">Đơn hàng</p>

                <p className="text-[12px] text-[#777]">Quản lý đơn</p>
              </div>
            </Link>

            {/* SELLER */}
            <Link
              to={farmEntryPath}
              onClick={closeAccountMenu}
              className="
                hidden
                items-center
                gap-2
                md:flex
              "
            >
              <div className={actionIconClass}>
                <Store size={22} className="text-[#6BAE4F]" />
              </div>

              <div className="hidden lg:block">
                <p className="text-[14px] font-bold">{farmActionTitle}</p>

                <p className="text-[12px] text-[#777]">
                  {farmActionDescription}
                </p>
              </div>
            </Link>

            {/* CART */}
            <Link
              to="/cart"
              onClick={closeAccountMenu}
              className="
                relative
                flex
                items-center
                gap-2
              "
            >
              <div
                className={`
                  relative
                  ${actionIconClass}
                `}
              >
                <ShoppingCart size={22} className="text-[#6BAE4F]" />

                <div
                  className="
                    absolute
                    -right-1
                    -top-1
                    flex
                    h-5
                    min-w-5
                    items-center
                    justify-center
                    rounded-full
                    bg-red-500
                    px-1
                    text-[10px]
                    font-bold
                    text-white
                  "
                >
                  0
                </div>
              </div>

              <div className="hidden lg:block">
                <p className="text-[14px] font-bold">Giỏ hàng</p>

                <p className="text-[12px] text-[#777]">0đ</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <MobileMenu
        open={openMenu}
        onClose={() => setOpenMenu(false)}
        onOpenLogout={() => {
          setOpenMenu(false);

          setOpenLogout(true);
        }}
        categories={categories}
        categoriesLoading={categoriesLoading}
      />

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
};

export default Header;
