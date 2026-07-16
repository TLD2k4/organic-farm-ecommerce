import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function ProgressiveList({ items = [], initialCount = 2, step = 3, renderItem, moreLabel = "Xem thêm", collapseLabel = "Thu gọn", className = "", ensureVisibleItemId = null }) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  useEffect(() => {
    const focusedIndex = ensureVisibleItemId === null
      ? -1
      : items.findIndex((item) => String(item?.id) === String(ensureVisibleItemId));
    setVisibleCount(focusedIndex >= 0 ? Math.max(initialCount, focusedIndex + 1) : initialCount);
  }, [items, items.length, initialCount, ensureVisibleItemId]);
  const hasMore = visibleCount < items.length;
  const expanded = visibleCount > initialCount;

  return <div className={className}>
    {items.slice(0, visibleCount).map((item, index) => renderItem(item, index))}
    {items.length > initialCount && <div className="mt-3 flex flex-wrap gap-3">
      {hasMore && <button type="button" onClick={() => setVisibleCount((count) => Math.min(count + step, items.length))} className="inline-flex items-center gap-1 text-sm font-black text-green-700 hover:underline"><ChevronDown size={16} />{moreLabel} ({items.length - visibleCount})</button>}
      {expanded && <button type="button" onClick={() => setVisibleCount(initialCount)} className="inline-flex items-center gap-1 text-sm font-black text-slate-500 hover:underline"><ChevronUp size={16} />{collapseLabel}</button>}
    </div>}
  </div>;
}
