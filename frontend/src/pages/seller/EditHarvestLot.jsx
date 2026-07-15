import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ClipboardList,
  Loader2,
  Package,
  Save,
  ShoppingBag,
  Warehouse,
} from "lucide-react";

import harvestLotService from "../../services/harvestLotService";
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

function EditHarvestLot() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    harvest_date: "",
    expiry_date: "",
    quantity_imported: "",
    status: 1,
    note: "",
  });

  const [lot, setLot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchDetail = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await harvestLotService.getHarvestLotDetail(id);

        const data = response.data;

        if (cancelled) {
          return;
        }

        setLot(data);

        setForm({
          harvest_date: data.harvest_date || "",
          expiry_date: data.expiry_date || "",
          quantity_imported: data.quantity_imported ?? "",
          status: data.status ?? 1,
          note: data.note || "",
        });
      } catch (fetchError) {
        if (!cancelled) {
          setError(
            getErrorMessage(fetchError, "Không thể tải chi tiết lô sản phẩm."),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDetail();

    return () => {
      cancelled = true;
    };
  }, [id]);

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
        harvest_date: form.harvest_date,
        expiry_date: form.expiry_date,
        quantity_imported: Number(form.quantity_imported),
        status: Number(form.status),
        note: form.note.trim() || null,
      };

      await harvestLotService.updateHarvestLot(id, payload);

      toast.success("Cập nhật lô sản phẩm thành công.");
      navigate("/seller/harvest-lots");
    } catch (submitError) {
      const message = getErrorMessage(
        submitError,
        "Cập nhật lô sản phẩm thất bại.",
      );

      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <EditHarvestLotSkeleton />;
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-5">
      <header>
        <button
          type="button"
          onClick={() => navigate("/seller/harvest-lots")}
          className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-green-700"
        >
          <ArrowLeft size={18} />
          Quay lại danh sách
        </button>

        <h1 className="text-xl font-extrabold text-slate-950 sm:text-2xl">
          Cập nhật lô sản phẩm
        </h1>

        <p className="mt-1 text-sm font-medium text-slate-500">
          Chỉnh sửa ngày thu hoạch, số lượng và trạng thái của lô.
        </p>
      </header>

      {error && (
        <div className="break-words rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {lot && (
        <section className="rounded-2xl border border-green-100 bg-green-50/70 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2 text-green-700">
            <ClipboardList size={21} />

            <h2 className="font-extrabold">Thông tin lô hiện tại</h2>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
            <LotInformation
              icon={<ClipboardList size={18} />}
              label="Mã lô"
              value={lot.lot_code || "Không có"}
            />

            <LotInformation
              icon={<Package size={18} />}
              label="Sản phẩm"
              value={lot.product?.name || "Không có"}
            />

            <LotInformation
              icon={<ShoppingBag size={18} />}
              label="Đã bán"
              value={Number(lot.quantity_sold || 0).toLocaleString("vi-VN")}
            />

            <LotInformation
              icon={<Warehouse size={18} />}
              label="Còn lại"
              value={Number(lot.quantity_remaining || 0).toLocaleString(
                "vi-VN",
              )}
            />
          </div>
        </section>
      )}

      <form
        onSubmit={handleSubmit}
        className="min-w-0 overflow-clip rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="p-4 sm:p-6">
          <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2">
            <FormField label="Ngày thu hoạch" required>
              <input
                type="date"
                name="harvest_date"
                value={form.harvest_date}
                onChange={handleChange}
                max={form.expiry_date || undefined}
                disabled={Number(lot?.quantity_sold || 0) > 0}
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
                disabled={Number(lot?.quantity_sold || 0) > 0}
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
                min="1"
                step="0.01"
                disabled={Number(lot?.quantity_sold || 0) > 0}
                required
                className={inputClass}
              />

              {Number(lot?.quantity_sold || 0) > 0 && (
                <p className="mt-2 text-xs font-medium text-orange-600">
                  Lô đã phát sinh đơn hàng nên ngày thu hoạch, hạn sử dụng và
                  số lượng nhập đã được khóa.
                </p>
              )}
            </FormField>

            <FormField label="Trạng thái" required>
              <ResponsiveSelect
                value={form.status}
                onChange={(value) => {
                  setForm((currentForm) => ({
                    ...currentForm,
                    status: value,
                  }));
                  if (error) setError("");
                }}
                options={[
                  { value: 1, label: "Đang bán" },
                  { value: 2, label: "Tạm ẩn" },
                ]}
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
                placeholder="Nhập ghi chú cho lô sản phẩm..."
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
              disabled:opacity-60
              sm:w-auto
            "
          >
            Hủy
          </button>

          <button
            type="submit"
            disabled={submitting}
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
                Đang lưu...
              </>
            ) : (
              <>
                <Save size={19} />
                Lưu thay đổi
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

function LotInformation({ icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl bg-white p-3">
      <div className="mt-0.5 shrink-0 text-green-700">{icon}</div>

      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-extrabold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function EditHarvestLotSkeleton() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl animate-pulse space-y-5 overflow-hidden">
      <div className="h-20 rounded-2xl bg-slate-200" />
      <div className="h-40 rounded-2xl bg-slate-200" />
      <div className="h-96 rounded-2xl bg-slate-200" />
    </div>
  );
}

export default EditHarvestLot;
