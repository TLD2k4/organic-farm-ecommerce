import { Children, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  MoreHorizontal,
  X,
  Save,
  RotateCcw,
  Loader2,
  FileText,
} from "lucide-react";
import harvestLotService from "../../services/harvestLotService";
import ResponsiveSelect from "../../components/common/ResponsiveSelect";
import { confirmAction } from "../../utils/actionDialog";
import useDebounce from "../../hooks/useDebounce";
import { getApiErrorMessage } from "../../utils/apiError";
import { highlight } from "../../utils/highlight";

const getErrorMessage = getApiErrorMessage;

const createFormDefault = {
  product_id: "",
  lot_code: "",
  harvest_date: "",
  expiry_date: "",
  quantity_imported: "",
  note: "",
};

function SellerHarvestLots() {
  const [payload, setPayload] = useState(null);
  const [options, setOptions] = useState({
    products: [],
  });

  const [filters, setFilters] = useState({
    keyword: "",
    product_id: "",
    status: "",
    page: 1,
    per_page: 8,
  });

  const [loading, setLoading] = useState(false);
  const [optionLoading, setOptionLoading] = useState(false);
  const [error, setError] = useState("");

  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedLot, setSelectedLot] = useState(null);
  const [form, setForm] = useState(createFormDefault);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailLot, setDetailLot] = useState(null);
  const debouncedKeyword = useDebounce(filters.keyword, 400);
  const requestFilters = useMemo(
    () => ({
      keyword: debouncedKeyword,
      product_id: filters.product_id,
      status: filters.status,
      page: filters.page,
      per_page: filters.per_page,
    }),
    [
      debouncedKeyword,
      filters.product_id,
      filters.status,
      filters.page,
      filters.per_page,
    ],
  );

  const lots = payload?.data || [];
  const meta = payload?.meta || {};

  const canPrev = Number(meta.current_page || 1) > 1;
  const canNext = Number(meta.current_page || 1) < Number(meta.last_page || 1);

  const pageNumbers = useMemo(() => {
    const lastPage = Number(meta.last_page || 1);
    const currentPage = Number(meta.current_page || 1);

    const start = Math.max(1, currentPage - 2);
    const end = Math.min(lastPage, start + 4);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [meta.current_page, meta.last_page]);

  const pageStats = useMemo(() => {
    const stats = payload?.stats || {};

    return {
      total: stats.total ?? meta.total ?? 0,
      active: stats.active ?? 0,
      warning: stats.warning ?? 0,
      out: stats.out_of_stock ?? 0,
    };
  }, [payload?.stats, meta.total]);

  const getImageUrl = (path) => {
    if (!path) return "/placeholder-product.png";

    if (path.startsWith("http")) return path;

    if (path.startsWith("/storage/")) {
      return `${import.meta.env.VITE_API_BASE_URL}${path}`;
    }

    if (path.startsWith("storage/")) {
      return `${import.meta.env.VITE_API_BASE_URL}/${path}`;
    }

    return `${import.meta.env.VITE_API_BASE_URL}/storage/${path}`;
  };

  const fetchOptions = async () => {
    setOptionLoading(true);

    try {
      const res = await harvestLotService.getOptions();
      setOptions(res.data || { products: [] });
    } catch (err) {
      console.log("Không thể tải options lô:", err);
    } finally {
      setOptionLoading(false);
    }
  };

  const fetchLots = async (customFilters = filters, options = {}) => {
    const silent = options.silent || false;

    if (!silent) {
      setLoading(true);
    }

    setError("");

    try {
      const res = await harvestLotService.getLots(customFilters);
      setPayload({
        data: res.data || [],
        stats: res.stats || {},
        meta: res.meta || {},
      });
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải danh sách lô sản phẩm."));
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchLots(requestFilters);
  }, [requestFilters]);

  useEffect(() => {
    if (!modalOpen && !detailOpen) return undefined;

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = oldOverflow;
    };
  }, [modalOpen, detailOpen]);

  const handleFilterChange = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value, page: 1 }));
  };

  const resetFilters = () => {
    const nextFilters = {
      keyword: "",
      product_id: "",
      status: "",
      page: 1,
      per_page: 8,
    };

    setFilters(nextFilters);
  };

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedLot(null);
    setForm(createFormDefault);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = async (lot) => {
    setModalMode("edit");
    setSelectedLot(lot);
    setFormError("");
    setModalOpen(true);

    try {
      const res = await harvestLotService.getLot(lot.id);
      const detail = res.data;

      setSelectedLot(detail);

      setForm({
        harvest_date: detail.harvest_date || "",
        expiry_date: detail.expiry_date || "",
        quantity_imported: detail.quantity_imported ?? "",
        status: [1, 2].includes(Number(detail.status))
          ? String(detail.status)
          : "",
        note: detail.note || "",
      });
    } catch {
      setForm({
        harvest_date: lot.harvest_date || "",
        expiry_date: lot.expiry_date || "",
        quantity_imported: lot.quantity_imported ?? "",
        status: [1, 2].includes(Number(lot.status)) ? String(lot.status) : "",
        note: lot.note || "",
      });
    }
  };

  const openDetail = async (lot) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailLot(null);

    try {
      const res = await harvestLotService.getLot(lot.id);
      setDetailLot(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể tải chi tiết lô."));
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleFormChange = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const buildCreatePayload = () => {
    return {
      product_id: form.product_id,
      lot_code: form.lot_code,
      harvest_date: form.harvest_date,
      expiry_date: form.expiry_date,
      quantity_imported: form.quantity_imported,
      note: form.note,
    };
  };

  const buildUpdatePayload = () => {
    const payload = {
      harvest_date: form.harvest_date,
      expiry_date: form.expiry_date,
      note: form.note,
    };

    if (form.status !== "") {
      payload.status = form.status;
    }

    if (Number(selectedLot?.quantity_sold || 0) <= 0) {
      payload.quantity_imported = form.quantity_imported;
    }

    return payload;
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError("");

    try {
      if (modalMode === "create") {
        await harvestLotService.createLot(buildCreatePayload());
        toast.success("Tạo lô sản phẩm thành công.");
      } else {
        await harvestLotService.updateLot(selectedLot.id, buildUpdatePayload());
        toast.success("Cập nhật lô sản phẩm thành công.");
      }

      setModalOpen(false);

      await fetchLots(requestFilters, {
        silent: true,
      });
    } catch (err) {
      const message = getErrorMessage(err, "Không thể lưu lô sản phẩm.");
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lot) => {
    const ok = await confirmAction({ title: `Xóa lô ${lot.lot_code}`, description: "Lô chỉ được xóa khi không vi phạm ràng buộc đơn hàng và tồn kho.", confirmLabel: "Xóa lô", danger: true });

    if (!ok) return;

    setActionLoadingId(lot.id);

    try {
      await harvestLotService.deleteLot(lot.id);

      toast.success("Xóa lô sản phẩm thành công.");

      await fetchLots(requestFilters, {
        silent: true,
      });
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể xóa lô sản phẩm."));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleStatus = async (lot) => {
    const displayStatus = Number(lot.display_status || lot.status);

    if ([3, 4].includes(displayStatus)) {
      toast.error("Không thể ẩn / hiện lô đã hết hàng hoặc hết hạn sử dụng.");
      return;
    }

    const nextStatus = Number(lot.status) === 2 ? 1 : 2;

    setActionLoadingId(lot.id);

    try {
      await harvestLotService.updateLot(lot.id, {
        status: nextStatus,
      });

      toast.success(
        nextStatus === 1 ? "Đã bật bán lô sản phẩm." : "Đã tạm ẩn lô sản phẩm.",
      );

      await fetchLots(requestFilters, {
        silent: true,
      });
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể cập nhật trạng thái lô."));
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-5">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold text-slate-950 sm:text-2xl">
            Quản lý lô sản phẩm
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Theo dõi tồn kho theo từng lô thu hoạch và chứng chỉ đi kèm.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-green-700 sm:w-auto"
        >
          <Plus size={18} />
          Tạo lô mới
        </button>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 min-[460px]:grid-cols-2 xl:grid-cols-4">
        <LotStatCard
          icon={<Package size={28} />}
          iconClass="bg-green-100 text-green-700"
          title="Tổng lô"
          value={pageStats.total}
          sub="Tất cả lô sản phẩm"
        />

        <LotStatCard
          icon={<CheckCircle2 size={28} />}
          iconClass="bg-green-100 text-green-700"
          title="Đang bán"
          value={pageStats.active}
          sub="Trong danh sách đang hiển thị"
        />

        <LotStatCard
          icon={<Clock size={28} />}
          iconClass="bg-orange-100 text-orange-600"
          title="Sắp hết hạn"
          value={pageStats.warning}
          sub="Trong 7 ngày tới"
        />

        <LotStatCard
          icon={<AlertTriangle size={28} />}
          iconClass="bg-red-100 text-red-600"
          title="Hết hàng"
          value={pageStats.out}
          sub="Không còn hàng trong lô"
        />
      </div>

      <div className="min-w-0 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-5">
        <div className="mb-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(170px,0.8fr)_auto]">
          <div className="relative sm:col-span-2 xl:col-span-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={filters.keyword}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  keyword: e.target.value,
                  page: 1,
                }))
              }
              placeholder="Tìm mã lô, tên sản phẩm, chứng nhận..."
              className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm font-semibold outline-none focus:border-green-500"
            />
          </div>

          <ResponsiveSelect
            value={filters.product_id}
            disabled={optionLoading}
            onChange={(value) => handleFilterChange("product_id", value)}
            options={[
              {
                value: "",
                label: optionLoading ? "Đang tải sản phẩm..." : "Tất cả sản phẩm",
              },
              ...options.products.map((product) => ({
                value: product.id,
                label: product.name,
              })),
            ]}
          />

          <ResponsiveSelect
            value={filters.status}
            onChange={(value) => handleFilterChange("status", value)}
            options={[
              { value: "", label: "Tất cả trạng thái" },
              { value: "1", label: "Đang bán" },
              { value: "2", label: "Tạm ẩn" },
              { value: "3", label: "Hết hàng" },
              { value: "4", label: "Hết hạn sử dụng" },
            ]}
          />

          <button
            onClick={resetFilters}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-600 transition hover:bg-slate-50"
          >
            <RotateCcw size={17} />
            Đặt lại
          </button>

        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-3 xl:hidden">
          {loading &&
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-96 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}

          {!loading &&
            lots.map((lot) => (
              <HarvestLotMobileCard
                key={lot.id}
                lot={lot}
                keyword={filters.keyword}
                isActioning={actionLoadingId === lot.id}
                getImageUrl={getImageUrl}
                onDetail={openDetail}
                onEdit={openEditModal}
                onToggle={handleToggleStatus}
                onDelete={handleDelete}
              />
            ))}

          {!loading && lots.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-12 text-center font-bold text-slate-400">
              Chưa có lô sản phẩm nào.
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto overscroll-x-contain rounded-xl border border-slate-100 xl:block">
          <table className="w-full min-w-340 text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500">
                <th className="px-3 py-3 font-extrabold">Mã lô</th>
                <th className="px-3 py-3 font-extrabold">Sản phẩm</th>
                <th className="px-3 py-3 font-extrabold">Chứng chỉ</th>
                <th className="px-3 py-3 font-extrabold">Ngày thu hoạch</th>
                <th className="px-3 py-3 font-extrabold">Hạn sử dụng</th>
                <th className="px-3 py-3 font-extrabold">Đã nhập</th>
                <th className="px-3 py-3 font-extrabold">Đã bán</th>
                <th className="px-3 py-3 font-extrabold">Còn lại</th>
                <th className="px-3 py-3 font-extrabold">Trạng thái</th>
                <th className="px-3 py-3 text-right font-extrabold">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && <HarvestLotTableSkeleton />}

              {!loading &&
                lots.map((lot) => {
                  const isActioning = actionLoadingId === lot.id;
                  const unit = lot.product?.unit || "";
                  const displayStatus = Number(
                    lot.display_status || lot.status,
                  );
                  const canToggle = ![3, 4].includes(displayStatus);
                  const canEdit = displayStatus !== 4;
                  return (
                    <tr
                      key={lot.id}
                      className={[
                        "border-t border-slate-100",
                        isActioning ? "bg-slate-50 opacity-70" : "",
                      ].join(" ")}
                    >
                      <td className="px-3 py-3 font-extrabold text-slate-700">
                        {highlight(lot.lot_code, filters.keyword)}
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <img
                            src={getImageUrl(lot.product?.thumbnail)}
                            alt={lot.product?.name || lot.lot_code}
                            className="h-11 w-11 rounded-lg object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder-product.png";
                            }}
                          />

                          <div className="min-w-0">
                            {lot.product?.id ? (
                              <Link
                                to={`/seller/products?view=${lot.product.id}`}
                                className="block max-w-55 break-words font-extrabold text-slate-900 hover:text-green-700 hover:underline"
                              >
                                {highlight(lot.product.name, filters.keyword)}
                              </Link>
                            ) : (
                              <p className="max-w-55 break-words font-extrabold text-slate-900">Không có</p>
                            )}
                            <p className="text-xs font-semibold text-slate-400">
                              ID SP: {lot.product?.id || "-"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        {lot.certificate ? (
                          <div className="flex flex-col gap-1">
                            <span className="w-fit rounded-lg border border-green-200 bg-green-50 px-2 py-1 text-xs font-extrabold text-green-700">
                              {lot.certificate.certification_name}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">
                              {lot.certificate.certificate_number}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-red-500">
                            Chưa có
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3 font-semibold text-slate-600">
                        {lot.harvest_date}
                      </td>

                      <td className="px-3 py-3">
                        <p
                          className={
                            lot.is_expired
                              ? "font-extrabold text-red-500"
                              : isExpiringSoon(lot.expiry_date)
                                ? "font-extrabold text-orange-500"
                                : "font-semibold text-slate-600"
                          }
                        >
                          {lot.expiry_date}
                        </p>

                        {lot.is_expired && (
                          <p className="text-xs font-bold text-red-500">
                            Đã hết hạn
                          </p>
                        )}
                      </td>

                      <td className="px-3 py-3 font-semibold text-slate-600">
                        {formatQuantity(lot.quantity_imported)} {unit}
                      </td>

                      <td className="px-3 py-3 font-semibold text-slate-600">
                        {formatQuantity(lot.quantity_sold)} {unit}
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={
                            Number(lot.quantity_remaining || 0) <= 0
                              ? "font-extrabold text-red-500"
                              : Number(lot.quantity_remaining || 0) <= 10
                                ? "font-extrabold text-orange-500"
                                : "font-extrabold text-green-700"
                          }
                        >
                          {formatQuantity(lot.quantity_remaining)} {unit}
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        <StatusBadge statusClass={lot.status_class}>
                          {lot.status_text}
                        </StatusBadge>
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            title="Xem chi tiết"
                            disabled={isActioning}
                            onClick={() => openDetail(lot)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            title={
                              canEdit
                                ? "Sửa lô"
                                : "Lô đã hết hạn, không thể sửa"
                            }
                            disabled={isActioning || !canEdit}
                            onClick={() => openEditModal(lot)}
                            className="rounded-lg border border-slate-200 p-2 text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            title={
                              canToggle
                                ? "Ẩn / hiện"
                                : "Không thể ẩn / hiện lô hết hàng hoặc hết hạn"
                            }
                            disabled={isActioning || !canToggle}
                            onClick={() => handleToggleStatus(lot)}
                            className="rounded-lg border border-slate-200 p-2 text-purple-600 transition hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {isActioning ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <MoreHorizontal size={16} />
                            )}
                          </button>

                          <button
                            title="Xóa"
                            disabled={isActioning}
                            onClick={() => handleDelete(lot)}
                            className="rounded-lg border border-slate-200 p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {isActioning ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {!loading && lots.length === 0 && (
                <tr>
                  <td
                    colSpan="10"
                    className="px-3 py-12 text-center font-bold text-slate-400"
                  >
                    Chưa có lô sản phẩm nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-sm font-semibold text-slate-500 sm:text-left">
            Hiển thị {meta.from || 0}–{meta.to || 0} trên {meta.total || 0} lô
          </p>

          <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1 sm:justify-end">
            <button
              disabled={!canPrev}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  page: Number(prev.page || 1) - 1,
                }))
              }
              className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-bold disabled:opacity-40"
            >
              Trước
            </button>

            {pageNumbers.map((page) => (
              <button
                key={page}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page,
                  }))
                }
                className={
                  Number(meta.current_page) === page
                    ? "h-9 w-9 rounded-lg bg-green-600 text-sm font-extrabold text-white"
                    : "h-9 w-9 rounded-lg border border-slate-200 text-sm font-extrabold text-slate-600"
                }
              >
                {page}
              </button>
            ))}

            <button
              disabled={!canNext}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  page: Number(prev.page || 1) + 1,
                }))
              }
              className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-bold disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <HarvestLotFormModal
          mode={modalMode}
          form={form}
          options={options}
          selectedLot={selectedLot}
          saving={saving}
          error={formError}
          optionLoading={optionLoading}
          getImageUrl={getImageUrl}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          onChange={handleFormChange}
        />
      )}

      {detailOpen && (
        <HarvestLotDetailModal
          lot={detailLot}
          loading={detailLoading}
          getImageUrl={getImageUrl}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </div>
  );
}

