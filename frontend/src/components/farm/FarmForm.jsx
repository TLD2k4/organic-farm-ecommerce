import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import UploadImage from "@/components/upload/UploadImage";

const emptyForm = {
  name: "",
  phone: "",
  address: "",
  description: "",
  logo: null,
  cover_image: null,
};

const inputClassName = `
  w-full
  rounded-xl
  border
  border-slate-200
  bg-white
  px-4
  py-3
  outline-none
  transition
  focus:border-green-500
  focus:ring-2
  focus:ring-green-100
  disabled:cursor-not-allowed
  disabled:bg-slate-100
`;

export default function FarmForm({
  initialValues,
  onSubmit,
  loading = false,
  disabled = false,
  submitLabel = "Lưu thông tin",
}) {
  const [form, setForm] = useState(emptyForm);

  const [errors, setErrors] = useState({});

  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    setForm({
      ...emptyForm,
      ...(initialValues || {}),
    });

    setErrors({});
  }, [initialValues]);

  const uploading = uploadingLogo || uploadingCover;

  const formDisabled = loading || uploading || disabled;

  const clearError = (field) => {
    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    clearError(name);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setErrors({
        name: ["Tên nông trại không được để trống."],
      });

      return;
    }

    if (!form.address.trim()) {
      setErrors({
        address: ["Địa chỉ không được để trống."],
      });

      return;
    }

    if (uploading) {
      toast.error("Vui lòng chờ upload ảnh hoàn tất.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim(),
      description: form.description.trim() || null,
      logo: form.logo || null,
      cover_image: form.cover_image || null,
    };

    setErrors({});

    try {
      const response = await onSubmit(payload);

      toast.success(response?.message || "Lưu thông tin nông trại thành công.");
    } catch (error) {
      if (error?.errors) {
        setErrors(error.errors);
      } else {
        toast.error(error?.message || "Không thể lưu thông tin nông trại.");
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block font-semibold">Logo nông trại</label>

          <UploadImage
            value={form.logo}
            uploadType="farm_logo"
            onUploadingChange={setUploadingLogo}
            onChange={(url) => {
              setForm((previous) => ({
                ...previous,
                logo: url,
              }));

              clearError("logo");
            }}
          />

          {errors.logo && (
            <p className="mt-1 text-sm text-red-600">{errors.logo[0]}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block font-semibold">Ảnh bìa nông trại</label>

          <UploadImage
            value={form.cover_image}
            uploadType="farm_cover"
            onUploadingChange={setUploadingCover}
            onChange={(url) => {
              setForm((previous) => ({
                ...previous,
                cover_image: url,
              }));

              clearError("cover_image");
            }}
          />

          {errors.cover_image && (
            <p className="mt-1 text-sm text-red-600">{errors.cover_image[0]}</p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-2 block font-semibold">Tên nông trại</label>

        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          disabled={formDisabled}
          placeholder="Ví dụ: Nông trại Xanh Đà Lạt"
          className={inputClassName}
        />

        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block font-semibold">Số điện thoại</label>

          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            disabled={formDisabled}
            placeholder="Ví dụ: 0901234567"
            className={inputClassName}
          />

          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone[0]}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block font-semibold">Địa chỉ</label>

          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            disabled={formDisabled}
            placeholder="Nhập địa chỉ nông trại"
            className={inputClassName}
          />

          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address[0]}</p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-2 block font-semibold">Mô tả</label>

        <textarea
          name="description"
          rows={6}
          value={form.description}
          onChange={handleChange}
          disabled={formDisabled}
          placeholder="Giới thiệu về nông trại..."
          className={`${inputClassName} resize-y`}
        />

        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description[0]}</p>
        )}
      </div>

      {!disabled && (
        <button
          type="submit"
          disabled={formDisabled}
          className="
            flex
            min-h-12
            w-full
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-green-600
            px-5
            py-3
            font-bold
            text-white
            transition
            hover:bg-green-700
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          {(loading || uploading) && (
            <Loader2 size={19} className="animate-spin" />
          )}

          {uploading
            ? "Đang upload ảnh..."
            : loading
              ? "Đang xử lý..."
              : submitLabel}
        </button>
      )}
    </form>
  );
}
