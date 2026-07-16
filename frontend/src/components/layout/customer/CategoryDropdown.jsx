// src/components/layout/customer/CategoryDropdown.jsx

import { useCallback, useEffect, useRef, useState } from "react";

import { createPortal } from "react-dom";

import { ChevronRight, Grid2X2, ImageIcon } from "lucide-react";

import { useNavigate } from "react-router-dom";

import { getImageUrl } from "@/utils/image";

const SUBMENU_WIDTH = 320;
const SCREEN_PADDING = 12;
const SUBMENU_GAP = 12;

const SUBMENU_HEADER_HEIGHT = 145;
const SUBMENU_ITEM_HEIGHT = 58;
const SUBMENU_MIN_HEIGHT = 190;

const getChildren = (category) => {
  return category?.active_children ?? category?.children ?? [];
};

const CategoryDropdown = ({
  categories = [],
  loading = false,
  parentMenuOpen = false,
  onSubmenuEnter = () => {},
  onSubmenuLeave = () => {},
  onNavigate = () => {},
}) => {
  const navigate = useNavigate();

  const parentMenuRef = useRef(null);
  const closeTimerRef = useRef(null);

  const [openCategory, setOpenCategory] = useState(null);

  const [submenuPosition, setSubmenuPosition] = useState({
    top: 0,
    left: 0,
    width: SUBMENU_WIDTH,
    height: SUBMENU_MIN_HEIGHT,
  });

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);

      closeTimerRef.current = null;
    }
  }, []);

  const closeSubmenu = useCallback(() => {
    clearCloseTimer();
    setOpenCategory(null);
  }, [clearCloseTimer]);

  const scheduleCloseSubmenu = useCallback(() => {
    clearCloseTimer();

    closeTimerRef.current = setTimeout(() => {
      setOpenCategory(null);
    }, 250);
  }, [clearCloseTimer]);

  const goToAllProducts = useCallback(() => {
    closeSubmenu();
    onNavigate();
    navigate("/products");
  }, [closeSubmenu, navigate, onNavigate]);

  const goToCategory = useCallback(
    (slug) => {
      if (!slug) {
        goToAllProducts();
        return;
      }

      closeSubmenu();
      onNavigate();

      navigate(`/products?category_slug=${encodeURIComponent(slug)}`);
    },
    [closeSubmenu, goToAllProducts, navigate, onNavigate],
  );

  const calculatePosition = useCallback((element, childrenCount) => {
    const triggerRect = element.getBoundingClientRect();

    const parentRect = parentMenuRef.current?.getBoundingClientRect();

    const viewportWidth = window.innerWidth;

    const viewportHeight = window.innerHeight;

    const width = Math.min(SUBMENU_WIDTH, viewportWidth - SCREEN_PADDING * 2);

    // Mặc định mở bên phải danh mục cha.
    let left = triggerRect.right + SUBMENU_GAP;

    // Không đủ chỗ bên phải thì mở sang trái.
    if (left + width > viewportWidth - SCREEN_PADDING) {
      left = triggerRect.left - width - SUBMENU_GAP;
    }

    // Không cho vượt ngang viewport.
    left = Math.max(
      SCREEN_PADDING,
      Math.min(left, viewportWidth - width - SCREEN_PADDING),
    );

    /*
     * Giới hạn submenu theo đúng
     * khung danh mục cha.
     */
    const boundaryTop = parentRect?.top ?? SCREEN_PADDING;

    const boundaryBottom =
      parentRect?.bottom ?? viewportHeight - SCREEN_PADDING;

    const boundaryHeight = Math.max(1, boundaryBottom - boundaryTop);

    /*
     * Chiều cao tự nhiên dự kiến.
     */
    const estimatedHeight =
      SUBMENU_HEADER_HEIGHT + childrenCount * SUBMENU_ITEM_HEIGHT;

    const desiredHeight = Math.max(SUBMENU_MIN_HEIGHT, estimatedHeight);

    /*
     * Không cho submenu cao hơn
     * khung danh mục cha.
     */
    const height = Math.min(desiredHeight, boundaryHeight);

    /*
     * Mặc định ngang với dòng cha.
     */
    let top = Math.round(triggerRect.top);

    /*
     * Nếu vượt đáy khung cha
     * thì đẩy submenu lên.
     */
    if (top + height > boundaryBottom) {
      top = boundaryBottom - height;
    }

    /*
     * Không cho vượt lên trên
     * đầu khung danh mục cha.
     */
    if (top < boundaryTop) {
      top = boundaryTop;
    }

    return {
      top,
      left,
      width,
      height,
    };
  }, []);

  const openSubmenu = useCallback(
    (item, element) => {
      clearCloseTimer();

      const children = getChildren(item);

      if (!children.length) {
        setOpenCategory(null);
        return;
      }

      onSubmenuEnter();

      const position = calculatePosition(element, children.length);

      setSubmenuPosition(position);
      setOpenCategory(item);
    },
    [calculatePosition, clearCloseTimer, onSubmenuEnter],
  );

  const handleParentClick = useCallback(
    (event, item) => {
      const children = getChildren(item);

      if (!children.length) {
        goToCategory(item.slug);
        return;
      }

      if (openCategory?.id === item.id) {
        closeSubmenu();
        return;
      }

      openSubmenu(item, event.currentTarget);
    },
    [closeSubmenu, goToCategory, openCategory?.id, openSubmenu],
  );

  /*
   * Không còn useEffect gọi closeSubmenu
   * trực tiếp khi parentMenuOpen thay đổi.
   *
   * Navbar sẽ unmount component khi đóng,
   * nên state tự reset.
   */

  useEffect(() => {
    const handleWindowChange = () => {
      closeSubmenu();
    };

    window.addEventListener("resize", handleWindowChange);

    window.addEventListener("scroll", handleWindowChange, {
      passive: true,
    });

    return () => {
      clearCloseTimer();

      window.removeEventListener("resize", handleWindowChange);

      window.removeEventListener("scroll", handleWindowChange);
    };
  }, [clearCloseTimer, closeSubmenu]);

  const openChildren = getChildren(openCategory);

  return (
    <>
      {/* DANH MỤC CHA */}
      <div
        ref={parentMenuRef}
        className="
          relative
          w-full
          overflow-hidden
          rounded-2xl
          border
          border-[#e5e8df]
          bg-white
          shadow-[0_12px_35px_rgba(0,0,0,0.07)]
        "
        onMouseEnter={() => {
          clearCloseTimer();
          onSubmenuEnter();
        }}
        onMouseLeave={() => {
          scheduleCloseSubmenu();
          onSubmenuLeave();
        }}
      >
        <div
          className="
            max-h-[calc(100vh-165px)]
            overflow-y-auto
            overscroll-contain
            py-1.5
          "
          onScroll={closeSubmenu}
        >
          {loading ? (
            <div className="space-y-2 px-3 py-2">
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className="
                    h-14

                    animate-pulse

                    rounded-xl

                    bg-slate-100
                  "
                />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="px-4 py-7 text-center text-sm text-slate-500">
              Chưa có danh mục.
            </div>
          ) : (
            categories.map((item, index) => {
              const children = getChildren(item);

              const hasChildren = children.length > 0;

              const isOpen = openCategory?.id === item.id;

              return (
                <button
                  type="button"
                  key={item.id}
                  aria-expanded={hasChildren ? isOpen : undefined}
                  aria-haspopup={hasChildren ? "menu" : undefined}
                  onMouseEnter={(event) => {
                    if (hasChildren) {
                      openSubmenu(item, event.currentTarget);
                    } else {
                      closeSubmenu();
                    }
                  }}
                  onClick={(event) => handleParentClick(event, item)}
                  className={`
                    flex
                    min-h-14
                    w-full
                    items-start
                    justify-between

                    gap-2

                    px-3.5
                    py-2.5

                    text-left

                    transition-colors
                    duration-150

                    lg:px-4

                    ${isOpen ? "bg-[#eef6e8]" : "hover:bg-[#f7faf4]"}

                    ${
                      index !== categories.length - 1
                        ? "border-b border-[#eef1ea]"
                        : ""
                    }
                  `}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-2.5">
                    {/* ẢNH CHA */}
                    <div
                      className="
                        flex
                        h-9.5
                        w-9.5
                        shrink-0
                        items-center
                        justify-center

                        overflow-hidden
                        rounded-full

                        bg-[#f7faf4]
                      "
                    >
                      {item.image ? (
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          className="
                            h-full
                            w-full
                            object-cover
                          "
                        />
                      ) : (
                        <ImageIcon size={18} className="text-[#6BAE4F]" />
                      )}
                    </div>

                    {/* THÔNG TIN CHA */}
                    <div className="min-w-0 flex-1">
                      <h3
                        className={`
                          whitespace-normal
                          wrap-break-word

                          text-[13px]
                          font-semibold
                          leading-[1.4]

                          ${isOpen ? "text-[#5d9d43]" : "text-[#1d1d1d]"}
                        `}
                      >
                        {item.name}
                      </h3>

                      <p
                        className="
                          mt-0.5

                          text-[10.5px]
                          leading-[1.4]
                          text-[#777]
                        "
                      >
                        {hasChildren
                          ? `${children.length} danh mục con`
                          : "Xem sản phẩm"}
                      </p>
                    </div>
                  </div>

                  <ChevronRight
                    size={15}
                    strokeWidth={2.4}
                    className={`
                      mt-1
                      shrink-0

                      transition-all
                      duration-150

                      ${
                        isOpen
                          ? "translate-x-0.5 text-[#5d9d43]"
                          : "text-[#777]"
                      }

                      ${hasChildren ? "opacity-100" : "opacity-40"}
                    `}
                  />
                </button>
              );
            })
          )}

          {/* XEM TẤT CẢ */}
          <div className="px-2.5 pb-1 pt-2">
            <button
              type="button"
              onClick={goToAllProducts}
              className="
              flex
              h-10.5
              w-full
              items-center
              justify-center

              gap-2

              rounded-xl

              bg-[#f7faf4]

              transition-all
              duration-200

              hover:bg-[#eef6e8]
            "
            >
              <Grid2X2 size={16} className="text-[#5d9d43]" strokeWidth={2.4} />

              <span className="text-[12px] font-semibold text-[#5d9d43]">
                Xem tất cả
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* DANH MỤC CON PORTAL */}
      {parentMenuOpen &&
        openCategory &&
        openChildren.length > 0 &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            data-category-submenu="true"
            role="menu"
            className="
              fixed
              z-9999
            "
            style={{
              top: submenuPosition.top,
              left: submenuPosition.left,
              width: submenuPosition.width,
              height: submenuPosition.height,
            }}
            onMouseEnter={() => {
              clearCloseTimer();
              onSubmenuEnter();
            }}
            onMouseLeave={() => {
              scheduleCloseSubmenu();
              onSubmenuLeave();
            }}
          >
            <div
              className="
                flex
                h-full
                flex-col

                overflow-hidden

                rounded-2xl

                border
                border-[#dfe5d8]

                bg-white

                p-2

                shadow-[0_16px_45px_rgba(0,0,0,0.17)]
              "
            >
              {/* HEADER */}
              <div
                className="
                  shrink-0

                  border-b
                  border-[#eef1ea]

                  px-3
                  pb-2.5
                  pt-2
                "
              >
                <p
                  className="
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-wide
                    text-[#999]
                  "
                >
                  Danh mục
                </p>

                <h3
                  className="
                    mt-1

                    whitespace-normal
                    wrap-break-word

                    text-[14px]
                    font-bold
                    leading-[1.4]
                    text-[#2d5d1f]
                  "
                >
                  {openCategory.name}
                </h3>

                <p
                  className="
                    mt-1

                    line-clamp-2

                    text-[11px]
                    leading-[1.45]
                    text-[#777]
                  "
                >
                  {openCategory.description ||
                    `${openChildren.length} danh mục con`}
                </p>
              </div>

              {/* TẤT CẢ DANH MỤC CHA */}
              <button
                type="button"
                onClick={() => goToCategory(openCategory.slug)}
                className="
                  mt-2

                  flex
                  min-h-10.5
                  w-full
                  shrink-0
                  items-center
                  justify-between

                  gap-2

                  rounded-xl

                  bg-[#f7faf4]

                  px-3
                  py-2

                  text-left
                  text-[12.5px]
                  font-semibold
                  leading-[1.4]
                  text-[#5d9d43]

                  transition-colors
                  duration-150

                  hover:bg-[#eef6e8]
                "
              >
                <span
                  className="
                    whitespace-normal
                    wrap-break-word
                  "
                >
                  Tất cả {openCategory.name}
                </span>

                <Grid2X2 size={15} className="shrink-0" />
              </button>

              {/* DANH SÁCH CON */}
              <div
                className="
                  mt-2

                  min-h-0
                  flex-1

                  space-y-1

                  overflow-y-auto
                  overscroll-contain

                  pr-1
                "
              >
                {openChildren.map((child) => (
                  <button
                    type="button"
                    role="menuitem"
                    key={child.id}
                    onClick={() => goToCategory(child.slug)}
                    className="
                        flex
                        min-h-13
                        w-full
                        items-start
                        justify-between

                        gap-2

                        rounded-xl

                        px-2.5
                        py-2

                        text-left

                        transition-colors
                        duration-150

                        hover:bg-[#f7faf4]
                      "
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-2.5">
                      {/* ẢNH CON */}
                      <div
                        className="
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center

                            overflow-hidden
                            rounded-full

                            bg-[#f7faf4]
                          "
                      >
                        {child.image ? (
                          <img
                            src={getImageUrl(child.image)}
                            alt={child.name}
                            className="
                                h-full
                                w-full
                                object-cover
                              "
                          />
                        ) : (
                          <ImageIcon size={15} className="text-[#6BAE4F]" />
                        )}
                      </div>

                      {/* THÔNG TIN CON */}
                      <div className="min-w-0 flex-1">
                        <p
                          className="
                              whitespace-normal
                              wrap-break-word

                              text-[13px]
                              font-semibold
                              leading-[1.35]
                              text-[#222]
                            "
                        >
                          {child.name}
                        </p>

                        <p
                          className="
                              mt-0.5

                              line-clamp-2

                              text-[10.5px]
                              leading-[1.4]
                              text-[#777]
                            "
                        >
                          {child.description ||
                            `Xem sản phẩm thuộc ${child.name}`}
                        </p>
                      </div>
                    </div>

                    <ChevronRight
                      size={14}
                      className="
                          mt-1
                          shrink-0
                          text-[#999]
                        "
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default CategoryDropdown;