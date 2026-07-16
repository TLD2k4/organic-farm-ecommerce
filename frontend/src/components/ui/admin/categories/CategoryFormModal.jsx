// src/components/ui/admin/categories/CategoryFormModal.jsx

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

import useCategory from "@/hooks/useCategory";
import UploadImage from "@/components/upload/UploadImage";
import ResponsiveSelect from "@/components/common/ResponsiveSelect";

const INITIAL_FORM = {
  parent_id: "",
  name: "",
  description: "",
  image: null,
  status: 1,
};

const STATUS_OPTIONS = [
  { value: 1, label: "Hiển thị" },
  { value: 0, label: "Ẩn" },
];

const BASE_FIELD_CLASS = `
  w-full rounded-xl border bg-white px-4 py-3 outline-none transition
  focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500
`;

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function firstError(errors, field) {
  const value = errors?.[field];
  return Array.isArray(value) ? value[0] : value;
}

function validateCategoryForm(form, categoryId) {
  const errors = {};
  const name = normalizeText(form.name);
  const description = String(form.description ?? "").trim();
  const image = form.image ? String(form.image).trim() : "";
  const status = Number(form.status);

  if (!name) {
    errors.name = ["Tên danh mục không được để trống."];
  } else if (name.length < 2) {
    errors.name = ["Tên danh mục phải có ít nhất 2 ký tự."];
  } else if (name.length > 50) {
    errors.name = ["Tên danh mục tối đa 50 ký tự."];
  }

  if (description.length > 1000) {
    errors.description = ["Mô tả tối đa 1000 ký tự."];
  }

  if (image && !isValidHttpUrl(image)) {
    errors.image = ["Ảnh không đúng định dạng URL."];
  } else if (image.length > 255) {
    errors.image = ["Đường dẫn ảnh tối đa 255 ký tự."];
  }

  if (![0, 1].includes(status)) {
    errors.status = ["Trạng thái chỉ được là 0 hoặc 1."];
  }

  if (
    form.parent_id !== "" &&
    form.parent_id !== null &&
    !Number.isInteger(Number(form.parent_id))
  ) {
    errors.parent_id = ["Danh mục cha không hợp lệ."];
  }

  if (categoryId && Number(form.parent_id) === Number(categoryId)) {
    errors.parent_id = ["Danh mục không thể chọn chính nó làm danh mục cha."];
  }

  return errors;
}

export default function CategoryFormModal({
  open,
  onClose,
  categoryId,
  onSuccess,
}) {
  const {
    category,
    categoryOptions,
    detailLoading,
    optionsLoading,
    create,
    update,
    adminGetById,
    getParentOptions,
  } = useCategory();

  useEffect(() => {
    if (!open) return;
    getParentOptions(categoryId);
    if (categoryId) adminGetById(categoryId);
  }, [open, categoryId, adminGetById, getParentOptions]);

  if (!open) return null;

  const isEditing = Boolean(categoryId);
  const correctCategoryLoaded =
    !isEditing || (category && Number(category.id) === Number(categoryId));
  const formReady = !isEditing || (!detailLoading && correctCategoryLoaded);

  const initialValues =
    isEditing && correctCategoryLoaded
      ? {
          parent_id: category.parent_id ?? "",
          name: category.name ?? "",
          description: category.description ?? "",
          image: category.image ?? null,
          status: Number(category.status ?? 1),
        }
      : INITIAL_FORM;

  const formKey = isEditing
    ? `category-${categoryId}-${category?.updated_at || category?.id || "loading"}`
    : "category-create";

  const parentOptions = [
    { value: "", label: "Không có — Danh mục gốc" },
    ...(Array.isArray(categoryOptions)
      ? categoryOptions.map((option) => ({
          value: option.id,
          label: option.name,
        }))
      : []),
  ];

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-form-title"
    >
      <div className="max-h-[calc(100dvh-24px)] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-2xl bg-white shadow-xl sm:max-h-[95vh]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-4 sm:p-5">
          <h2 id="category-form-title" className="text-lg font-bold sm:text-xl">
            {isEditing ? "Chỉnh sửa danh mục" : "Thêm danh mục"}
          </h2>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {!formReady ? (
          <div className="animate-pulse space-y-5 p-4 sm:p-5">
            <div className="h-12 rounded-xl bg-slate-200" />
            <div className="h-12 rounded-xl bg-slate-200" />
            <div className="h-40 rounded-xl bg-slate-200" />
          </div>
        ) : (
          <CategoryFormContent
            key={formKey}
            initialValues={initialValues}
            categoryId={categoryId}
            categorySlug={category?.slug}
            parentOptions={parentOptions}
            optionsLoading={optionsLoading}
            create={create}
            update={update}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        )}
      </div>
    </div>
  );
}

