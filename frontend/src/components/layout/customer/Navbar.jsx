// src/components/layout/customer/Navbar.jsx

import { useCallback, useEffect, useRef, useState } from "react";

import { NavLink } from "react-router-dom";
import { ChevronDown, Menu } from "lucide-react";

import CategoryDropdown from "./CategoryDropdown";

const navItems = [
  {
    name: "Trang chủ",
    path: "/",
  },
  {
    name: "Sản phẩm",
    path: "/products",
  },
  {
    name: "Nông trại",
    path: "/farms",
  },
  {
    name: "Tin tức",
    path: "/news",
  },
  {
    name: "Liên hệ",
    path: "/contact",
  },
];

const Navbar = ({ categories = [], categoriesLoading = false }) => {
  const categoryAreaRef = useRef(null);
  const closeTimerRef = useRef(null);

  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);

  const [categoryMenuPinned, setCategoryMenuPinned] = useState(false);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const keepCategoryMenuOpen = useCallback(() => {
    clearCloseTimer();
    setCategoryMenuOpen(true);
  }, [clearCloseTimer]);

  const requestCloseCategoryMenu = useCallback(() => {
    clearCloseTimer();

    if (categoryMenuPinned) {
      return;
    }

    closeTimerRef.current = setTimeout(() => {
      setCategoryMenuOpen(false);
    }, 250);
  }, [categoryMenuPinned, clearCloseTimer]);

  const toggleCategoryMenu = useCallback(() => {
    clearCloseTimer();

    setCategoryMenuPinned((currentPinned) => {
      const nextPinned = !currentPinned;

      setCategoryMenuOpen(nextPinned);

      return nextPinned;
    });
  }, [clearCloseTimer]);

  const closeCategoryMenu = useCallback(() => {
    clearCloseTimer();
    setCategoryMenuOpen(false);
    setCategoryMenuPinned(false);
  }, [clearCloseTimer]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      const target = event.target;

      // Click trong nút hoặc menu danh mục cha.
      if (categoryAreaRef.current?.contains(target)) {
        return;
      }

      // Click trong submenu render qua portal.
      if (
        target instanceof Element &&
        target.closest('[data-category-submenu="true"]')
      ) {
        return;
      }

      closeCategoryMenu();
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeCategoryMenu();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearCloseTimer();

      document.removeEventListener("pointerdown", handlePointerDown);

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [clearCloseTimer, closeCategoryMenu]);

  return (
    <nav
      className="
        sticky
        top-19
        z-40

        hidden

        bg-white

        shadow-[0_4px_20px_rgba(0,0,0,0.035)]

        md:block
        xl:top-23
      "
    >
      <div className="container-main">
        <div
          className="
            flex
            h-11.5
            items-center

            gap-6

            lg:h-12.5
            lg:gap-10
          "
        >
          {/* CATEGORY */}
          <div
            ref={categoryAreaRef}
            onMouseEnter={keepCategoryMenuOpen}
            onMouseLeave={requestCloseCategoryMenu}
            className="
              relative

              w-42.5
              shrink-0

              sm:w-47.5
              md:w-52.5
              xl:w-55
            "
          >
            <button
              type="button"
              aria-expanded={categoryMenuOpen}
              aria-haspopup="menu"
              onClick={toggleCategoryMenu}
              className={`
                flex
                h-9.5
                w-full
                items-center
                justify-between

                rounded-[9px]

                px-3

                text-white

                shadow-[0_3px_10px_rgba(107,174,79,0.18)]

                transition-all
                duration-300

                sm:h-10

                lg:h-11
                lg:px-4

                ${
                  categoryMenuOpen
                    ? "bg-[#5d9d43]"
                    : "bg-[#6BAE4F] hover:bg-[#5d9d43]"
                }
              `}
            >
              <div className="flex items-center gap-2.5">
                <Menu size={18} strokeWidth={2.5} />

                <span
                  className="
                    whitespace-nowrap

                    text-[12px]
                    font-semibold

                    sm:text-[13px]
                    lg:text-[14px]
                  "
                >
                  Danh mục sản phẩm
                </span>
              </div>

              <ChevronDown
                size={16}
                strokeWidth={2.4}
                className={`
                  transition-all
                  duration-300
                  ease-out

                  ${
                    categoryMenuOpen
                      ? "-translate-y-px rotate-180 scale-110"
                      : "rotate-0"
                  }
                `}
              />
            </button>

            {/* DROPDOWN DANH MỤC CHA */}
            <div
              className={`
                absolute
                left-0
                top-full
                z-50

                w-full

                pt-2

                transition-all
                duration-200

                ${
                  categoryMenuOpen
                    ? `
                      pointer-events-auto
                      visible
                      translate-y-0
                      opacity-100
                    `
                    : `
                      pointer-events-none
                      invisible
                      translate-y-1
                      opacity-0
                    `
                }
              `}
            >
              {categoryMenuOpen && (
                <CategoryDropdown
                  categories={categories}
                  loading={categoriesLoading}
                  parentMenuOpen={categoryMenuOpen}
                  onSubmenuEnter={keepCategoryMenuOpen}
                  onSubmenuLeave={requestCloseCategoryMenu}
                  onNavigate={closeCategoryMenu}
                />
              )}
            </div>
          </div>

          {/* NAV LINKS */}
          <div
            className="
              ml-6

              flex
              items-center

              gap-5

              md:ml-10
              md:gap-6

              lg:ml-14
              lg:gap-8

              xl:ml-20
              xl:gap-12
            "
          >
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  group
                  relative

                  flex
                  h-11.5
                  items-center

                  whitespace-nowrap

                  text-[15px]
                  font-semibold

                  transition-all
                  duration-300

                  md:text-[16px]
                  lg:h-12.5

                  ${isActive ? "text-[#6BAE4F]" : "text-[#333]"}
                `}
              >
                {({ isActive }) => (
                  <>
                    {item.name}

                    <span
                      className={`
                        absolute
                        bottom-0
                        left-0

                        h-0.75

                        rounded-full

                        bg-[#6BAE4F]

                        transition-all
                        duration-300

                        ${isActive ? "w-full" : "w-0 group-hover:w-full"}
                      `}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