function HarvestLotMobileCard({
  lot,
  keyword,
  isActioning,
  getImageUrl,
  onDetail,
  onEdit,
  onToggle,
  onDelete,
}) {
  const unit = lot.product?.unit || "";
  const displayStatus = Number(lot.display_status || lot.status);
  const canToggle = ![3, 4].includes(displayStatus);
  const canEdit = displayStatus !== 4;

  return (
    <article
      className={`min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
        isActioning ? "opacity-70" : ""
      }`}
    >
      <div className="flex min-w-0 flex-col gap-3 border-b border-slate-100 p-4 min-[430px]:flex-row min-[430px]:items-start min-[430px]:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={getImageUrl(lot.product?.thumbnail)}
            alt={lot.product?.name || lot.lot_code}
            className="h-16 w-16 shrink-0 rounded-xl object-cover"
            onError={(e) => {
              e.currentTarget.src = "/placeholder-product.png";
            }}
          />

          <div className="min-w-0">
            <h3 className="break-words font-extrabold text-slate-900">
              {highlight(lot.lot_code, keyword)}
            </h3>
            {lot.product?.id ? (
              <Link
                to={`/seller/products?view=${lot.product.id}`}
                className="mt-1 block break-words text-sm font-bold text-slate-600 hover:text-green-700 hover:underline"
              >
                {highlight(lot.product.name, keyword)}
              </Link>
            ) : (
              <p className="mt-1 break-words text-sm font-bold text-slate-600">Không có sản phẩm</p>
            )}
            <p className="mt-1 break-words text-xs font-semibold text-slate-400">
              {highlight(
                lot.certificate?.certification_name || "Chưa có chứng chỉ",
                keyword,
              )}
            </p>
          </div>
        </div>

        <div className="self-start">
          <StatusBadge statusClass={lot.status_class}>
            {lot.status_text}
          </StatusBadge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 min-[400px]:grid-cols-2">
        <InfoBox label="Ngày thu hoạch" value={lot.harvest_date || "—"} />
        <InfoBox label="Hạn sử dụng" value={lot.expiry_date || "—"} />
        <InfoBox
          label="Đã nhập"
          value={`${formatQuantity(lot.quantity_imported)} ${unit}`}
        />
        <InfoBox
          label="Đã bán"
          value={`${formatQuantity(lot.quantity_sold)} ${unit}`}
        />
        <div className="min-[400px]:col-span-2">
          <InfoBox
            label="Còn lại"
            value={`${formatQuantity(lot.quantity_remaining)} ${unit}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50 p-3 min-[480px]:grid-cols-4">
        <button
          type="button"
          disabled={isActioning}
          onClick={() => onDetail(lot)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 disabled:opacity-40"
        >
          <Eye size={16} /> Xem
        </button>
        <button
          type="button"
          disabled={isActioning || !canEdit}
          onClick={() => onEdit(lot)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-600 disabled:opacity-40"
        >
          <Pencil size={16} /> Sửa
        </button>
        <button
          type="button"
          disabled={isActioning || !canToggle}
          onClick={() => onToggle(lot)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-purple-100 bg-purple-50 text-sm font-bold text-purple-600 disabled:opacity-40"
        >
          {isActioning ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <MoreHorizontal size={16} />
          )}
          Ẩn/hiện
        </button>
        <button
          type="button"
          disabled={isActioning}
          onClick={() => onDelete(lot)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 text-sm font-bold text-red-600 disabled:opacity-40"
        >
          {isActioning ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
          Xóa
        </button>
      </div>
    </article>
  );
}

function HarvestLotFormModal({
  mode,
  form,
  options,
  selectedLot,
  saving,
  error,
  optionLoading,
  getImageUrl,
  onClose,
  onSave,
  onChange,
}) {
  const isCreate = mode === "create";

  const selectedProduct = options.products.find(
    (product) => String(product.id) === String(form.product_id),
  );

  const quantitySold = Number(selectedLot?.quantity_sold || 0);
  const cannotEditInventory = !isCreate && quantitySold > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center overflow-y-auto bg-slate-950/40 sm:items-center sm:p-4">
      <div className="max-h-[100dvh] w-full min-w-0 overflow-y-auto bg-white shadow-xl sm:max-h-[94dvh] sm:max-w-270 sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="break-words text-lg font-extrabold text-slate-950 sm:text-xl">
              {isCreate ? "Tạo lô sản phẩm" : "Cập nhật lô sản phẩm"}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {isCreate
                ? "Tạo lô thu hoạch mới cho sản phẩm đang bán và còn chứng chỉ hợp lệ."
                : "Không được đổi sản phẩm, mã lô và chứng chỉ của lô."}
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Đóng biểu mẫu lô sản phẩm"
            title="Đóng biểu mẫu lô sản phẩm"
            className="shrink-0 rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-slate-100 p-4 sm:p-5">
            <h3 className="mb-4 text-base font-extrabold text-slate-900">
              Thông tin lô
            </h3>

            <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
              {isCreate ? (
                <FormSelect
                  label="Sản phẩm"
                  value={form.product_id}
                  onChange={(value) => onChange("product_id", value)}
                  required
                >
                  <option value="">
                    {optionLoading ? "Đang tải..." : "Chọn sản phẩm"}
                  </option>

                  {options.products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.certificate?.certification_name}
                    </option>
                  ))}
                </FormSelect>
              ) : (
                <FormInput
                  label="Sản phẩm"
                  value={selectedLot?.product?.name || ""}
                  disabled
                />
              )}

              {isCreate ? (
                <FormInput
                  label="Mã lô"
                  value={form.lot_code}
                  onChange={(value) => onChange("lot_code", value)}
                  placeholder="VD: LOT001"
                  required
                />
              ) : (
                <FormInput
                  label="Mã lô"
                  value={selectedLot?.lot_code || ""}
                  disabled
                />
              )}

              <FormInput
                label="Ngày thu hoạch"
                type="date"
                value={form.harvest_date}
                onChange={(value) => onChange("harvest_date", value)}
                disabled={cannotEditInventory}
                required
              />

              <FormInput
                label="Hạn sử dụng"
                type="date"
                value={form.expiry_date}
                onChange={(value) => onChange("expiry_date", value)}
                disabled={cannotEditInventory}
                required
              />

              <FormInput
                label="Số lượng nhập"
                type="number"
                value={form.quantity_imported}
                onChange={(value) => onChange("quantity_imported", value)}
                disabled={cannotEditInventory}
                required
              />

              {!isCreate && (
                <FormSelect
                  label="Trạng thái"
                  value={form.status}
                  onChange={(value) => onChange("status", value)}
                >
                  <option value="">Không đổi trạng thái</option>
                  <option value="1">Đang bán</option>
                  <option value="2">Tạm ẩn</option>
                </FormSelect>
              )}

              <div className="md:col-span-2">
                <FormTextarea
                  label="Ghi chú"
                  value={form.note}
                  onChange={(value) => onChange("note", value)}
                  placeholder="Ghi chú về lô sản phẩm..."
                />
              </div>
            </div>

            {cannotEditInventory && (
              <div className="mt-4 rounded-xl bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
                Lô đã phát sinh đơn hàng nên ngày thu hoạch, hạn sử dụng và số lượng nhập đã được khóa.
              </div>
            )}
          </div>

          {isCreate && selectedProduct && (
            <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
              <h3 className="mb-3 text-base font-extrabold text-green-800">
                Sản phẩm được chọn
              </h3>

              <div className="flex min-w-0 flex-col gap-4 min-[430px]:flex-row min-[430px]:items-center">
                <img
                  src={getImageUrl(selectedProduct.thumbnail)}
                  alt={selectedProduct.name}
                  className="h-16 w-16 rounded-xl object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder-product.png";
                  }}
                />

                <div className="min-w-0">
                  <p className="break-words font-extrabold text-slate-900">
                    {selectedProduct.name}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    Danh mục: {selectedProduct.category_name || "Chưa có"} · Tồn
                    hiện tại: {selectedProduct.stock_quantity}{" "}
                    {selectedProduct.unit}
                  </p>

                  <p className="mt-1 text-sm font-bold text-green-700">
                    {selectedProduct.certificate?.certification_name} · Mã:{" "}
                    {selectedProduct.certificate?.certificate_number} · Hết hạn:{" "}
                    {selectedProduct.certificate?.expiry_date}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isCreate && selectedLot && (
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3">
              <InfoBox
                label="Đã bán"
                value={`${formatQuantity(selectedLot.quantity_sold)} ${
                  selectedLot.product?.unit || ""
                }`}
              />
              <InfoBox
                label="Còn lại"
                value={`${formatQuantity(selectedLot.quantity_remaining)} ${
                  selectedLot.product?.unit || ""
                }`}
              />
              <InfoBox
                label="Chứng chỉ"
                value={selectedLot.certificate?.certification_name || "Chưa có"}
              />
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-100 bg-white px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            onClick={onClose}
            className="h-11 w-full rounded-xl border border-slate-200 px-5 text-sm font-extrabold text-slate-600 hover:bg-slate-50 sm:w-auto"
          >
            Hủy
          </button>

          <button
            onClick={onSave}
            disabled={saving}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-extrabold text-white hover:bg-green-700 disabled:opacity-60 sm:w-auto"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {saving ? "Đang lưu..." : "Lưu lô"}
          </button>
        </div>
      </div>
    </div>
  );
}

function HarvestLotDetailModal({ lot, loading, getImageUrl, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center overflow-y-auto bg-slate-950/40 sm:items-center sm:p-4">
      <div className="max-h-[100dvh] w-full min-w-0 overflow-y-auto bg-white shadow-xl sm:max-h-[94dvh] sm:max-w-270 sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-slate-950 sm:text-xl">
              Chi tiết lô sản phẩm
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Xem thông tin lô, sản phẩm, chứng chỉ và tồn kho.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Đóng chi tiết lô sản phẩm"
            title="Đóng chi tiết lô sản phẩm"
            className="shrink-0 rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={22} />
          </button>
        </div>

        {loading && (
          <div className="flex h-90 items-center justify-center">
            <Loader2 className="animate-spin text-green-700" size={32} />
          </div>
        )}

        {!loading && lot && (
          <div className="space-y-5 p-4 sm:p-6">
            <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-slate-100 p-4">
                <img
                  src={getImageUrl(lot.product?.thumbnail)}
                  alt={lot.product?.name || lot.lot_code}
                  className="h-56 w-full rounded-xl object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder-product.png";
                  }}
                />

                <div className="mt-4">
                  <StatusBadge statusClass={lot.status_class}>
                    {lot.status_text}
                  </StatusBadge>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 p-5">
                <div className="mb-4 flex min-w-0 flex-col gap-3 min-[430px]:flex-row min-[430px]:items-start min-[430px]:justify-between">
                  <div className="min-w-0">
                    <h3 className="break-words text-xl font-extrabold text-slate-950 sm:text-2xl">
                      {lot.lot_code}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-400">
                      {lot.product?.id ? (
                        <Link
                          to={`/seller/products?view=${lot.product.id}`}
                          className="hover:text-green-700 hover:underline"
                        >
                          {lot.product?.name}
                        </Link>
                      ) : (
                        lot.product?.name
                      )}{" "}
                      · {lot.category?.name || "Chưa có danh mục"}
                    </p>
                  </div>

                  <StatusBadge statusClass={lot.status_class}>
                    {lot.status_text}
                  </StatusBadge>
                </div>

                <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-3">
                  <InfoBox label="Ngày thu hoạch" value={lot.harvest_date} />
                  <InfoBox label="Hạn sử dụng" value={lot.expiry_date} />
                  <InfoBox
                    label="Số lượng nhập"
                    value={`${formatQuantity(lot.quantity_imported)} ${
                      lot.product?.unit || ""
                    }`}
                  />
                  <InfoBox
                    label="Đã bán"
                    value={`${formatQuantity(lot.quantity_sold)} ${
                      lot.product?.unit || ""
                    }`}
                  />
                  <InfoBox
                    label="Còn lại"
                    value={`${formatQuantity(lot.quantity_remaining)} ${
                      lot.product?.unit || ""
                    }`}
                  />
                  <InfoBox
                    label="Gian hàng"
                    value={
                      lot.farm?.id ? (
                        <Link to="/seller/farm" className="hover:text-green-700 hover:underline">
                          {lot.farm?.name || "Chưa có"}
                        </Link>
                      ) : (
                        "Chưa có"
                      )
                    }
                  />
                </div>

                <div className="mt-4">
                  <p className="mb-1 text-sm font-extrabold text-slate-600">
                    Ghi chú
                  </p>
                  <p className="text-sm font-medium leading-6 text-slate-500">
                    {lot.note || "Chưa có ghi chú."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 p-5">
              <h3 className="mb-4 text-lg font-extrabold text-slate-950">
                Thông tin chứng chỉ
              </h3>

              {lot.certificate ? (
                <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
                  <InfoBox
                    label="Loại chứng chỉ"
                    value={lot.certificate.certification_name || "Chưa có"}
                  />
                  <InfoBox
                    label="Mã chứng chỉ"
                    value={lot.certificate.certificate_number || "Chưa có"}
                  />
                  <InfoBox
                    label="Ngày cấp"
                    value={lot.certificate.issued_date || "Chưa có"}
                  />
                  <InfoBox
                    label="Ngày hết hạn"
                    value={lot.certificate.expiry_date || "Chưa có"}
                  />

                  <a
                    href={lot.certificate.certificate_file}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-center text-sm font-extrabold text-green-700 min-[420px]:col-span-2 xl:col-span-4 xl:w-fit"
                  >
                    <FileText size={17} />
                    Xem file chứng chỉ
                  </a>
                </div>
              ) : (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                  Lô này chưa có chứng chỉ.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HarvestLotTableSkeleton() {
  return Array.from({ length: 5 }).map((_, index) => (
    <tr key={index} className="border-t border-slate-100">
      <td className="px-3 py-4">
        <SkeletonBox className="h-4 w-20" />
      </td>

      <td className="px-3 py-4">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-11 w-11 rounded-lg" />
          <div>
            <SkeletonBox className="h-4 w-28" />
            <SkeletonBox className="mt-2 h-3 w-16" />
          </div>
        </div>
      </td>

      <td className="px-3 py-4">
        <SkeletonBox className="h-6 w-24 rounded-lg" />
      </td>

      <td className="px-3 py-4">
        <SkeletonBox className="h-4 w-20" />
      </td>

      <td className="px-3 py-4">
        <SkeletonBox className="h-4 w-20" />
      </td>

      <td className="px-3 py-4">
        <SkeletonBox className="h-4 w-14" />
      </td>

      <td className="px-3 py-4">
        <SkeletonBox className="h-4 w-14" />
      </td>

      <td className="px-3 py-4">
        <SkeletonBox className="h-4 w-14" />
      </td>

      <td className="px-3 py-4">
        <SkeletonBox className="h-6 w-20 rounded-lg" />
      </td>

      <td className="px-3 py-4">
        <SkeletonBox className="ml-auto h-8 w-28 rounded-lg" />
      </td>
    </tr>
  ));
}

function LotStatCard({ icon, iconClass, title, value, sub }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:min-h-26 sm:gap-4 sm:p-5">
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${iconClass}`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-500">{title}</p>
        <h2 className="mt-1 break-words text-xl font-extrabold text-slate-950 sm:text-2xl">
          {value}
        </h2>
        <p className="mt-1 text-xs font-extrabold text-slate-400">{sub}</p>
      </div>
    </div>
  );
}

function StatusBadge({ statusClass, children }) {
  const classMap = {
    active: "bg-green-50 text-green-700",
    pending: "bg-orange-50 text-orange-600",
    warning: "bg-orange-50 text-orange-600",
    danger: "bg-red-50 text-red-600",
    hidden: "bg-purple-50 text-purple-600",
  };

  return (
    <span
      className={`inline-flex min-w-20.5 justify-center rounded-lg px-2.5 py-1.5 text-xs font-extrabold ${
        classMap[statusClass] || classMap.pending
      }`}
    >
      {children}
    </span>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3 sm:p-4">
      <p className="text-xs font-extrabold text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-extrabold text-slate-900 sm:text-base">
        {value}
      </p>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  disabled = false,
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-sm font-extrabold text-slate-600">
        {label} {required && <b className="text-red-500">*</b>}
      </span>

      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="h-11 w-full min-w-0 max-w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-green-500 disabled:bg-slate-50 disabled:text-slate-400"
      />
    </label>
  );
}

function FormSelect({ label, value, onChange, required = false, children }) {
  const options = Children.toArray(children).map((child) => ({
    value: child.props.value,
    label: child.props.children,
  }));

  return (
    <div className="block min-w-0">
      <span className="mb-1 block text-sm font-extrabold text-slate-600">
        {label} {required && <b className="text-red-500">*</b>}
      </span>

      <ResponsiveSelect
        value={value ?? ""}
        onChange={onChange}
        options={options}
      />
    </div>
  );
}

function FormTextarea({ label, value, onChange, placeholder = "", rows = 4 }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-sm font-extrabold text-slate-600">
        {label}
      </span>

      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full min-w-0 max-w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:border-green-500"
      />
    </label>
  );
}

function SkeletonBox({ className = "" }) {
  return (
    <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />
  );
}

function formatQuantity(value) {
  const number = Number(value || 0);

  if (Number.isInteger(number)) {
    return number;
  }

  return number.toFixed(2);
}

function isExpiringSoon(dateString) {
  if (!dateString) return false;

  const today = new Date();
  const expiry = new Date(dateString);

  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  const diff = expiry.getTime() - today.getTime();
  const days = diff / (1000 * 60 * 60 * 24);

  return days >= 0 && days <= 7;
}

export default SellerHarvestLots;
