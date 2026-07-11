// src/components/ui/admin/certifications/CertificationFormModal.jsx

import { useEffect, useState } from "react";

import { Loader2, X } from "lucide-react";

import toast from "react-hot-toast";

import useCertification from "@/hooks/useCertification";

import ResponsiveSelect from "@/components/common/ResponsiveSelect";

const initialForm = {
  name: "",
  description: "",
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
`;

export default function CertificationFormModal({
  open,
  onClose,
  certificationId,
  onSuccess,
}) {
  const {
    create,
    update,
    adminGetById,
    certification,
    detailLoading,
    loading,
  } = useCertification();

  useEffect(() => {
    if (open && certificationId) {
      adminGetById(certificationId);
    }
  }, [open, certificationId, adminGetById]);

  if (!open) {
    return null;
  }

  const isEditing = Boolean(certificationId);

  const isDetailLoading = Boolean(detailLoading ?? loading);

  const correctCertificationLoaded =
    !isEditing ||
    (certification && Number(certification.id) === Number(certificationId));

  const formReady =
    !isEditing || (!isDetailLoading && correctCertificationLoaded);

  const initialValues =
    isEditing && correctCertificationLoaded
      ? {
          name: certification.name ?? "",

          description: certification.description ?? "",

          status: Number(certification.status ?? 1),
        }
      : initialForm;

  const formKey = isEditing
    ? `certification-${certificationId}-${certification?.updated_at || certification?.id || "loading"}`
    : "certification-create";

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
          max-w-xl

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
            {certificationId ? "Chỉnh sửa chứng chỉ" : "Thêm chứng chỉ"}
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
            <div className="h-36 rounded-xl bg-slate-200" />
            <div className="h-12 rounded-xl bg-slate-200" />
          </div>
        ) : (
          <CertificationFormContent
            key={formKey}
            initialValues={initialValues}
            certificationId={certificationId}
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

function CertificationFormContent({
  initialValues,
  certificationId,
  create,
  update,
  onClose,
  onSuccess,
}) {
  const [form, setForm] = useState(initialValues);

  const [errors, setErrors] = useState({});

  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    setErrors({});

    const payload = {
      name: form.name.trim(),

      description: form.description.trim() || null,

      status: Number(form.status),
    };

    try {
      const response = certificationId
        ? await update(certificationId, payload)
        : await create(payload);

      toast.success(
        response.message ||
          (certificationId
            ? "Cập nhật chứng chỉ thành công."
            : "Tạo chứng chỉ thành công."),
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
      {/* NAME */}
      <div>
        <label className="mb-2 block font-semibold">Tên chứng chỉ</label>

        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          maxLength={100}
          placeholder="Nhập tên chứng chỉ..."
          className={fieldClassName}
        />

        <div className="mt-1 flex items-start justify-between gap-3">
          <div>
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name[0]}</p>
            )}
          </div>

          <span className="shrink-0 text-xs text-slate-400">
            {form.name.length}/100
          </span>
        </div>
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
          placeholder="Nhập mô tả chứng chỉ..."
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
          disabled={loading}
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
          disabled={loading}
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
          {loading && <Loader2 size={18} className="animate-spin" />}

          {loading ? "Đang xử lý..." : certificationId ? "Cập nhật" : "Tạo mới"}
        </button>
      </div>
    </form>
  );
}
