// src/components/ui/admin/categories/CategoryFormModal.jsx

import { useEffect, useState } from "react";

import { Loader2, X } from "lucide-react";

import toast from "react-hot-toast";

import useCategory from "@/hooks/useCategory";

import UploadImage from "@/components/upload/UploadImage";
import ResponsiveSelect from "@/components/common/ResponsiveSelect";

const initialForm = {
  parent_id: "",
  name: "",
  description: "",
  image: null,
  status: 1,
};

const statusOptions = [
  {
    value: 1,
    label: "Hiển thị",
  },
  {
    value: 0,
    label: "Ẩn",
  },
];

const fieldClassName = `
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
  disabled:text-slate-500
`;

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
    if (!open) {
      return;
    }

    getParentOptions(categoryId);

    if (categoryId) {
      adminGetById(categoryId);
    }
  }, [open, categoryId, adminGetById, getParentOptions]);

  if (!open) {
    return null;
  }

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
      : initialForm;

  const formKey = isEditing
    ? `category-${categoryId}-${category?.updated_at || category?.id || "loading"}`
    : "category-create";

  const parentOptions = [
    {
      value: "",
      label: "Không có — Danh mục gốc",
    },

    ...(Array.isArray(categoryOptions)
      ? categoryOptions.map((option) => ({
          value: option.id,
          label: option.name,
        }))
      : []),
  ];

  return (
    <div
      className="
        fixed
        inset-0
        z-60

        flex
        items-center
        justify-center

        bg-black/40

        p-3

        sm:p-4
      "
    >
      <div
        className="
          max-h-[calc(100dvh-24px)]
          w-full
          max-w-2xl

          overflow-y-auto
          overscroll-contain

          rounded-2xl

          bg-white

          shadow-xl

          sm:max-h-[95vh]
        "
      >
        {/* HEADER */}
        <div
          className="
            sticky
            top-0
            z-10

            flex
            items-center
            justify-between

            border-b
            border-slate-200

            bg-white

            p-4

            sm:p-5
          "
        >
          <h2 className="text-lg font-bold sm:text-xl">
            {categoryId ? "Chỉnh sửa danh mục" : "Thêm danh mục"}
          </h2>

          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="
              rounded-lg
              p-2

              transition

              hover:bg-slate-100
            "
          >
            <X size={20} />
          </button>
        </div>

        {!formReady ? (
          <div className="animate-pulse space-y-5 p-4 sm:p-5">
            <div className="h-12 rounded-xl bg-slate-200" />
            <div className="h-12 rounded-xl bg-slate-200" />
            <div className="h-40 rounded-xl bg-slate-200" />
            <div className="h-32 rounded-xl bg-slate-200" />
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

  const clearFieldError = (fieldName) => {
    setErrors((previous) => ({
      ...previous,
      [fieldName]: undefined,
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,

      [name]: value,
    }));

    clearFieldError(name);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (uploading) {
      toast.error("Vui lòng đợi ảnh tải lên hoàn tất.");

      return;
    }

    setLoading(true);
    setErrors({});

    const payload = {
      parent_id:
        form.parent_id === "" || form.parent_id === null
          ? null
          : Number(form.parent_id),

      name: form.name.trim(),

      description: form.description.trim() || null,

      image: form.image || null,

      status: Number(form.status),
    };

    try {
      const response = categoryId
        ? await update(categoryId, payload)
        : await create(payload);

      toast.success(
        response.message ||
          (categoryId
            ? "Cập nhật danh mục thành công."
            : "Tạo danh mục thành công."),
      );

      await onSuccess?.();

      onClose();
    } catch (error) {
      if (error?.errors) {
        setErrors(error.errors);
      } else {
        toast.error(error?.message || "Có lỗi xảy ra.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="
        space-y-4

        p-4

        sm:space-y-5
        sm:p-5
      "
    >
      {/* DANH MỤC CHA */}
      <div>
        <label className="mb-2 block font-semibold">Danh mục cha</label>

        <ResponsiveSelect
          value={form.parent_id}
          options={parentOptions}
          disabled={optionsLoading}
          placeholder="Chọn danh mục cha"
          onChange={(value) => {
            setForm((previous) => ({
              ...previous,
              parent_id: value,
            }));

            clearFieldError("parent_id");
          }}
        />

        {optionsLoading && (
          <p className="mt-1 text-xs text-slate-500">Đang tải danh mục...</p>
        )}

        {errors.parent_id && (
          <p className="mt-1 text-sm text-red-600">{errors.parent_id[0]}</p>
        )}
      </div>

      {/* TÊN */}
      <div>
        <label className="mb-2 block font-semibold">Tên danh mục</label>

        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          maxLength={50}
          placeholder="Ví dụ: Rau củ"
          className={fieldClassName}
        />

        <div className="mt-1 flex items-start justify-between gap-3">
          <div>
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name[0]}</p>
            )}
          </div>

          <span className="shrink-0 text-xs text-slate-400">
            {form.name.length}/50
          </span>
        </div>

        <p className="mt-1 text-xs text-slate-500">
          Slug sẽ được hệ thống tự động tạo từ tên danh mục.
        </p>
      </div>

      {/* SLUG */}
      {categoryId && categorySlug && (
        <div>
          <label className="mb-2 block font-semibold">Slug hiện tại</label>

          <input
            type="text"
            value={categorySlug}
            disabled
            className={fieldClassName}
          />
        </div>
      )}

      {/* IMAGE */}
      <div>
        <label className="mb-2 block font-semibold">Ảnh danh mục</label>

        <UploadImage
          value={form.image}
          uploadType="category_image"
          onUploadingChange={setUploading}
          onChange={(url) => {
            setForm((previous) => ({
              ...previous,
              image: url,
            }));

            clearFieldError("image");
          }}
        />

        {errors.image && (
          <p className="mt-1 text-sm text-red-600">{errors.image[0]}</p>
        )}
      </div>

      {/* DESCRIPTION */}
      <div>
        <label className="mb-2 block font-semibold">Mô tả</label>

        <textarea
          name="description"
          rows={5}
          maxLength={1000}
          value={form.description}
          onChange={handleChange}
          placeholder="Nhập mô tả danh mục..."
          className={`${fieldClassName} resize-y`}
        />

        <div className="mt-1 flex items-start justify-between gap-3">
          <div>
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description[0]}</p>
            )}
          </div>

          <span className="shrink-0 text-xs text-slate-400">
            {form.description.length}
            /1000
          </span>
        </div>
      </div>

      {/* STATUS */}
      <div>
        <label className="mb-2 block font-semibold">Trạng thái</label>

        <ResponsiveSelect
          value={form.status}
          options={statusOptions}
          onChange={(value) => {
            setForm((previous) => ({
              ...previous,

              status: Number(value),
            }));

            clearFieldError("status");
          }}
        />

        {errors.status && (
          <p className="mt-1 text-sm text-red-600">{errors.status[0]}</p>
        )}
      </div>

      {/* BUTTONS */}
      <div
        className="
          flex
          flex-col-reverse

          gap-3

          border-t
          border-slate-200

          pt-5

          sm:flex-row
          sm:justify-end
        "
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading || uploading}
          className="
            w-full

            rounded-xl

            border
            border-slate-200

            px-5
            py-3

            transition

            hover:bg-slate-50

            disabled:cursor-not-allowed
            disabled:opacity-50

            sm:w-auto
          "
        >
          Hủy
        </button>

        <button
          type="submit"
          disabled={disabled}
          className="
            flex
            w-full
            items-center
            justify-center

            gap-2

            rounded-xl

            bg-green-600

            px-6
            py-3

            font-semibold
            text-white

            transition

            hover:bg-green-700

            disabled:cursor-not-allowed
            disabled:opacity-60

            sm:w-auto
          "
        >
          {(loading || uploading) && (
            <Loader2 size={18} className="animate-spin" />
          )}

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
