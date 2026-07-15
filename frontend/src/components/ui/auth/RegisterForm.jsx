import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import UploadImage from "@/components/upload/UploadImage";

const PHONE_REGEX = /^0[0-9]{9,10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClassName = `
  w-full rounded-xl border bg-white p-3 text-gray-800 outline-none transition
  focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70
`;

function getErrorData(error) {
  return error?.response?.data ?? error;
}

function applyServerErrors(error, setError) {
  const errorData = getErrorData(error);
  const serverErrors = errorData?.errors;

  if (serverErrors) {
    Object.entries(serverErrors).forEach(([field, messages]) => {
      setError(field, {
        type: "server",
        message: Array.isArray(messages) ? messages[0] : messages,
      });
    });
  }

  return errorData?.message || errorData?.error || "Đăng ký tài khoản thất bại.";
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function RegisterForm({ onSubmit, loading = false }) {
  const [avatar, setAvatar] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      password_confirmation: "",
    },
  });

  const password = useWatch({ control, name: "password" });
  const name = useWatch({ control, name: "name" }) || "";
  const submitting = loading || isSubmitting || uploadingAvatar;

  const getInputClassName = (field) => `${inputClassName} ${
    errors[field]
      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
      : "border-green-200 focus:border-green-400 focus:ring-green-200"
  }`;

  const handleFormSubmit = async (data) => {
    clearErrors();

    const cleanName = data.name.replace(/\s+/g, " ").trim();
    const cleanPhone = data.phone?.trim() || "";

    if (avatar && !isValidHttpUrl(avatar)) {
      setError("avatar", { type: "validate", message: "Avatar phải là một URL hợp lệ." });
      return;
    }

    if (avatar && avatar.length > 255) {
      setError("avatar", { type: "maxLength", message: "Đường dẫn avatar tối đa 255 ký tự." });
      return;
    }

    const payload = {
      name: cleanName,
      email: data.email.trim().toLowerCase(),
      phone: cleanPhone || null,
      password: data.password,
      password_confirmation: data.password_confirmation,
      avatar: avatar || null,
    };

    try {
      await onSubmit(payload);
    } catch (error) {
      const message = applyServerErrors(error, setError);
      const errorData = getErrorData(error);

      if (!errorData?.errors) {
        setError("root.server", { type: "server", message });
      }
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="mb-2 block font-medium text-green-600">
          Họ tên <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          autoComplete="name"
          disabled={submitting}
          maxLength={30}
          placeholder="Ví dụ: Nguyễn Văn An"
          aria-invalid={Boolean(errors.name)}
          {...register("name", {
            required: "Tên không được để trống.",
            validate: {
              notBlank: (value) => value.trim().length > 0 || "Tên không được để trống.",
              minLength: (value) => value.replace(/\s+/g, " ").trim().length >= 2 || "Tên phải có ít nhất 2 ký tự.",
            },
            maxLength: { value: 30, message: "Tên tối đa 30 ký tự." },
            onChange: () => clearErrors(["name", "root.server"]),
          })}
          className={getInputClassName("name")}
        />
        <div className="mt-1 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Nhập họ tên thật, từ 2 đến 30 ký tự.</p>
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <span className="shrink-0 text-xs text-slate-400">{name.length}/30</span>
        </div>
      </div>

      <div>
        <label className="mb-2 block font-medium text-green-600">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          autoComplete="email"
          disabled={submitting}
          maxLength={100}
          placeholder="Ví dụ: nguyenvana@gmail.com"
          aria-invalid={Boolean(errors.email)}
          {...register("email", {
            required: "Email không được để trống.",
            pattern: { value: EMAIL_REGEX, message: "Email không đúng định dạng." },
            maxLength: { value: 100, message: "Email tối đa 100 ký tự." },
            onChange: () => clearErrors(["email", "root.server"]),
          })}
          className={getInputClassName("email")}
        />
        <p className="mt-1 text-xs text-slate-500">Email phải chưa được đăng ký trên hệ thống.</p>
        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
      </div>

      <div>
        <label className="mb-2 block font-medium text-green-600">Số điện thoại</label>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          disabled={submitting}
          maxLength={11}
          placeholder="Ví dụ: 0901234567"
          aria-invalid={Boolean(errors.phone)}
          {...register("phone", {
            validate: (value) => {
              if (!value?.trim()) return true;
              return PHONE_REGEX.test(value) || "Số điện thoại phải bắt đầu bằng số 0 và có 10-11 chữ số.";
            },
            onChange: (event) => {
              event.target.value = event.target.value.replace(/\D/g, "").slice(0, 11);
              clearErrors(["phone", "root.server"]);
            },
          })}
          className={getInputClassName("phone")}
        />
        <p className="mt-1 text-xs text-slate-500">Không bắt buộc. Chỉ nhập chữ số.</p>
        {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>}
      </div>

      <PasswordField
        label="Mật khẩu"
        field="password"
        show={showPassword}
        onToggle={() => setShowPassword((previous) => !previous)}
        register={register}
        disabled={submitting}
        error={errors.password}
        className={getInputClassName("password")}
        clearErrors={clearErrors}
      />

      <PasswordField
        label="Xác nhận mật khẩu"
        field="password_confirmation"
        show={showConfirmation}
        onToggle={() => setShowConfirmation((previous) => !previous)}
        register={register}
        disabled={submitting}
        error={errors.password_confirmation}
        className={getInputClassName("password_confirmation")}
        clearErrors={clearErrors}
        validate={(value) => value === password || "Mật khẩu xác nhận không khớp."}
      />

      <div>
        <label className="mb-2 block font-medium text-green-600">Avatar</label>
        <UploadImage
          value={avatar}
          onChange={(url) => {
            setAvatar(url);
            clearErrors(["avatar", "root.server"]);
          }}
          onUploadingChange={setUploadingAvatar}
          publicRegister
        />
        <p className="mt-1 text-xs text-slate-500">Không bắt buộc. Ảnh được tải lên phải trả về URL hợp lệ, tối đa 255 ký tự.</p>
        {uploadingAvatar && <p className="mt-1 text-sm text-slate-500">Đang tải avatar...</p>}
        {errors.avatar && <p className="mt-1 text-sm text-red-500">{errors.avatar.message}</p>}
      </div>

      {errors.root?.server && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-semibold text-red-600">{errors.root.server.message}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-semibold text-white shadow-md transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting && <Loader2 size={19} className="animate-spin" />}
        {uploadingAvatar ? "Đang upload avatar..." : loading || isSubmitting ? "Đang xử lý..." : "Đăng ký"}
      </button>
    </form>
  );
}

function PasswordField({
  label,
  field,
  show,
  onToggle,
  register,
  disabled,
  error,
  className,
  clearErrors,
  validate,
}) {
  return (
    <div>
      <label className="mb-2 block font-medium text-green-600">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          autoComplete="new-password"
          disabled={disabled}
          maxLength={255}
          placeholder={field === "password" ? "Nhập mật khẩu từ 8 ký tự" : "Nhập lại mật khẩu"}
          aria-invalid={Boolean(error)}
          {...register(field, {
            required: `${label} không được để trống.`,
            minLength: field === "password" ? { value: 8, message: "Mật khẩu tối thiểu 8 ký tự." } : undefined,
            maxLength: { value: 255, message: `${label} tối đa 255 ký tự.` },
            validate,
            onChange: () => clearErrors([field, "password", "password_confirmation", "root.server"]),
          })}
          className={`${className} pr-12`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={onToggle}
          aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {field === "password" && <p className="mt-1 text-xs text-slate-500">Mật khẩu từ 8 đến 255 ký tự.</p>}
      {error && <p className="mt-1 text-sm text-red-500">{error.message}</p>}
    </div>
  );
}
