import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  PackageOpen,
  Pencil,
  Plus,
  Trash2,
  Warehouse,
} from "lucide-react";

import harvestLotService from "../../services/harvestLotService";
import { confirmAction } from "../../utils/actionDialog";

function getErrorMessage(error, fallback) {
  if (error?.errors) {
    const firstKey = Object.keys(error.errors)[0];
    return error.errors[firstKey]?.[0] || fallback;
  }

  return error?.error || error?.message || fallback;
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN").format(date);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("vi-VN");
}

function HarvestLots() {
  const [lots, setLots] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const fetchLots = async (page = 1) => {
    setLoading(true);
    setError("");

    try {
      const response = await harvestLotService.getHarvestLots({
        page,
        limit: 10,
      });

      setLots(response.data || []);
      setMeta(response.meta || null);
    } catch (fetchError) {
      setError(
        getErrorMessage(fetchError, "Không thể tải danh sách lô sản phẩm."),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();
  }, []);

  const handleDelete = async (lot) => {
    const confirmed = await confirmAction({ title: `Xóa lô ${lot.lot_code}`, description: "Lô chỉ được xóa khi không liên quan tới đơn hàng đang xử lý.", confirmLabel: "Xóa lô", danger: true });

    if (!confirmed) {
      return;
    }

    setDeletingId(lot.id);

    try {
      await harvestLotService.deleteHarvestLot(lot.id);

      toast.success("Xóa lô sản phẩm thành công.");

      const currentPage = Number(meta?.current_page || 1);

      const nextPage =
        lots.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;

      await fetchLots(nextPage);
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError, "Xóa lô sản phẩm thất bại."));
    } finally {
      setDeletingId(null);
    }
  };

  const currentPage = Number(meta?.current_page || 1);
  const lastPage = Number(meta?.last_page || 1);

  return (
    <div className="w-full min-w-0 space-y-5">
      {/* HEADER */}
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold text-slate-950 sm:text-2xl">
            Quản lý lô sản phẩm
          </h1>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Theo dõi số lượng nhập, tồn kho và hạn sử dụng của từng lô.
          </p>
        </div>

        <Link
          to="/seller/harvest-lots/create"
          className="
            inline-flex
            h-11
            w-full
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-green-600
            px-5
            text-sm
            font-extrabold
            text-white
            shadow-sm
            transition
            hover:bg-green-700
            sm:w-auto
          "
        >
          <Plus size={19} />
          Thêm lô mới
        </Link>
      </header>

      {error && (
        <div className="break-words rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* MOBILE CARDS */}
      <div className="space-y-3 xl:hidden">
        {loading ? (
          <MobileLoading />
        ) : lots.length > 0 ? (
          lots.map((lot) => (
            <article
              key={lot.id}
              className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex min-w-0 flex-col gap-3 border-b border-slate-100 p-4 min-[430px]:flex-row min-[430px]:items-start min-[430px]:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                    <ClipboardList size={22} />
                  </div>

                  <div className="min-w-0">
                    <p className="break-words font-extrabold text-slate-900">
                      {lot.lot_code}
                    </p>

                    <p className="mt-1 break-words text-sm font-medium text-slate-500">
                      {lot.product?.name || "Không có sản phẩm"}
                    </p>
                  </div>
                </div>

                <div className="self-start">
                  <StatusBadge lot={lot} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 p-4 min-[400px]:grid-cols-2">
                <MobileInformation
                  icon={<CalendarDays size={17} />}
                  label="Thu hoạch"
                  value={formatDate(lot.harvest_date)}
                />

                <MobileInformation
                  icon={<CalendarDays size={17} />}
                  label="Hạn sử dụng"
                  value={formatDate(lot.expiry_date)}
                />

                <MobileInformation
                  icon={<PackageOpen size={17} />}
                  label="Số lượng nhập"
                  value={formatNumber(lot.quantity_imported)}
                />

                <MobileInformation
                  icon={<Warehouse size={17} />}
                  label="Còn lại"
                  value={formatNumber(lot.quantity_remaining)}
                />
              </div>

              <div className="border-t border-slate-100 px-4 py-3">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Chứng chỉ
                </p>

                <p className="break-words text-sm font-semibold text-slate-700">
                  {lot.certificate?.certification_name || "Không có chứng chỉ"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 bg-slate-50 p-4">
                <Link
                  to={`/seller/harvest-lots/${lot.id}/edit`}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-50 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  <Pencil size={17} />
                  Sửa
                </Link>

                <button
                  type="button"
                  onClick={() => handleDelete(lot)}
                  disabled={deletingId === lot.id}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-50 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingId === lot.id ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Trash2 size={17} />
                  )}
                  Xóa
                </button>
              </div>
            </article>
          ))
        ) : (
          <EmptyState />
        )}
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:block">
        <div className="w-full overflow-x-auto overscroll-x-contain">
          <table className="min-w-275 w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="whitespace-nowrap px-4 py-4 font-extrabold">
                  Mã lô
                </th>

                <th className="px-4 py-4 font-extrabold">Sản phẩm</th>

                <th className="px-4 py-4 font-extrabold">Chứng chỉ</th>

                <th className="whitespace-nowrap px-4 py-4 font-extrabold">
                  Ngày thu hoạch
                </th>

                <th className="whitespace-nowrap px-4 py-4 font-extrabold">
                  Hạn sử dụng
                </th>

                <th className="whitespace-nowrap px-4 py-4 text-right font-extrabold">
                  SL nhập
                </th>

                <th className="whitespace-nowrap px-4 py-4 text-right font-extrabold">
                  SL còn
                </th>

                <th className="px-4 py-4 text-center font-extrabold">
                  Trạng thái
                </th>

                <th className="px-4 py-4 text-right font-extrabold">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center">
                    <div className="inline-flex items-center gap-2 font-bold text-slate-500">
                      <Loader2
                        size={20}
                        className="animate-spin text-green-600"
                      />
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : lots.length > 0 ? (
                lots.map((lot) => (
                  <tr key={lot.id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-4 font-extrabold text-green-700">
                      {lot.lot_code}
                    </td>

                    <td className="min-w-40 max-w-55 px-4 py-4">
                      <p className="break-words font-bold text-slate-800">
                        {lot.product?.name || "—"}
                      </p>
                    </td>

                    <td className="min-w-40 max-w-55 px-4 py-4">
                      <p className="break-words text-slate-600">
                        {lot.certificate?.certification_name || "—"}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      {formatDate(lot.harvest_date)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      {formatDate(lot.expiry_date)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-right font-bold text-slate-700">
                      {formatNumber(lot.quantity_imported)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-right font-extrabold text-green-700">
                      {formatNumber(lot.quantity_remaining)}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <StatusBadge lot={lot} />
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/seller/harvest-lots/${lot.id}/edit`}
                          aria-label={`Sửa lô ${lot.lot_code}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                        >
                          <Pencil size={17} />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(lot)}
                          disabled={deletingId === lot.id}
                          aria-label={`Xóa lô ${lot.lot_code}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === lot.id ? (
                            <Loader2 size={17} className="animate-spin" />
                          ) : (
                            <Trash2 size={17} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9}>
                    <EmptyState />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      {meta && lastPage > 1 && (
        <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-sm font-semibold text-slate-500 sm:text-left">
            Trang{" "}
            <span className="font-extrabold text-slate-900">{currentPage}</span>{" "}
            / {lastPage}
          </p>

          <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => fetchLots(currentPage - 1)}
              className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={18} />
              Trước
            </button>

            <button
              type="button"
              disabled={currentPage >= lastPage || loading}
              onClick={() => fetchLots(currentPage + 1)}
              className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sau
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ lot }) {
  const status = Number(lot.display_status ?? lot.status);

  const config = {
    1: {
      text: lot.status_text || "Đang bán",
      className: "bg-green-100 text-green-700",
    },
    2: {
      text: lot.status_text || "Tạm ẩn",
      className: "bg-slate-100 text-slate-600",
    },
    3: {
      text: lot.status_text || "Hết hàng",
      className: "bg-red-100 text-red-700",
    },
    4: {
      text: lot.status_text || "Hết hạn",
      className: "bg-orange-100 text-orange-700",
    },
  };

  const current = config[status] || {
    text: lot.status_text || "Không xác định",
    className: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-extrabold ${current.className}`}
    >
      {current.text}
    </span>
  );
}

function MobileInformation({ icon, label, value }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 text-slate-400">
        {icon}

        <span className="truncate text-[11px] font-bold uppercase">
          {label}
        </span>
      </div>

      <p className="mt-1.5 break-words text-sm font-extrabold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function MobileLoading() {
  return Array.from({ length: 3 }).map((_, index) => (
    <div key={index} className="h-70 animate-pulse rounded-2xl bg-slate-200" />
  ));
}

function EmptyState() {
  return (
    <div className="flex min-h-55 flex-col items-center justify-center px-5 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-700">
        <PackageOpen size={30} />
      </div>

      <h3 className="mt-4 font-extrabold text-slate-800">
        Chưa có lô sản phẩm
      </h3>

      <p className="mt-1 max-w-sm text-sm font-medium text-slate-500">
        Hãy tạo lô thu hoạch đầu tiên để quản lý số lượng tồn kho.
      </p>
    </div>
  );
}

export default HarvestLots;
