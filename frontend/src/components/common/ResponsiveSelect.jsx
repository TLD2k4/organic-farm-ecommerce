import { useEffect, useId, useRef, useState } from "react";

import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

const SCREEN_PADDING = 12;
const DROPDOWN_GAP = 6;
const MAX_DROPDOWN_HEIGHT = 240;

export default function ResponsiveSelect({
  value,
  onChange,
  options = [],
  placeholder = "Chọn giá trị",
  disabled = false,
  className = "",
}) {
  const listboxId = useId();

  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const [open, setOpen] = useState(false);

  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    top: null,
    bottom: null,
    maxHeight: MAX_DROPDOWN_HEIGHT,
  });

  const selectedOption = options.find(
    (option) => String(option.value) === String(value),
  );

  const calculatePosition = () => {
    const trigger = triggerRef.current;

    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const width = Math.min(
      Math.max(rect.width, 220),
      viewportWidth - SCREEN_PADDING * 2,
    );

    let left = rect.left;

    if (left + width > viewportWidth - SCREEN_PADDING) {
      left = viewportWidth - width - SCREEN_PADDING;
    }

    left = Math.max(SCREEN_PADDING, left);

    const availableBelow =
      viewportHeight - rect.bottom - DROPDOWN_GAP - SCREEN_PADDING;

    const availableAbove = rect.top - DROPDOWN_GAP - SCREEN_PADDING;

    const openUpward = availableBelow < 160 && availableAbove > availableBelow;

    const availableHeight = openUpward ? availableAbove : availableBelow;

    const maxHeight = Math.max(
      80,
      Math.min(MAX_DROPDOWN_HEIGHT, availableHeight),
    );

    if (openUpward) {
      setPosition({
        left,
        width,
        top: null,
        bottom: viewportHeight - rect.top + DROPDOWN_GAP,
        maxHeight,
      });

      return;
    }

    setPosition({
      left,
      width,
      top: rect.bottom + DROPDOWN_GAP,
      bottom: null,
      maxHeight,
    });
  };

  const handleToggle = () => {
    if (disabled) {
      return;
    }

    if (open) {
      setOpen(false);
      return;
    }

    calculatePosition();
    setOpen(true);
  };

  const handleSelect = (optionValue) => {
    onChange?.(optionValue);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      const target = event.target;

      const clickedTrigger = triggerRef.current?.contains(target);

      const clickedDropdown = dropdownRef.current?.contains(target);

      if (!clickedTrigger && !clickedDropdown) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const handleResize = () => {
      setOpen(false);
    };

    const handleScroll = (event) => {
      /*
       * Cho phép cuộn bên trong danh sách option.
       */
      if (dropdownRef.current?.contains(event.target)) {
        return;
      }

      /*
       * Cuộn modal, trang hoặc container khác
       * thì đóng dropdown để tránh sai vị trí.
       */
      setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    document.addEventListener("keydown", handleKeyDown);

    document.addEventListener("scroll", handleScroll, true);

    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);

      document.removeEventListener("keydown", handleKeyDown);

      document.removeEventListener("scroll", handleScroll, true);

      window.removeEventListener("resize", handleResize);
    };
  }, [open]);

  return (
    <>
      <div
        className={`
          relative
          min-w-0
          w-full

          ${className}
        `}
      >
        <button
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          disabled={disabled}
          onClick={handleToggle}
          className={`
            flex
            min-h-12
            w-full
            min-w-0
            items-center
            justify-between

            gap-3

            rounded-xl

            border
            border-slate-200

            bg-white

            px-4
            py-3

            text-left
            text-sm
            text-slate-700

            outline-none

            transition

            hover:border-slate-300

            focus:border-green-500
            focus:ring-2
            focus:ring-green-100

            disabled:cursor-not-allowed
            disabled:bg-slate-100
            disabled:text-slate-500
            disabled:opacity-60

            sm:text-base

            ${open ? "border-green-500 ring-2 ring-green-100" : ""}
          `}
        >
          <span
            className={`
              min-w-0
              flex-1
              truncate

              ${selectedOption ? "text-slate-700" : "text-slate-400"}
            `}
          >
            {selectedOption?.label ?? placeholder}
          </span>

          <ChevronDown
            size={17}
            className={`
              shrink-0
              text-slate-500

              transition-transform
              duration-200

              ${open ? "rotate-180" : ""}
            `}
          />
        </button>
      </div>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            id={listboxId}
            role="listbox"
            className="
              fixed

              overflow-y-auto
              overscroll-contain

              rounded-xl

              border
              border-slate-200

              bg-white

              p-1.5

              shadow-[0_14px_35px_rgba(15,23,42,0.18)]
            "
            style={{
              zIndex: 9999,
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,

              ...(position.top !== null
                ? {
                    top: position.top,
                  }
                : {}),

              ...(position.bottom !== null
                ? {
                    bottom: position.bottom,
                  }
                : {}),
            }}
          >
            {options.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-slate-500">
                Không có lựa chọn.
              </div>
            ) : (
              options.map((option) => {
                const isSelected = String(option.value) === String(value);

                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    className={`
                      flex
                      min-h-10
                      w-full
                      items-center
                      justify-between

                      gap-3

                      rounded-lg

                      px-3
                      py-2.5

                      text-left
                      text-sm
                      leading-5

                      transition-colors

                      ${
                        isSelected
                          ? "bg-green-50 font-semibold text-green-700"
                          : "text-slate-700 hover:bg-slate-50"
                      }
                    `}
                  >
                    <span
                      className="
                        min-w-0
                        flex-1

                        whitespace-normal
                        wrap-break-word
                      "
                    >
                      {option.label}
                    </span>

                    {isSelected && (
                      <Check size={16} className="shrink-0 text-green-600" />
                    )}
                  </button>
                );
              })
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
