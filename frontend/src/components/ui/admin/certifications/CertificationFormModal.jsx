// src/components/ui/admin/certifications/CertificationFormModal.jsx

import { useEffect, useState } from "react";

import { Loader2, X } from "lucide-react";
import toast from "react-hot-toast";

import useCertification from "@/hooks/useCertification";

import ResponsiveSelect from "@/components/common/ResponsiveSelect";

const CERTIFICATION_NAME_MAX_LENGTH = 25;
const DESCRIPTION_MAX_LENGTH = 1000;

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

const baseFieldClassName = `
  w-full
  rounded-xl
  border
  bg-white
  px-4
  py-3
  text-slate-800
  outline-none
  transition
  focus:ring-2
  disabled:cursor-not-allowed
  disabled:bg-slate-100
  disabled:text-slate-500
`;

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function getErrorData(error) {
  return error?.response?.data ?? error;
}

function getFirstErrorMessage(errorData) {
  const serverErrors = errorData?.errors;

  if (serverErrors && typeof serverErrors === "object") {
    const firstMessages = Object.values(serverErrors)[0];

    if (Array.isArray(firstMessages)) {
      return firstMessages[0];
    }

    if (typeof firstMessages === "string") {
      return firstMessages;
    }
  }

  return (
    errorData?.message || errorData?.error || "Có lỗi xảy ra khi lưu chứng chỉ."
  );
}

function normalizeServerErrors(serverErrors) {
  if (!serverErrors || typeof serverErrors !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(serverErrors).map(([field, messages]) => [
      field,
      Array.isArray(messages) ? messages : [messages],
    ]),
  );
}

