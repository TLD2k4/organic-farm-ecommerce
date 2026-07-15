import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Loader2,
  PackagePlus,
  Save,
  Warehouse,
} from "lucide-react";

import harvestLotService from "../../services/harvestLotService";
import productService from "../../services/productService";
import ResponsiveSelect from "../../components/common/ResponsiveSelect";

const inputClass = `
  h-12
  w-full
  max-w-full
  min-w-0
  rounded-xl
  border
  border-slate-200
  bg-white
  px-4
  text-sm
  font-semibold
  text-slate-800
  outline-none
  transition
  placeholder:text-slate-400
  focus:border-green-600
  focus:ring-4
  focus:ring-green-100
  disabled:cursor-not-allowed
  disabled:bg-slate-100
`;

function getErrorMessage(error, fallback) {
  if (error?.errors) {
    const firstKey = Object.keys(error.errors)[0];
    return error.errors[firstKey]?.[0] || fallback;
  }

  return error?.error || error?.message || fallback;
}

function CreateHarvestLot() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);

  const [form, setForm] = useState({
    product_id: "",
    lot_code: "",
    harvest_date: "",
    expiry_date: "",
    quantity_imported: "",
    note: "",
  });

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedProduct = useMemo(() => {
    return (
      products.find(
        (product) => String(product.id) === String(form.product_id),
      ) || null
    );
  }, [products, form.product_id]);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setLoadingProducts(true);
      setError("");

      try {
        const response = await productService.getProductsForHarvestLot();

        if (!cancelled) {
          setProducts(response.data || []);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(
            getErrorMessage(fetchError, "Không thể tải danh sách sản phẩm."),
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const payload = {
        product_id: Number(form.product_id),
        lot_code: form.lot_code.trim(),
        harvest_date: form.harvest_date,
        expiry_date: form.expiry_date,
        quantity_imported: Number(form.quantity_imported),
        note: form.note.trim() || null,
      };

      await harvestLotService.createHarvestLot(payload);

      toast.success("Tạo lô sản phẩm thành công.");
      navigate("/seller/harvest-lots");
    } catch (submitError) {
      const message = getErrorMessage(submitError, "Tạo lô sản phẩm thất bại.");

      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-5">
      {/* HEADER */}
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => navigate("/seller/harvest-lots")}
            className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-green-700"
          >
            <ArrowLeft size={18} />
            Quay lại danh sách
          </button>

          <h1 className="text-xl font-extrabold text-slate-950 sm:text-2xl">
            Thêm lô sản phẩm
          </h1>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Nhập thông tin lô thu hoạch mới cho sản phẩm.
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">
          <PackagePlus size={25} />
        </div>
      </header>

      {error && (
        <div className="wrap-break-word rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="min-w-0 overflow-clip rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="border-b border-slate-100 p-4 sm:p-6">
          <h2 className="font-extrabold text-slate-900">Thông tin sản phẩm</h2>

          <p className="mt-1 text-sm text-slate-500">
            Chọn sản phẩm cần nhập thêm lô thu hoạch.
          </p>

          <div className="mt-5">
            <label
              htmlFor="product_id"
              className="mb-2 block text-sm font-bold text-slate-700"
            >
              Sản phẩm <span className="text-red-500">*</span>
            </label>

            <ResponsiveSelect
              value={form.product_id}
              onChange={(value) => {
                setForm((currentForm) => ({
                  ...currentForm,
                  product_id: value,
                }));
                if (error) setError("");
              }}
              disabled={loadingProducts}
              placeholder={
                loadingProducts ? "Đang tải sản phẩm..." : "Chọn sản phẩm"
              }
              options={products.map((product) => ({
                value: product.id,
                label: product.name,
              }))}
            />
          </div>

          {selectedProduct && (
            <div className="mt-5 rounded-2xl border border-green-100 bg-green-50/70 p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2 text-green-700">
                <BadgeCheck size={20} />

                <p className="font-extrabold">Thông tin sản phẩm đã chọn</p>
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                <ProductInformation
                  icon={<PackagePlus size={18} />}
                  label="Đơn vị tính"
                  value={selectedProduct.unit || "Chưa cập nhật"}
                />

                <ProductInformation
                  icon={<Warehouse size={18} />}
                  label="Tồn kho hiện tại"
                  value={`${Number(
                    selectedProduct.stock_quantity || 0,
                  ).toLocaleString("vi-VN")} ${selectedProduct.unit || ""}`}
                />

                <ProductInformation
                  icon={<BadgeCheck size={18} />}
                  label="Chứng chỉ"
                  value={
                    selectedProduct.certificate
                      ? `${
                          selectedProduct.certificate.certification_name || ""
                        } - ${
                          selectedProduct.certificate.certificate_number || ""
                        }`
                      : "Chưa có chứng chỉ"
                  }
                />

                <ProductInformation
                  icon={<CalendarDays size={18} />}
                  label="Hạn chứng chỉ"
                  value={
                    selectedProduct.certificate?.expiry_date || "Chưa cập nhật"
                  }
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6">
          <h2 className="font-extrabold text-slate-900">
            Thông tin lô thu hoạch
          </h2>

          <div className="mt-5 grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2">
            <FormField label="Mã lô" required>
              <input
                type="text"
                name="lot_code"
                value={form.lot_code}
                onChange={handleChange}
                placeholder="Ví dụ: LO001"
                required
                className={inputClass}
              />
            </FormField>

            <FormField label="Số lượng nhập" required>
              <input
                type="number"
                name="quantity_imported"
                value={form.quantity_imported}
                onChange={handleChange}
                placeholder="Ví dụ: 100"
                min="1"
                step="0.01"
                required
                className={inputClass}
              />
            </FormField>

            <FormField label="Ngày thu hoạch" required>
              <input
                type="date"
                name="harvest_date"
                value={form.harvest_date}
                onChange={handleChange}
                max={form.expiry_date || undefined}
                required
                className={inputClass}
              />
            </FormField>

            <FormField label="Hạn sử dụng" required>
              <input
                type="date"
                name="expiry_date"
                value={form.expiry_date}
                onChange={handleChange}
                min={form.harvest_date || undefined}
                required
                className={inputClass}
              />
            </FormField>

            <div className="min-w-0 md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Ghi chú
              </label>

              <textarea
                name="note"
                value={form.note}
                onChange={handleChange}
                placeholder="Nhập ghi chú cho lô hàng..."
                rows={4}
                className="
                  w-full
                  max-w-full
                  min-w-0
                  resize-y
                  rounded-xl
                  border
                  border-slate-200
                  px-4
                  py-3
                  text-sm
                  font-medium
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-green-600
                  focus:ring-4
                  focus:ring-green-100
                "
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row sm:justify-end sm:p-6">
          <button
            type="button"
            onClick={() => navigate("/seller/harvest-lots")}
            disabled={submitting}
            className="
              inline-flex
              h-12
              w-full
              items-center
              justify-center
              rounded-xl
              border
              border-slate-200
              bg-white
              px-5
              font-bold
              text-slate-700
              transition
              hover:bg-slate-100
              disabled:cursor-not-allowed
              disabled:opacity-60
              sm:w-auto
            "
          >
            Hủy
          </button>

          <button
            type="submit"
            disabled={submitting || loadingProducts}
            className="
              inline-flex
              h-12
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-green-600
              px-6
              font-extrabold
              text-white
              transition
              hover:bg-green-700
              disabled:cursor-not-allowed
              disabled:opacity-60
              sm:w-auto
            "
          >
            {submitting ? (
              <>
                <Loader2 size={19} className="animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <Save size={19} />
                Tạo lô
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, required = false, children }) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}
    </div>
  );
}

function ProductInformation({ icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl bg-white p-3">
      <div className="mt-0.5 shrink-0 text-green-700">{icon}</div>

      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 wrap-break-word text-sm font-bold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

export default CreateHarvestLot;
