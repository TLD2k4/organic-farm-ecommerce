import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import useAuth from "@/hooks/useAuth";

const inputClassName = `
  h-12 w-full rounded-xl border bg-white px-4 outline-none transition
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

  return errorData?.message || errorData?.error || "Đổi mật khẩu thất bại.";
}

export default function ChangePasswordForm() {
  const { changePassword, logoutAll } = useAuth();
  const navigate = useNavigate();

  const [showCurrent, setShowCurrent] = useState(false);
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
      current_password: "",
      password: "",
      password_confirmation: "",
    },
  });

  const currentPassword = useWatch({ control, name: "current_password" });
  const password = useWatch({ control, name: "password" });

  const getInputClassName = (field) => `${inputClassName} ${
    errors[field]
      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
      : "border-slate-200 focus:border-green-500 focus:ring-green-100"
  }`;

  const onSubmit = async (data) => {
    clearErrors();

    const payload = {
      current_password: data.current_password,
      password: data.password,
      password_confirmation: data.password_confirmation,
    };

    try {
      await changePassword(payload);
      toast.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      await logoutAll();
      navigate("/login", { replace: true });
    } catch (error) {
      const message = applyServerErrors(error, setError);
      const errorData = getErrorData(error);

      if (!errorData?.errors) {
        setError("root.server", { type: "server", message });
      }

      toast.error(message);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-2 text-xl font-bold">Đổi mật khẩu</h2>
      <p className="mb-6 text-sm text-slate-500">
        Sau khi đổi mật khẩu, tất cả thiết bị sẽ được đăng xuất để bảo vệ tài khoản.
      </p>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <PasswordInput
          label="Mật khẩu hiện tại"
          field="current_password"
          show={showCurrent}
          onToggle={() => setShowCurrent((previous) => !previous)}
          disabled={isSubmitting}
          register={register}
          error={errors.current_password}
          className={getInputClassName("current_password")}
          placeholder="Nhập mật khẩu đang sử dụng"
          autoComplete="current-password"
          rules={{
            required: "Mật khẩu hiện tại không được để trống.",
            minLength: { value: 8, message: "Mật khẩu hiện tại tối thiểu 8 ký tự." },
            maxLength: { value: 255, message: "Mật khẩu hiện tại tối đa 255 ký tự." },
            onChange: () => clearErrors(["current_password", "password", "root.server"]),
          }}
        />

        <PasswordInput
          label="Mật khẩu mới"
          field="password"
          show={showPassword}
          onToggle={() => setShowPassword((previous) => !previous)}
          disabled={isSubmitting}
          register={register}
          error={errors.password}
          className={getInputClassName("password")}
          placeholder="Nhập mật khẩu mới từ 8 ký tự"
          autoComplete="new-password"
          help="Mật khẩu mới phải từ 8 đến 255 ký tự và khác mật khẩu hiện tại."
          rules={{
            required: "Mật khẩu mới không được để trống.",
            minLength: { value: 8, message: "Mật khẩu mới tối thiểu 8 ký tự." },
            maxLength: { value: 255, message: "Mật khẩu mới tối đa 255 ký tự." },
            validate: (value) => value !== currentPassword || "Mật khẩu mới phải khác mật khẩu hiện tại.",
            onChange: () => clearErrors(["password", "password_confirmation", "root.server"]),
          }}
        />

        <PasswordInput
          label="Xác nhận mật khẩu mới"
          field="password_confirmation"
          show={showConfirmation}
          onToggle={() => setShowConfirmation((previous) => !previous)}
          disabled={isSubmitting}
          register={register}
          error={errors.password_confirmation}
          className={getInputClassName("password_confirmation")}
          placeholder="Nhập lại mật khẩu mới"
          autoComplete="new-password"
          rules={{
            required: "Xác nhận mật khẩu không được để trống.",
            maxLength: { value: 255, message: "Mật khẩu xác nhận tối đa 255 ký tự." },
            validate: (value) => value === password || "Mật khẩu xác nhận không khớp.",
            onChange: () => clearErrors(["password_confirmation", "root.server"]),
          }}
        />

        {errors.root?.server && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-semibold text-red-600">{errors.root.server.message}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6BAE4F] px-6 font-semibold text-white transition hover:bg-[#5d9d43] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isSubmitting && <Loader2 size={19} className="animate-spin" />}
          {isSubmitting ? "Đang xử lý..." : "Đổi mật khẩu"}
        </button>
      </form>
    </div>
  );
}

function PasswordInput({
  label,
  field,
  show,
  onToggle,
  disabled,
  register,
  error,
  className,
  placeholder,
  autoComplete,
  help,
  rules,
}) {
  return (
    <div>
      <label className="mb-2 block font-semibold text-slate-700">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          disabled={disabled}
          maxLength={255}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          {...register(field, rules)}
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
      {help && <p className="mt-1 text-xs text-slate-500">{help}</p>}
      {error && <p className="mt-1 text-sm text-red-500">{error.message}</p>}
    </div>
  );
}