function CategoryFormContent({
  initialValues,
  categoryId,
  categorySlug,
  parentOptions,
  optionsLoading,
  create,
  update,
  onClose,
  onSuccess,
}) {
  const [form, setForm] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const disabled = loading || uploading || optionsLoading;

  const fieldClassName = (field) => `${BASE_FIELD_CLASS} ${
    firstError(errors, field)
      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
      : "border-slate-200 focus:border-green-500 focus:ring-green-100"
  }`;

  const clearFieldError = (field) => {
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    clearFieldError(name);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (uploading) {
      toast.error("Vui lòng đợi ảnh tải lên hoàn tất.");
      return;
    }

    const clientErrors = validateCategoryForm(form, categoryId);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      toast.error("Vui lòng kiểm tra lại thông tin danh mục.");
      return;
    }

    const payload = {
      parent_id:
        form.parent_id === "" || form.parent_id === null
          ? null
          : Number(form.parent_id),
      name: normalizeText(form.name),
      description: String(form.description ?? "").trim() || null,
      image: form.image ? String(form.image).trim() : null,
      status: Number(form.status),
    };

    try {
      setLoading(true);
      setErrors({});

      const response = categoryId
        ? await update(categoryId, payload)
        : await create(payload);

      toast.success(
        response?.message ||
          (categoryId
            ? "Cập nhật danh mục thành công."
            : "Tạo danh mục thành công."),
      );

      await onSuccess?.();
      onClose();
    } catch (error) {
      const errorData = error?.response?.data ?? error;
      if (errorData?.errors) {
        setErrors(errorData.errors);
        toast.error(errorData.message || "Vui lòng kiểm tra lại dữ liệu.");
      } else {
        toast.error(errorData?.message || errorData?.error || "Có lỗi xảy ra.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-5">
      <div>
        <label className="mb-2 block font-semibold">Danh mục cha</label>
        <ResponsiveSelect
          value={form.parent_id}
          options={parentOptions}
          disabled={optionsLoading}
          placeholder="Chọn danh mục cha"
          onChange={(value) => {
            setForm((previous) => ({ ...previous, parent_id: value }));
            clearFieldError("parent_id");
          }}
        />
        <p className="mt-1 text-xs text-slate-500">
          Để trống khi tạo danh mục gốc. Không được chọn chính danh mục đang sửa.
        </p>
        {firstError(errors, "parent_id") && (
          <p className="mt-1 text-sm text-red-600">{firstError(errors, "parent_id")}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block font-semibold">
          Tên danh mục <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          minLength={2}
          maxLength={50}
          required
          autoComplete="off"
          aria-invalid={Boolean(firstError(errors, "name"))}
          placeholder="Ví dụ: Rau Củ Hữu Cơ"
          className={fieldClassName("name")}
        />
        <div className="mt-1 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">
              Nhập từ 2 đến 50 ký tự. Slug được tự động tạo từ tên.
            </p>
            {firstError(errors, "name") && (
              <p className="mt-1 text-sm text-red-600">{firstError(errors, "name")}</p>
            )}
          </div>
          <span className="shrink-0 text-xs text-slate-400">{form.name.length}/50</span>
        </div>
      </div>

      {categoryId && categorySlug && (
        <div>
          <label className="mb-2 block font-semibold">Slug hiện tại</label>
          <input
            type="text"
            value={categorySlug}
            disabled
            title="Slug do hệ thống tự động tạo"
            className={BASE_FIELD_CLASS}
          />
        </div>
      )}

      <div>
        <label className="mb-2 block font-semibold">Ảnh danh mục</label>
        <UploadImage
          value={form.image}
          uploadType="category_image"
          onUploadingChange={setUploading}
          onChange={(url) => {
            setForm((previous) => ({ ...previous, image: url }));
            clearFieldError("image");
          }}
        />
        <p className="mt-1 text-xs text-slate-500">
          Ảnh không bắt buộc. URL ảnh tối đa 255 ký tự.
        </p>
        {firstError(errors, "image") && (
          <p className="mt-1 text-sm text-red-600">{firstError(errors, "image")}</p>
        )}
      </div>

      <div>
        <label className="mb-2 block font-semibold">Mô tả</label>
        <textarea
          name="description"
          rows={5}
          maxLength={1000}
          value={form.description}
          onChange={handleChange}
          aria-invalid={Boolean(firstError(errors, "description"))}
          placeholder="Ví dụ: Nhóm sản phẩm rau được canh tác theo phương pháp hữu cơ..."
          className={`${fieldClassName("description")} resize-y`}
        />
        <div className="mt-1 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Không bắt buộc. Tối đa 1000 ký tự.</p>
            {firstError(errors, "description") && (
              <p className="mt-1 text-sm text-red-600">{firstError(errors, "description")}</p>
            )}
          </div>
          <span className="shrink-0 text-xs text-slate-400">
            {form.description.length}/1000
          </span>
        </div>
      </div>

      <div>
        <label className="mb-2 block font-semibold">Trạng thái</label>
        <ResponsiveSelect
          value={form.status}
          options={STATUS_OPTIONS}
          onChange={(value) => {
            setForm((previous) => ({ ...previous, status: Number(value) }));
            clearFieldError("status");
          }}
        />
        <p className="mt-1 text-xs text-slate-500">
          Danh mục ẩn sẽ không xuất hiện ở trang khách hàng.
        </p>
        {firstError(errors, "status") && (
          <p className="mt-1 text-sm text-red-600">{firstError(errors, "status")}</p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={loading || uploading}
          className="w-full rounded-xl border border-slate-200 px-5 py-3 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={disabled}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {(loading || uploading) && <Loader2 size={18} className="animate-spin" />}
          {uploading
            ? "Đang tải ảnh..."
            : loading
              ? "Đang xử lý..."
              : categoryId
                ? "Cập nhật"
                : "Tạo mới"}
        </button>
      </div>
    </form>
  );
}
