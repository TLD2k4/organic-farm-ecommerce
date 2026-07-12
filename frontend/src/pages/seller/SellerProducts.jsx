import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import uploadService from "../../services/uploadService";
import {
  Package,
  CheckCircle2,
  Clock,
  EyeOff,
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  MoreHorizontal,
  X,
  Save,
  RotateCcw,
  FileText,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import productService from "../../services/productService";

const createFormDefault = {
  category_id: "",
  name: "",
  description: "",
  price: "",
  sale_price: "",
  unit: "kg",
  thumbnail: "",
  detail_images_text: "",
  is_hot: false,

  certification_id: "",
  certificate_number: "",
  certificate_file: "",
  issued_date: "",
  expiry_date: "",
};

const editFormDefault = {
  category_id: "",
  name: "",
  description: "",
  price: "",
  sale_price: "",
  unit: "kg",
  thumbnail: "",
  detail_images_text: "",
  is_hot: false,
};

const renewFormDefault = {
  certificate_number: "",
  certificate_file: "",
  issued_date: "",
  expiry_date: "",
};

function SellerProducts() {
  const [payload, setPayload] = useState(null);
  const [options, setOptions] = useState({
    categories: [],
    certifications: [],
  });

  const [filters, setFilters] = useState({
    keyword: "",
    category_id: "",
    status: "",
    page: 1,
    per_page: 8,
  });
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [optionLoading, setOptionLoading] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState(createFormDefault);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);

  const [renewOpen, setRenewOpen] = useState(false);
  const [renewForm, setRenewForm] = useState(renewFormDefault);
  const [renewSaving, setRenewSaving] = useState(false);
  const [renewError, setRenewError] = useState("");

  const products = payload?.products || [];
  const stats = payload?.stats || {};
  const pagination = payload?.pagination || {};

  const canPrev = Number(pagination.current_page || 1) > 1;
  const canNext =
    Number(pagination.current_page || 1) < Number(pagination.last_page || 1);

  const pageNumbers = useMemo(() => {
    const lastPage = Number(pagination.last_page || 1);
    const currentPage = Number(pagination.current_page || 1);

    const start = Math.max(1, currentPage - 2);
    const end = Math.min(lastPage, start + 4);

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [pagination.current_page, pagination.last_page]);

  const getImageUrl = (path) => {
    if (!path) return "/placeholder-product.png";

    if (path.startsWith("http")) {
      return path;
    }

    if (path.startsWith("/storage/")) {
      return `${import.meta.env.VITE_API_BASE_URL}${path}`;
    }

    if (path.startsWith("storage/")) {
      return `${import.meta.env.VITE_API_BASE_URL}/${path}`;
    }

    return `${import.meta.env.VITE_API_BASE_URL}/storage/${path}`;
  };

  const getErrorMessage = (err, fallback = "Có lỗi xảy ra.") => {
    if (err?.errors) {
      const firstKey = Object.keys(err.errors)[0];
      return err.errors[firstKey]?.[0] || fallback;
    }

    return err?.message || err?.error || fallback;
  };

  const parseDetailImages = (text) => {
    if (!text) return [];

    return text
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const fetchOptions = async () => {
    setOptionLoading(true);

    try {
      const res = await productService.getOptions();
      setOptions(res.data || { categories: [], certifications: [] });
    } catch (err) {
      console.log("Không thể tải options:", err);
    } finally {
      setOptionLoading(false);
    }
  };

  const fetchProducts = async (customFilters = filters, options = {}) => {
    const silent = options.silent || false;

    if (!silent) {
      setLoading(true);
    }

    setError("");

    try {
      const res = await productService.getSellerProducts(customFilters);
      setPayload(res.data);
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải danh sách sản phẩm."));
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
    fetchProducts(filters);
  }, [filters.page, filters.per_page]);

  const handleSearch = () => {
    const nextFilters = {
      ...filters,
      page: 1,
    };

    setFilters(nextFilters);
    fetchProducts(nextFilters);
  };

  const handleFilterChange = (name, value) => {
    const nextFilters = {
      ...filters,
      [name]: value,
      page: 1,
    };

    setFilters(nextFilters);
    fetchProducts(nextFilters);
  };

  const resetFilters = () => {
    const nextFilters = {
      keyword: "",
      category_id: "",
      status: "",
      page: 1,
      per_page: 8,
    };

    setFilters(nextFilters);
    fetchProducts(nextFilters);
  };

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedProduct(null);
    setForm(createFormDefault);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = async (product) => {
    setModalMode("edit");
    setSelectedProduct(product);
    setFormError("");
    setModalOpen(true);

    try {
      const res = await productService.getSellerProduct(product.id);
      const detail = res.data;

      const imageUrls = (detail.images || [])
        .slice(1)
        .map((image) => image.image_url)
        .join("\n");

      setForm({
        category_id: detail.category_id || "",
        name: detail.name || "",
        description: detail.description || "",
        price: detail.price ?? "",
        sale_price: detail.sale_price ?? "",
        unit: detail.unit || "kg",
        thumbnail: detail.thumbnail || "",
        detail_images_text: imageUrls,
        is_hot: Boolean(detail.is_hot),
      });
    } catch (err) {
      setForm({
        category_id: product.category_id || "",
        name: product.name || "",
        description: product.description || "",
        price: product.price ?? "",
        sale_price: product.sale_price ?? "",
        unit: product.unit || "kg",
        thumbnail: product.thumbnail || "",
        detail_images_text: "",
        is_hot: Boolean(product.is_hot),
      });
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
      category_id: form.category_id,
      name: form.name,
      description: form.description,
      price: form.price,
      sale_price: form.sale_price || null,
      unit: form.unit,
      thumbnail: form.thumbnail,
      detail_images: parseDetailImages(form.detail_images_text),
      is_hot: form.is_hot,

      certification_id: form.certification_id,
      certificate_number: form.certificate_number,
      certificate_file: form.certificate_file,
      issued_date: form.issued_date,
      expiry_date: form.expiry_date,
    };
  };

  const buildUpdatePayload = () => {
    return {
      category_id: form.category_id,
      name: form.name,
      description: form.description,
      price: form.price,
      sale_price: form.sale_price || null,
      unit: form.unit,
      thumbnail: form.thumbnail,
      detail_images: parseDetailImages(form.detail_images_text),
      is_hot: form.is_hot,
    };
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError("");

    try {
      if (modalMode === "create") {
        await productService.createSellerProduct(buildCreatePayload());
        toast.success("Thêm sản phẩm thành công. Đang chờ duyệt.");
      } else {
        await productService.updateSellerProduct(
          selectedProduct.id,
          buildUpdatePayload()
        );
        toast.success("Cập nhật sản phẩm thành công. Đang chờ duyệt lại.");
      }

      setModalOpen(false);

      await fetchProducts(filters, {
        silent: true,
      });
    } catch (err) {
      const message = getErrorMessage(err, "Không thể lưu sản phẩm.");
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    const ok = window.confirm(
      `Bạn có chắc muốn xóa sản phẩm "${product.name}" không?`
    );

    if (!ok) return;

    setActionLoadingId(product.id);

    try {
      await productService.deleteSellerProduct(product.id);

      toast.success("Xóa sản phẩm thành công.");

      await fetchProducts(filters, {
        silent: true,
      });
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể xóa sản phẩm."));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleStatus = async (product) => {
    setActionLoadingId(product.id);

    try {
      await productService.toggleStatus(product.id);

      toast.success("Cập nhật trạng thái sản phẩm thành công.");

      await fetchProducts(filters, {
        silent: true,
      });
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể ẩn / hiện sản phẩm."));
    } finally {
      setActionLoadingId(null);
    }
  };

  const openDetail = async (product) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailProduct(null);

    try {
      const res = await productService.getSellerProduct(product.id);
      setDetailProduct(res.data);
    } catch (err) {
      alert(getErrorMessage(err, "Không thể tải chi tiết sản phẩm."));
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const openRenewModal = () => {
    setRenewForm(renewFormDefault);
    setRenewError("");
    setRenewOpen(true);
  };

  const handleRenewChange = (name, value) => {
    setRenewForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRenewSubmit = async () => {
    if (!detailProduct) return;

    setRenewSaving(true);
    setRenewError("");

    try {
      await productService.renewCertificate(detailProduct.id, renewForm);

      toast.success("Gửi yêu cầu gia hạn chứng chỉ thành công.");

      setRenewOpen(false);

      const res = await productService.getSellerProduct(detailProduct.id);
      setDetailProduct(res.data);

      await fetchProducts(filters, {
        silent: true,
      });
    } catch (err) {
      const message = getErrorMessage(err, "Không thể gửi yêu cầu gia hạn.");
      setRenewError(message);
      toast.error(message);
    } finally {
      setRenewSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950">
            Quản lý sản phẩm
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Quản lý sản phẩm nông sản, hình ảnh, trạng thái và chứng chỉ.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex h-11 items-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-green-700"
        >
          <Plus size={18} />
          Thêm sản phẩm
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <ProductStatCard
          icon={<Package size={28} />}
          iconClass="bg-green-100 text-green-700"
          title="Tổng sản phẩm"
          value={stats.total_products ?? 0}
          sub="Tất cả sản phẩm trong gian hàng"
        />

        <ProductStatCard
          icon={<CheckCircle2 size={28} />}
          iconClass="bg-green-100 text-green-700"
          title="Đang bán"
          value={stats.active_products ?? 0}
          sub="Sản phẩm đang hiển thị"
        />

        <ProductStatCard
          icon={<Clock size={28} />}
          iconClass="bg-orange-100 text-orange-600"
          title="Chờ duyệt"
          value={stats.pending_products ?? 0}
          sub="Đang chờ quản trị viên duyệt"
        />

        <ProductStatCard
          icon={<EyeOff size={28} />}
          iconClass="bg-purple-100 text-purple-600"
          title="Tạm ẩn"
          value={stats.hidden_products ?? 0}
          sub="Sản phẩm tạm ẩn"
        />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-5 grid grid-cols-[1.2fr_0.8fr_0.8fr_auto_auto] gap-3">
          <div className="relative">
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
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="Tìm kiếm sản phẩm..."
              className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm font-semibold outline-none focus:border-green-500"
            />
          </div>

          <select
            value={filters.category_id}
            onChange={(e) => handleFilterChange("category_id", e.target.value)}
            className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-green-500"
          >
            <option value="">Tất cả danh mục</option>
            {options.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

<select
  value={filters.status}
  onChange={(e) => handleFilterChange("status", e.target.value)}
  className="h-11 rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-green-500"
>
  <option value="">Tất cả trạng thái</option>
  <option value="0">Chờ duyệt</option>
  <option value="1">Đang bán</option>
  <option value="2">Từ chối</option>
  <option value="3">Tạm ẩn</option>
  <option value="expired_certificate">Hết hạn chứng chỉ</option>
</select>

          <button
            onClick={resetFilters}
            className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-600 transition hover:bg-slate-50"
          >
            <RotateCcw size={17} />
            Đặt lại
          </button>

          <button
            onClick={handleSearch}
            className="flex h-11 items-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-extrabold text-white transition hover:bg-green-700"
          >
            <Search size={17} />
            Tìm
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500">
                <th className="px-3 py-3 font-extrabold">Sản phẩm</th>
                <th className="px-3 py-3 font-extrabold">Danh mục</th>
                <th className="px-3 py-3 font-extrabold">Giá bán</th>
                <th className="px-3 py-3 font-extrabold">Tồn kho</th>
                <th className="px-3 py-3 font-extrabold">Chứng chỉ</th>
                <th className="px-3 py-3 font-extrabold">Trạng thái</th>
                <th className="px-3 py-3 font-extrabold">Cập nhật</th>
                <th className="px-3 py-3 text-right font-extrabold">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody>
{loading &&
  Array.from({ length: 5 }).map((_, index) => (
    <tr key={index} className="border-t border-slate-100">
      <td className="px-3 py-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-lg bg-slate-100" />
          <div className="space-y-2">
            <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </td>

      <td className="px-3 py-4">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
      </td>

      <td className="px-3 py-4">
        <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
      </td>

      <td className="px-3 py-4">
        <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
      </td>

      <td className="px-3 py-4">
        <div className="h-6 w-20 animate-pulse rounded-lg bg-slate-100" />
      </td>

      <td className="px-3 py-4">
        <div className="h-6 w-24 animate-pulse rounded-lg bg-slate-100" />
      </td>

      <td className="px-3 py-4">
        <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
      </td>

      <td className="px-3 py-4">
        <div className="ml-auto h-8 w-28 animate-pulse rounded-lg bg-slate-100" />
      </td>
    </tr>
  ))}

{!loading &&
  products.map((product) => {
    const isActioning = actionLoadingId === product.id;

    return (
      <tr
        key={product.id}
        className={[
          "border-t border-slate-100",
          isActioning ? "bg-slate-50 opacity-70" : "",
        ].join(" ")}
      >
        <td className="px-3 py-3">
          <div className="flex items-center gap-3">
            <img
              src={getImageUrl(product.thumbnail)}
              alt={product.name}
              className="h-12 w-12 rounded-lg object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder-product.png";
              }}
            />

            <div>
              <p className="font-extrabold text-slate-900">{product.name}</p>
              <p className="text-xs font-semibold text-slate-400">
                {product.code}
              </p>
            </div>
          </div>
        </td>

        <td className="px-3 py-3 font-semibold text-slate-600">
          {product.category_name || "Chưa có"}
        </td>

        <td className="px-3 py-3">
          <p className="font-extrabold text-green-700">
            {product.sale_price_text || product.price_text}
          </p>

          {product.sale_price_text && (
            <p className="text-xs font-semibold text-slate-400 line-through">
              {product.price_text}
            </p>
          )}
        </td>

        <td className="px-3 py-3">
          <span
            className={
              Number(product.stock_quantity || 0) <= 0
                ? "font-extrabold text-red-500"
                : "font-extrabold text-slate-700"
            }
          >
            {product.stock_quantity} {product.unit}
          </span>
        </td>

        <td className="px-3 py-3">
          {product.latest_certificate ? (
            <div className="flex flex-col gap-1">
              <span
                className={[
                  "w-fit rounded-lg border px-2 py-1 text-xs font-extrabold",
                  product.latest_certificate.status_class === "danger"
                    ? "border-red-200 bg-red-50 text-red-600"
                    : product.latest_certificate.status_class === "pending"
                    ? "border-orange-200 bg-orange-50 text-orange-600"
                    : "border-green-200 bg-green-50 text-green-700",
                ].join(" ")}
              >
                {product.latest_certificate.certification_name}
              </span>

              <span className="text-xs font-semibold text-slate-400">
                {product.latest_certificate.certificate_number}
              </span>
            </div>
          ) : (
            <span className="text-xs font-bold text-red-500">Chưa có</span>
          )}
        </td>

        <td className="px-3 py-3">
          <StatusBadge statusClass={product.status_class}>
            {product.status_text}
          </StatusBadge>
        </td>

        <td className="px-3 py-3 font-semibold text-slate-500">
          {product.updated_at}
        </td>

        <td className="px-3 py-3">
          <div className="flex justify-end gap-2">
            <button
              title="Xem chi tiết"
              disabled={isActioning}
              onClick={() => openDetail(product)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Eye size={16} />
            </button>

            <button
              title="Sửa sản phẩm"
              disabled={isActioning}
              onClick={() => openEditModal(product)}
              className="rounded-lg border border-slate-200 p-2 text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Pencil size={16} />
            </button>

            <button
              title="Ẩn / hiện"
              disabled={isActioning}
              onClick={() => handleToggleStatus(product)}
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
              onClick={() => handleDelete(product)}
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

              {!loading && products.length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="px-3 py-12 text-center font-bold text-slate-400"
                  >
                    Chưa có sản phẩm nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-500">
            Hiển thị {pagination.from || 0}–{pagination.to || 0} trên{" "}
            {pagination.total || 0} sản phẩm
          </p>

          <div className="flex items-center gap-2">
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
                  Number(pagination.current_page) === page
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
        <ProductFormModal
          mode={modalMode}
          form={form}
          options={options}
          saving={saving}
          error={formError}
          optionLoading={optionLoading}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          onChange={handleFormChange}
        />
      )}

      {detailOpen && (
        <ProductDetailModal
          product={detailProduct}
          loading={detailLoading}
          getImageUrl={getImageUrl}
          onClose={() => setDetailOpen(false)}
          onRenew={openRenewModal}
        />
      )}

      {renewOpen && (
        <RenewCertificateModal
          product={detailProduct}
          form={renewForm}
          saving={renewSaving}
          error={renewError}
          onClose={() => setRenewOpen(false)}
          onChange={handleRenewChange}
          onSubmit={handleRenewSubmit}
        />
      )}
    </div>
  );
}

function ProductFormModal({
  mode,
  form,
  options,
  saving,
  error,
  optionLoading,
  onClose,
  onSave,
  onChange,
}) {
  const isCreate = mode === "create";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-5">
      <div className="max-h-[94vh] w-[84vw] max-w-[1280px] overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950">
              {isCreate ? "Thêm sản phẩm" : "Cập nhật sản phẩm"}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {isCreate
                ? "Tạo sản phẩm mới kèm hồ sơ chứng chỉ để gửi duyệt."
                : "Chỉ cập nhật thông tin sản phẩm và hình ảnh. Không sửa chứng chỉ tại đây."}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-slate-100 p-5">
            <h3 className="mb-4 text-base font-extrabold text-slate-900">
              Thông tin sản phẩm
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Tên sản phẩm"
                value={form.name}
                onChange={(value) => onChange("name", value)}
                required
              />

              <FormSelect
                label="Danh mục"
                value={form.category_id}
                onChange={(value) => onChange("category_id", value)}
                required
              >
                <option value="">
                  {optionLoading ? "Đang tải..." : "Chọn danh mục"}
                </option>
                {options.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </FormSelect>

              <FormInput
                label="Giá bán"
                type="number"
                value={form.price}
                onChange={(value) => onChange("price", value)}
                required
              />

              <FormInput
                label="Giá khuyến mãi"
                type="number"
                value={form.sale_price}
                onChange={(value) => onChange("sale_price", value)}
              />

                <FormSelect
                label="Đơn vị tính"
                value={form.unit}
                onChange={(value) => onChange("unit", value)}
                required
                >
                <option value="kg">kg</option>
                </FormSelect>

                <FileUploadInput
                label="Ảnh đại diện"
                value={form.thumbnail}
                type="product_thumbnail"
                accept="image/*"
                required
                onUploaded={(url) => onChange("thumbnail", url)}
                />

              <div className="col-span-2">
                <FormTextarea
                  label="Mô tả"
                  value={form.description}
                  onChange={(value) => onChange("description", value)}
                />
              </div>

              <div className="col-span-2">
                <MultiImageUploadInput
                label="Ảnh chi tiết"
                value={form.detail_images_text}
                onChange={(value) => onChange("detail_images_text", value)}
                />
              </div>

              <label className="col-span-2 flex items-center gap-2 text-sm font-bold text-slate-600">
                <input
                  type="checkbox"
                  checked={Boolean(form.is_hot)}
                  onChange={(e) => onChange("is_hot", e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-green-600"
                />
                Đánh dấu sản phẩm nổi bật
              </label>
            </div>
          </div>

          {isCreate && (
            <div className="rounded-2xl border border-slate-100 p-5">
              <h3 className="mb-4 text-base font-extrabold text-slate-900">
                Thông tin chứng chỉ
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  label="Loại chứng chỉ"
                  value={form.certification_id}
                  onChange={(value) => onChange("certification_id", value)}
                  required
                >
                  <option value="">
                    {optionLoading ? "Đang tải..." : "Chọn chứng chỉ"}
                  </option>
                  {options.certifications.map((certification) => (
                    <option key={certification.id} value={certification.id}>
                      {certification.name}
                    </option>
                  ))}
                </FormSelect>

                <FormInput
                  label="Số chứng chỉ"
                  value={form.certificate_number}
                  onChange={(value) => onChange("certificate_number", value)}
                  required
                />

                <FileUploadInput
                label="File chứng chỉ"
                value={form.certificate_file}
                type="certificate_file"
                accept="image/*,.pdf"
                required
                onUploaded={(url) => onChange("certificate_file", url)}
                />

                <FormInput
                  label="Ngày cấp"
                  type="date"
                  value={form.issued_date}
                  onChange={(value) => onChange("issued_date", value)}
                  required
                />

                <FormInput
                  label="Ngày hết hạn"
                  type="date"
                  value={form.expiry_date}
                  onChange={(value) => onChange("expiry_date", value)}
                  required
                />
              </div>
            </div>
          )}

          {!isCreate && (
            <div className="rounded-2xl border border-orange-100 bg-orange-50 px-5 py-4 text-sm font-bold text-orange-700">
              Chứng chỉ không được sửa trong form cập nhật sản phẩm. Muốn cập
              nhật hồ sơ chứng chỉ, vui lòng vào chi tiết sản phẩm và bấm Gia
              hạn.
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
          <button
            onClick={onClose}
            className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-extrabold text-slate-600 hover:bg-slate-50"
          >
            Hủy
          </button>

          <button
            onClick={onSave}
            disabled={saving}
            className="flex h-11 items-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-extrabold text-white hover:bg-green-700 disabled:opacity-60"
          >
            <Save size={18} />
            {saving ? "Đang lưu..." : "Lưu sản phẩm"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductDetailModal({ product, loading, getImageUrl, onClose, onRenew }) {
  const currentCertificate =
    product?.current_certificate || product?.approved_certificate;

  const expiredCertificate = product?.expired_certificate;
  const pendingCertificate = product?.pending_certificate;

  const renewableCertificate =
    product?.renewable_certificate || currentCertificate || expiredCertificate;

  const certificates = product?.certificates || [];

  const canRenew =
    [1, 3].includes(Number(product?.status)) &&
    renewableCertificate &&
    !pendingCertificate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-5">
      <div className="max-h-[94vh] w-[84vw] max-w-[1280px] overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950">
              Chi tiết sản phẩm
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Xem thông tin sản phẩm, hình ảnh và lịch sử chứng chỉ.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={22} />
          </button>
        </div>

        {loading && (
          <div className="flex h-[360px] items-center justify-center">
            <p className="font-bold text-slate-400">Đang tải chi tiết...</p>
          </div>
        )}

        {!loading && product && (
          <div className="space-y-5 p-6">
            <div className="grid grid-cols-[260px_1fr] gap-5">
              <div className="rounded-2xl border border-slate-100 p-4">
                <img
                  src={getImageUrl(product.thumbnail)}
                  alt={product.name}
                  className="h-56 w-full rounded-xl object-cover"
                />

                <div className="mt-4 grid grid-cols-4 gap-2">
                  {(product.images || []).slice(0, 4).map((image) => (
                    <img
                      key={image.id}
                      src={getImageUrl(image.image_url)}
                      alt={product.name}
                      className="h-14 w-full rounded-lg object-cover"
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-950">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-400">
                      {product.code} · {product.category_name}
                    </p>
                  </div>

                  <StatusBadge statusClass={product.status_class}>
                    {product.status_text}
                  </StatusBadge>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <InfoBox label="Giá bán" value={product.price_text} />
                  <InfoBox
                    label="Giá khuyến mãi"
                    value={product.sale_price_text || "Không có"}
                  />
                  <InfoBox
                    label="Tồn kho"
                    value={`${product.stock_quantity} ${product.unit}`}
                  />
                </div>

                <div className="mt-4">
                  <p className="mb-1 text-sm font-extrabold text-slate-600">
                    Mô tả
                  </p>
                  <p className="text-sm font-medium leading-6 text-slate-500">
                    {product.description || "Chưa có mô tả."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-950">
                    Thông tin chứng chỉ
                  </h3>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Mỗi sản phẩm chỉ dùng một loại chứng chỉ. Chỉ được gia hạn,
                    không được sửa hoặc đổi loại chứng chỉ.
                  </p>
                </div>

                <button
                  disabled={!canRenew}
                  onClick={onRenew}
                  className="flex h-10 items-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RefreshCcw size={17} />
                  Gia hạn
                </button>
              </div>

{currentCertificate && (
  <div className="mb-4 rounded-xl bg-green-50 p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="font-extrabold text-green-700">
          Chứng chỉ đang sử dụng
        </p>

        <p className="mt-1 text-sm font-bold text-slate-700">
          {currentCertificate.certification_name} · Mã:{" "}
          {currentCertificate.certificate_number}
        </p>

        <p className="mt-1 text-sm font-medium text-slate-500">
          Hết hạn: {currentCertificate.expiry_date}
        </p>
      </div>

      <StatusBadge statusClass="active">
        {currentCertificate.status_text}
      </StatusBadge>
    </div>
  </div>
)}

{!currentCertificate && expiredCertificate && (
  <div className="mb-4 rounded-xl bg-red-50 p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="font-extrabold text-red-700">
          Chứng chỉ đã hết hạn
        </p>

        <p className="mt-1 text-sm font-bold text-slate-700">
          {expiredCertificate.certification_name} · Mã:{" "}
          {expiredCertificate.certificate_number}
        </p>

        <p className="mt-1 text-sm font-medium text-slate-500">
          Hết hạn: {expiredCertificate.expiry_date}
        </p>
      </div>

      <StatusBadge statusClass="danger">
        Hết hạn
      </StatusBadge>
    </div>
  </div>
)}

{!currentCertificate && !expiredCertificate && (
  <div className="mb-4 rounded-xl bg-orange-50 p-4 text-sm font-bold text-orange-700">
    Sản phẩm chưa có chứng chỉ đã duyệt.
  </div>
)}
              
              {pendingCertificate && (
                <div className="mb-4 rounded-xl bg-orange-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-orange-700">
                        Đang có hồ sơ gia hạn chờ duyệt
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-700">
                        Mã: {pendingCertificate.certificate_number}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        Hết hạn mới: {pendingCertificate.expiry_date}
                      </p>
                    </div>

                    <StatusBadge statusClass="pending">
                      {pendingCertificate.status_text}
                    </StatusBadge>
                  </div>
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs text-slate-500">
                      <th className="px-3 py-3 font-extrabold">Loại</th>
                      <th className="px-3 py-3 font-extrabold">Mã chứng chỉ</th>
                      <th className="px-3 py-3 font-extrabold">Ngày cấp</th>
                      <th className="px-3 py-3 font-extrabold">Ngày hết hạn</th>
                      <th className="px-3 py-3 font-extrabold">Trạng thái</th>
                      <th className="px-3 py-3 font-extrabold">File</th>
                    </tr>
                  </thead>

                  <tbody>
                    {certificates.map((certificate) => (
                      <tr
                        key={certificate.id}
                        className="border-t border-slate-100"
                      >
                        <td className="px-3 py-3 font-bold text-slate-700">
                          {certificate.certification_name}
                        </td>
                        <td className="px-3 py-3 font-bold text-slate-700">
                          {certificate.certificate_number}
                        </td>
                        <td className="px-3 py-3 font-semibold text-slate-500">
                          {certificate.issued_date}
                        </td>
                        <td className="px-3 py-3 font-semibold text-slate-500">
                          {certificate.expiry_date}
                        </td>
                        <td className="px-3 py-3">
<CertificateBadge statusClass={certificate.status_class}>
  {certificate.status_text}
</CertificateBadge>
                        </td>
                        <td className="px-3 py-3">
                          <a
                            href={certificate.certificate_file}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-extrabold text-green-700"
                          >
                            <FileText size={15} />
                            Xem file
                          </a>
                        </td>
                      </tr>
                    ))}

                    {certificates.length === 0 && (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-3 py-8 text-center font-bold text-slate-400"
                        >
                          Chưa có chứng chỉ.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!canRenew && (
                <p className="mt-3 text-sm font-semibold text-slate-400">
                  Chỉ có thể gia hạn khi sản phẩm đã được duyệt, đã từng có chứng chỉ và không có hồ sơ gia hạn đang chờ duyệt.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function MultiImageUploadInput({ label, value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const urls = value
    ? value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const handleChange = async (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const uploadedUrls = [];

      for (const file of files) {
        const res = await uploadService.uploadFile(file, "product_detail");
        uploadedUrls.push(res.data.url);
      }

      onChange([...urls, ...uploadedUrls].join("\n"));
    } catch (err) {
      setError(
        err?.message ||
          err?.error ||
          Object.values(err?.errors || {})?.[0]?.[0] ||
          "Upload ảnh chi tiết thất bại."
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeUrl = (url) => {
    onChange(urls.filter((item) => item !== url).join("\n"));
  };

  return (
    <div>
      <span className="mb-1 block text-sm font-extrabold text-slate-600">
        {label}
      </span>

      <div className="rounded-xl border border-slate-200 p-3">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleChange}
          disabled={uploading}
          className="block w-full text-sm font-semibold text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-green-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-green-700 hover:file:bg-green-100"
        />

        {uploading && (
          <p className="mt-2 text-sm font-bold text-green-700">
            Đang upload ảnh...
          </p>
        )}

        {error && (
          <p className="mt-2 text-sm font-bold text-red-500">{error}</p>
        )}

        {urls.length > 0 && (
          <div className="mt-3 grid grid-cols-5 gap-3">
            {urls.map((url) => (
              <div key={url} className="relative">
                <img
                  src={url}
                  alt="Ảnh chi tiết"
                  className="h-20 w-full rounded-lg object-cover"
                />

                <button
                  type="button"
                  onClick={() => removeUrl(url)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
function RenewCertificateModal({
  product,
  form,
  saving,
  error,
  onClose,
  onChange,
  onSubmit,
}) {
const currentCertificate =
  product?.current_certificate || product?.approved_certificate;

const expiredCertificate = product?.expired_certificate;

const renewableCertificate =
  product?.renewable_certificate || currentCertificate || expiredCertificate;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-5">
      <div className="w-full max-w-[560px] rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950">
              Gia hạn chứng chỉ
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Loại chứng chỉ giữ nguyên:{" "}
              <b>{renewableCertificate?.certification_name || "Chưa có"}</b>
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {error}
            </div>
          )}

          <FormInput
            label="Mã chứng chỉ mới"
            value={form.certificate_number}
            onChange={(value) => onChange("certificate_number", value)}
            required
          />

            <FileUploadInput
            label="File chứng chỉ"
            value={form.certificate_file}
            type="certificate_file"
            accept="image/*,.pdf"
            required
            onUploaded={(url) => onChange("certificate_file", url)}
            />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Ngày cấp"
              type="date"
              value={form.issued_date}
              onChange={(value) => onChange("issued_date", value)}
              required
            />

            <FormInput
              label="Ngày hết hạn"
              type="date"
              value={form.expiry_date}
              onChange={(value) => onChange("expiry_date", value)}
              required
            />
          </div>

          <div className="rounded-xl bg-orange-50 px-4 py-3 text-sm font-bold text-orange-700">
            Không được đổi loại chứng chỉ. Muốn đổi loại chứng chỉ phải tạo sản
            phẩm mới.
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            onClick={onClose}
            className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-extrabold text-slate-600 hover:bg-slate-50"
          >
            Hủy
          </button>

          <button
            onClick={onSubmit}
            disabled={saving}
            className="flex h-11 items-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-extrabold text-white hover:bg-green-700 disabled:opacity-60"
          >
            <Save size={18} />
            {saving ? "Đang gửi..." : "Gửi gia hạn"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductStatCard({ icon, iconClass, title, value, sub }) {
  return (
    <div className="flex min-h-[104px] items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${iconClass}`}
      >
        {icon}
      </div>

      <div>
        <p className="text-sm font-bold text-slate-500">{title}</p>
        <h2 className="mt-1 text-2xl font-extrabold text-slate-950">
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
    danger: "bg-red-50 text-red-600",
    hidden: "bg-purple-50 text-purple-600",
  };

  return (
    <span
      className={`inline-flex min-w-[82px] justify-center rounded-lg px-2.5 py-1.5 text-xs font-extrabold ${
        classMap[statusClass] || classMap.pending
      }`}
    >
      {children}
    </span>
  );
}

function CertificateBadge({ statusClass, children }) {
  const classMap = {
    active: "bg-green-50 text-green-700",
    pending: "bg-orange-50 text-orange-600",
    danger: "bg-red-50 text-red-600",
    hidden: "bg-slate-100 text-slate-500",
  };

  return (
    <span
      className={`inline-flex min-w-[82px] justify-center rounded-lg px-2.5 py-1.5 text-xs font-extrabold ${
        classMap[statusClass] || classMap.pending
      }`}
    >
      {children}
    </span>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-extrabold text-slate-400">{label}</p>
      <p className="mt-1 text-base font-extrabold text-slate-900">{value}</p>
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
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-extrabold text-slate-600">
        {label} {required && <b className="text-red-500">*</b>}
      </span>
      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-green-500"
      />
    </label>
  );
}

function FormSelect({ label, value, onChange, required = false, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-extrabold text-slate-600">
        {label} {required && <b className="text-red-500">*</b>}
      </span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-green-500"
      >
        {children}
      </select>
    </label>
  );
}

function FormTextarea({
  label,
  value,
  onChange,
  placeholder = "",
  rows = 4,
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-extrabold text-slate-600">
        {label}
      </span>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:border-green-500"
      />
    </label>
  );
}
function FileUploadInput({
  label,
  value,
  type,
  accept = "image/*",
  required = false,
  onUploaded,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const isImage = value && !value.toLowerCase().endsWith(".pdf");

  const handleChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const res = await uploadService.uploadFile(file, type);
      onUploaded(res.data.url);
    } catch (err) {
      setError(
        err?.message ||
          err?.error ||
          Object.values(err?.errors || {})?.[0]?.[0] ||
          "Upload file thất bại."
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-extrabold text-slate-600">
        {label} {required && <b className="text-red-500">*</b>}
      </span>

      <div className="rounded-xl border border-slate-200 p-3">
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={uploading}
          className="block w-full text-sm font-semibold text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-green-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-green-700 hover:file:bg-green-100"
        />

        {uploading && (
          <p className="mt-2 text-sm font-bold text-green-700">
            Đang upload...
          </p>
        )}

        {error && (
          <p className="mt-2 text-sm font-bold text-red-500">{error}</p>
        )}

        {value && (
          <div className="mt-3">
            {isImage ? (
              <img
                src={value}
                alt={label}
                className="h-24 w-24 rounded-lg object-cover"
              />
            ) : (
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-extrabold text-green-700"
              >
                Xem file đã upload
              </a>
            )}


          </div>
        )}
      </div>
    </label>
  );
  
}
export default SellerProducts;