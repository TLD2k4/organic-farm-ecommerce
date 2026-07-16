import { useEffect, useRef, useState } from "react";

const EDGE_GAP = 12;
const DRAG_THRESHOLD = 5;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function clampPosition(position, width, height) {
  return {
    x: clamp(position.x, EDGE_GAP, window.innerWidth - width - EDGE_GAP),
    y: clamp(position.y, EDGE_GAP, window.innerHeight - height - EDGE_GAP),
  };
}

function defaultPosition(side, size) {
  return clampPosition(
    {
      x: side === "right" ? window.innerWidth - size - 20 : 20,
      y: window.innerHeight - size - 20,
    },
    size,
    size,
  );
}

function initialPosition(storageKey, side, size) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");

    if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) {
      return clampPosition(saved, size, size);
    }
  } catch {
    // Dữ liệu cũ không hợp lệ thì dùng vị trí mặc định.
  }

  return defaultPosition(side, size);
}

export default function DraggableFloatingButton({
  storageKey,
  defaultSide = "left",
  size = 48,
  className = "",
  onClick,
  children,
  ...buttonProps
}) {
  const buttonRef = useRef(null);
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);
  const suppressTimerRef = useRef(null);

  const [position, setPosition] = useState(() =>
    initialPosition(storageKey, defaultSide, size),
  );
  const positionRef = useRef(position);

  const moveTo = (next) => {
    positionRef.current = next;
    setPosition(next);
  };

  useEffect(() => {
    const keepInsideViewport = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      const current = positionRef.current || defaultPosition(defaultSide, size);
      const next = clampPosition(
        current,
        rect?.width || size,
        rect?.height || size,
      );

      moveTo(next);
      localStorage.setItem(storageKey, JSON.stringify(next));
    };

    window.addEventListener("resize", keepInsideViewport);
    window.addEventListener("preferences:updated", keepInsideViewport);

    return () => {
      window.removeEventListener("resize", keepInsideViewport);
      window.removeEventListener("preferences:updated", keepInsideViewport);
      window.clearTimeout(suppressTimerRef.current);
    };
  }, [defaultSide, size, storageKey]);

  const handlePointerDown = (event) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: rect.left,
      originY: rect.top,
      width: rect.width,
      height: rect.height,
      moved: false,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    if (!drag.moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) {
      return;
    }

    drag.moved = true;
    moveTo(
      clampPosition(
        { x: drag.originX + deltaX, y: drag.originY + deltaY },
        drag.width,
        drag.height,
      ),
    );
  };

  const finishDrag = (event) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (drag.moved) {
      suppressClickRef.current = true;
      localStorage.setItem(storageKey, JSON.stringify(positionRef.current));
      window.clearTimeout(suppressTimerRef.current);
      suppressTimerRef.current = window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }

    dragRef.current = null;
  };

  const handleClick = (event) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    onClick?.(event);
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      {...buttonProps}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      style={{ left: position.x, top: position.y }}
      className={`fixed touch-none select-none cursor-grab active:cursor-grabbing ${className}`}
    >
      {children}
    </button>
  );
}
