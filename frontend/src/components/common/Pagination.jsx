// src/components/common/Pagination.jsx

import { useState } from "react";
import toast from "react-hot-toast";

export default function Pagination({
  meta,
  params,
  setParams,
  itemLabel,
  loading = false,
}) {
  const [inputPage, setInputPage] = useState("");

  if (!meta) return null;

  const currentPage = Math.max(
    1,
    Number(meta.current_page ?? params.page ?? 1) || 1,
  );
  const lastPage = Math.max(1, Number(meta.last_page ?? 1) || 1);
  const total = Math.max(0, Number(meta.total ?? 0) || 0);
  const perPage = Math.max(
    1,
    Number(meta.per_page ?? params.per_page ?? params.limit ?? 10) || 10,
  );
  const from = total === 0
    ? 0
    : Number(meta.from ?? (currentPage - 1) * perPage + 1);
  const to = total === 0
    ? 0
    : Number(meta.to ?? Math.min(total, currentPage * perPage));

  const changePage = (page) => {
    if (loading || page < 1 || page > lastPage) return;

    setParams((prev) => ({
      ...prev,
      page,
    }));
  };

  const handleGoPage = () => {
    const page = Number(inputPage);

    if (!inputPage) {
      toast.error("Vui lòng nhập số trang");
      return;
    }

    if (!Number.isInteger(page)) {
      toast.error("Trang phải là số nguyên");
      return;
    }

    if (page < 1 || page > lastPage) {
      toast.error(`Chỉ được nhập từ 1 đến ${lastPage}`);
      return;
    }

    changePage(page);
    setInputPage("");
  };

  const renderPages = () => {
    const pages = [];

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(lastPage, currentPage + 2);

    if (currentPage <= 3) {
      end = Math.min(5, lastPage);
    }

    if (currentPage >= lastPage - 2) {
      start = Math.max(1, lastPage - 4);
    }

    if (start > 1) {
      pages.push(
        <button
          type="button"
          key={1}
          disabled={loading}
          onClick={() => changePage(1)}
          className="
            flex h-10 min-w-10 items-center justify-center
            rounded-md border border-slate-300 bg-white
            text-slate-700
            transition-all duration-200
            hover:border-green-600
            hover:bg-green-50
            hover:text-green-600
          "
        >
          1
        </button>,
      );

      if (start > 2) {
        pages.push(
          <span
            key="left-dot"
            className="flex h-10 w-8 items-center justify-center text-slate-500"
          >
            ...
          </span>,
        );
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          type="button"
          key={i}
          disabled={loading}
          onClick={() => changePage(i)}
          className={`flex h-10 min-w-10 items-center justify-center rounded-md border transition-all duration-200 ${
            currentPage === i
              ? "border-green-600 bg-green-600 text-white shadow-sm"
              : "border-slate-300 bg-white text-slate-700 hover:border-green-600 hover:bg-green-50 hover:text-green-600"
          }`}
        >
          {i}
        </button>,
      );
    }

    if (end < lastPage) {
      if (end < lastPage - 1) {
        pages.push(
          <span
            key="right-dot"
            className="flex h-10 w-8 items-center justify-center text-slate-500"
          >
            ...
          </span>,
        );
      }

      pages.push(
        <button
          type="button"
          key={lastPage}
          disabled={loading}
          onClick={() => changePage(lastPage)}
          className="
            flex h-10 min-w-10 items-center justify-center
            rounded-md border border-slate-300 bg-white
            text-slate-700
            transition-all duration-200
            hover:border-green-600
            hover:bg-green-50
            hover:text-green-600
          "
        >
          {lastPage}
        </button>,
      );
    }

    return pages;
  };

  return (
    <div className="mt-6 grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      {itemLabel ? (
        <p className="text-center text-sm font-semibold text-slate-500 lg:text-left">
          Hiển thị <b className="text-slate-700">{from}–{to}</b> trên tổng{" "}
          <b className="text-slate-700">{total}</b> {itemLabel}
        </p>
      ) : (
        <span className="hidden lg:block" aria-hidden="true" />
      )}

      {/* Pagination */}
      <div className="flex max-w-full items-center justify-center gap-1 overflow-x-auto pb-1">
        <button
          type="button"
          aria-label="Trang trước"
          disabled={loading || currentPage === 1}
          onClick={() => changePage(currentPage - 1)}
          className="
            flex h-10 w-10 items-center justify-center
            rounded-md border border-slate-300 bg-white
            text-slate-700
            transition-all duration-200
            hover:border-green-600
            hover:bg-green-50
            hover:text-green-600
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          ←
        </button>

        {renderPages()}

        <button
          type="button"
          aria-label="Trang sau"
          disabled={loading || currentPage === lastPage}
          onClick={() => changePage(currentPage + 1)}
          className="
            flex h-10 w-10 items-center justify-center
            rounded-md border border-slate-300 bg-white
            text-slate-700
            transition-all duration-200
            hover:border-green-600
            hover:bg-green-50
            hover:text-green-600
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          →
        </button>
      </div>

      {/* Right */}
      <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-end">
        <span className="text-sm text-slate-500">
          Trang <b>{currentPage}</b> / {lastPage}
        </span>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max={lastPage}
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGoPage()}
            placeholder="Trang"
            className="
              h-10 w-20
              rounded-md border border-slate-300
              px-3 text-center
              outline-none
              transition-all duration-200
              focus:border-green-600
              focus:ring-2
              focus:ring-green-100
            "
          />

          <button
            type="button"
            onClick={handleGoPage}
            disabled={loading}
            className="
              h-10 rounded-md
              bg-green-600
              px-4
              font-medium
              text-white
              transition-all duration-200
              hover:bg-green-700
              active:scale-95
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
}
