import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  BadgeCheck,
  Camera,
  FileText,
  ImagePlus,
  Loader2,
  MapPin,
  Phone,
  Save,
  Store,
  Upload,
} from "lucide-react";
import sellerFarmSettingService from "../../services/sellerFarmSettingService";

const EMPTY_FORM = {
  name: "",
  description: "",
  phone: "",
  address: "",
  logo: "",
  cover_image: "",
};

function getFarmFromPayload(payload) {
  return payload?.data?.farm || payload?.farm || payload?.data || payload;
}

function getStatusInfo(status) {
  const value = Number(status);

  if (value === 1) {
    return {
      label: "Đang hoạt động",
      className: "bg-green-50 text-green-700",
    };
  }

  if (value === 2) {
    return {
      label: "Bị từ chối",
      className: "bg-red-50 text-red-600",
    };
  }

  if (value === 3) {
    return {
      label: "Tạm khóa",
      className: "bg-orange-50 text-orange-600",
    };
  }

  return {
    label: "Chờ duyệt",
    className: "bg-slate-100 text-slate-600",
  };
}

export default function SellerSettings() {
  const [farm, setFarm] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);

  const loadFarm = async () => {
    try {
      setLoading(true);

      const payload = await sellerFarmSettingService.getMyFarm();
      const farmData = getFarmFromPayload(payload);

      setFarm(farmData);

      setForm({
        name: farmData?.name || "",
        description: farmData?.description || "",
        phone: farmData?.phone || "",
        address: farmData?.address || "",
        logo: farmData?.logo || "",
        cover_image: farmData?.cover_image || "",
      });
    } catch (error) {
      console.log("LOAD FARM SETTINGS ERROR:", error);
      toast.error(
        error?.response?.data?.message || "Không thể tải thông tin gian hàng"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarm();
  }, []);

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpload = async (field, file) => {
    if (!file) return;

    try {
      setUploadingField(field);

      const { url } = await sellerFarmSettingService.uploadImage(file);

      if (!url) {
        toast.error("Upload thành công nhưng không nhận được đường dẫn ảnh");
        return;
      }

      updateForm(field, url);

      toast.success(
        field === "logo" ? "Upload logo thành công" : "Upload ảnh bìa thành công"
      );
    } catch (error) {
      console.log("UPLOAD FARM IMAGE ERROR:", error);
      toast.error(error?.response?.data?.message || "Upload ảnh thất bại");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!farm?.id) {
      toast.error("Không tìm thấy gian hàng để cập nhật");
      return;
    }

    try {
      setSaving(true);

      const payload = await sellerFarmSettingService.updateFarm(farm.id, {
        name: form.name,
        description: form.description,
        phone: form.phone,
        address: form.address,
        logo: form.logo,
        cover_image: form.cover_image,
      });

      const updatedFarm = getFarmFromPayload(payload);

      setFarm(updatedFarm);

      toast.success(payload?.message || "Cập nhật gian hàng thành công");
    } catch (error) {
      console.log("UPDATE FARM SETTINGS ERROR:", error);

      const errors = error?.response?.data?.errors;

      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        toast.error(firstError || "Dữ liệu gian hàng không hợp lệ");
      } else {
        toast.error(
          error?.response?.data?.message || "Không thể cập nhật gian hàng"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SellerSettingsSkeleton />;
  }

  const statusInfo = getStatusInfo(farm?.status);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-950">
              Cài đặt gian hàng
            </h1>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Cập nhật thông tin nông trại hiển thị với khách hàng.
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${statusInfo.className}`}
          >
            <BadgeCheck size={17} />
            {statusInfo.label}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="relative h-64 bg-green-50">
            {form.cover_image ? (
              <img
                src={form.cover_image}
                alt="Ảnh bìa gian hàng"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-green-700">
                <div className="text-center">
                  <ImagePlus size={48} className="mx-auto" />
                  <p className="mt-2 text-sm font-bold">Chưa có ảnh bìa</p>
                </div>
              </div>
            )}

            <label className="absolute bottom-4 right-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-md hover:bg-slate-50">
              {uploadingField === "cover_image" ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Upload size={17} />
              )}
              Đổi ảnh bìa

              <input
                type="file"
                accept="image/*"
                disabled={uploadingField === "cover_image"}
                onChange={(e) =>
                  handleUpload("cover_image", e.target.files?.[0])
                }
                className="hidden"
              />
            </label>
          </div>

          <div className="relative px-6 pb-6">
            <div className="-mt-14 flex flex-wrap items-end gap-4">
              <div className="relative">
                <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-3xl border-4 border-white bg-green-50 shadow-md">
                  {form.logo ? (
                    <img
                      src={form.logo}
                      alt="Logo gian hàng"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Store size={42} className="text-green-700" />
                  )}
                </div>

                <label className="absolute -bottom-2 -right-2 grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-green-700 text-white shadow-md hover:bg-green-800">
                  {uploadingField === "logo" ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Camera size={18} />
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingField === "logo"}
                    onChange={(e) => handleUpload("logo", e.target.files?.[0])}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="pb-2">
                <h2 className="text-xl font-extrabold text-slate-950">
                  {form.name || "Tên gian hàng"}
                </h2>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  Thông tin này sẽ xuất hiện ở trang nông trại và sản phẩm.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-extrabold text-slate-950">
              Thông tin cơ bản
            </h3>

            <div className="space-y-5">
              <InputField
                icon={Store}
                label="Tên gian hàng / nông trại"
                value={form.name}
                onChange={(value) => updateForm("name", value)}
                placeholder="VD: Nông Trại Xanh Mekong"
                required
              />

              <TextareaField
                icon={FileText}
                label="Mô tả gian hàng"
                value={form.description}
                onChange={(value) => updateForm("description", value)}
                placeholder="Giới thiệu về nông trại, quy trình canh tác, sản phẩm nổi bật..."
              />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-extrabold text-slate-950">
              Liên hệ & địa chỉ
            </h3>

            <div className="space-y-5">
              <InputField
                icon={Phone}
                label="Số điện thoại"
                value={form.phone}
                onChange={(value) => updateForm("phone", value)}
                placeholder="VD: 0909123456"
              />

              <TextareaField
                icon={MapPin}
                label="Địa chỉ nông trại"
                value={form.address}
                onChange={(value) => updateForm("address", value)}
                placeholder="Nhập địa chỉ nông trại"
                rows={4}
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-4 z-10 flex justify-end">
          <button
            type="submit"
            disabled={saving || uploadingField}
            className="inline-flex items-center gap-2 rounded-2xl bg-green-700 px-6 py-3 text-sm font-extrabold text-white shadow-lg hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Lưu thay đổi
          </button>
        </div>
      </form>
    </div>
  );
}

function InputField({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-800">
        {label}
      </label>

      <div className="relative">
        <Icon
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-green-600"
        />
      </div>
    </div>
  );
}

function TextareaField({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  rows = 6,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-800">
        {label}
      </label>

      <div className="relative">
        <Icon size={18} className="absolute left-4 top-4 text-slate-400" />

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 pl-11 text-sm font-semibold outline-none transition focus:border-green-600"
        />
      </div>
    </div>
  );
}

function SellerSettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-7 w-56 rounded-lg bg-slate-200" />
          <div className="mt-3 h-4 w-80 rounded-lg bg-slate-200" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="h-64 animate-pulse bg-green-50" />

        <div className="px-6 pb-6">
          <div className="-mt-14 flex items-end gap-4">
            <div className="h-28 w-28 animate-pulse rounded-3xl border-4 border-white bg-slate-200" />

            <div className="pb-2">
              <div className="h-6 w-56 animate-pulse rounded-lg bg-slate-200" />
              <div className="mt-3 h-4 w-80 animate-pulse rounded-lg bg-slate-200" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="h-6 w-40 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-5 space-y-4">
            <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="h-6 w-40 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-5 space-y-4">
            <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}