function validateCertificationForm(form) {
  const errors = {};

  const name = normalizeText(form.name);
  const description = String(form.description ?? "").trim();
  const status = Number(form.status);

  if (!name) {
    errors.name = ["Tên chứng chỉ không được để trống."];
  } else if (name.length > CERTIFICATION_NAME_MAX_LENGTH) {
    errors.name = [
      `Tên chứng chỉ tối đa ${CERTIFICATION_NAME_MAX_LENGTH} ký tự.`,
    ];
  }

  if (description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = [`Mô tả tối đa ${DESCRIPTION_MAX_LENGTH} ký tự.`];
  }

  if (![0, 1].includes(status)) {
    errors.status = ["Trạng thái chỉ được là 0 (ẩn) hoặc 1 (hiển thị)."];
  }

  return errors;
}

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
    if (!open || !certificationId) {
      return;
    }

    adminGetById(certificationId);
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

  /*
   * Khi certificationId hoặc dữ liệu certification thay đổi,
   * key thay đổi khiến component form được tạo lại với state mới.
   *
   * Không cần gọi setForm() trong useEffect.
   */
  const formKey = isEditing
    ? `certification-${certificationId}-${
        certification?.updated_at || certification?.id || "loading"
      }`
    : "certification-create";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="certification-modal-title"
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
          <h2
            id="certification-modal-title"
            className="text-lg font-bold sm:text-xl"
          >
            {isEditing ? "Chỉnh sửa chứng chỉ" : "Thêm chứng chỉ"}
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
  const [form, setForm] = useState(() => initialValues);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const getFieldClassName = (fieldName) => `
    ${baseFieldClassName}

    ${
      errors[fieldName]
        ? `
          border-red-400
          focus:border-red-500
          focus:ring-red-100
        `
        : `
          border-slate-200
          focus:border-green-500
          focus:ring-green-100
        `
    }
  `;

  const clearFieldError = (fieldName) => {
    setErrors((previous) => {
      if (!previous[fieldName]) {
        return previous;
      }

      const nextErrors = {
        ...previous,
      };

      delete nextErrors[fieldName];

      return nextErrors;
    });
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

    const clientErrors = validateCertificationForm(form);

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);

      toast.error(
        getFirstErrorMessage({
          errors: clientErrors,
        }),
      );

      return;
    }

    const payload = {
      name: normalizeText(form.name),
      description: String(form.description ?? "").trim() || null,
      status: Number(form.status),
    };

    try {
      setSubmitting(true);
      setErrors({});

      const response = certificationId
        ? await update(certificationId, payload)
        : await create(payload);

      toast.success(
        response?.message ||
          (certificationId
            ? "Cập nhật chứng chỉ thành công."
            : "Tạo chứng chỉ thành công."),
      );

      await onSuccess?.();

      onClose();
    } catch (error) {
      const errorData = getErrorData(error);

      if (errorData?.errors) {
        setErrors(normalizeServerErrors(errorData.errors));
      }

      toast.error(getFirstErrorMessage(errorData));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      noValidate
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
        <label
          htmlFor="certification-name"
          className="mb-2 block font-semibold"
        >
          Tên chứng chỉ
          <span className="ml-1 text-red-500">*</span>
        </label>

        <input
          id="certification-name"
          type="text"
          name="name"
          autoComplete="off"
          disabled={submitting}
          value={form.name}
          onChange={handleChange}
          maxLength={CERTIFICATION_NAME_MAX_LENGTH}
          placeholder="Ví dụ: VietGAP, Organic, GlobalGAP"
          aria-invalid={Boolean(errors.name)}
          className={getFieldClassName("name")}
        />

        <div className="mt-1 flex items-start justify-between gap-3">
          <div>
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name[0]}</p>
            )}

            {!errors.name && (
              <p className="text-xs text-slate-500">
                Tên phải khác các chứng chỉ đã có trong hệ thống.
              </p>
            )}
          </div>

          <span className="shrink-0 text-xs text-slate-400">
            {form.name.length}/{CERTIFICATION_NAME_MAX_LENGTH}
          </span>
        </div>
      </div>

      {/* DESCRIPTION */}
      <div>
        <label
          htmlFor="certification-description"
          className="mb-2 block font-semibold"
        >
          Mô tả
        </label>

        <textarea
          id="certification-description"
          name="description"
          rows={5}
          disabled={submitting}
          maxLength={DESCRIPTION_MAX_LENGTH}
          value={form.description}
          onChange={handleChange}
          placeholder="Ví dụ: Chứng nhận quy trình sản xuất nông nghiệp đáp ứng tiêu chuẩn về an toàn thực phẩm..."
          aria-invalid={Boolean(errors.description)}
          className={`${getFieldClassName("description")} resize-y`}
        />

        <div className="mt-1 flex items-start justify-between gap-3">
          <div>
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description[0]}</p>
            )}

            {!errors.description && (
              <p className="text-xs text-slate-500">
                Không bắt buộc, dùng để giải thích ý nghĩa và phạm vi chứng chỉ.
              </p>
            )}
          </div>

          <span className="shrink-0 text-xs text-slate-400">
            {form.description.length}/{DESCRIPTION_MAX_LENGTH}
          </span>
        </div>
      </div>

      {/* STATUS */}
      <div>
        <label className="mb-2 block font-semibold">
          Trạng thái
          <span className="ml-1 text-red-500">*</span>
        </label>

        <ResponsiveSelect
          value={form.status}
          options={statusOptions}
          disabled={submitting}
          placeholder="Chọn trạng thái"
          onChange={(value) => {
            setForm((previous) => ({
              ...previous,
              status: Number(value),
            }));

            clearFieldError("status");
          }}
        />

        {errors.status ? (
          <p className="mt-1 text-sm text-red-600">{errors.status[0]}</p>
        ) : (
          <p className="mt-1 text-xs text-slate-500">
            Chứng chỉ bị ẩn sẽ không xuất hiện trong danh sách lựa chọn công
            khai.
          </p>
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
          disabled={submitting}
          className="
            w-full
            rounded-xl
            border
            border-slate-200
            px-5
            py-3
            font-semibold
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
          disabled={submitting}
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
          {submitting && <Loader2 size={18} className="animate-spin" />}

          {submitting
            ? "Đang xử lý..."
            : certificationId
              ? "Cập nhật"
              : "Tạo mới"}
        </button>
      </div>
    </form>
  );
}
