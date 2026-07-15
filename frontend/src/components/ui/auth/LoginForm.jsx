import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

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

  return errorData?.message || errorData?.error || "Đăng nhập thất bại.";
}

export default function LoginForm({ onSubmit, loading = false }) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const submitting = loading || isSubmitting;

  const getInputClassName = (field) => `${inputClassName} ${
    errors[field]
      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
      : "border-green-200 focus:border-green-400 focus:ring-green-200"
  }`;

  const handleFormSubmit = async (data) => {
    clearErrors();

    const payload = {
      email: data.email.trim().toLowerCase(),
      password: data.password,
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
        <label htmlFor="login-email" className="mb-2 block font-medium text-green-600">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id="login-email"
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
        <p className="mt-1 text-xs text-slate-500">Dùng email đã đăng ký tài khoản.</p>
        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="login-password" className="mb-2 block font-medium text-green-600">
          Mật khẩu <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            disabled={submitting}
            maxLength={255}
            placeholder="Nhập mật khẩu từ 8 ký tự"
            aria-invalid={Boolean(errors.password)}
            {...register("password", {
              required: "Mật khẩu không được để trống.",
              minLength: { value: 8, message: "Mật khẩu tối thiểu 8 ký tự." },
              maxLength: { value: 255, message: "Mật khẩu tối đa 255 ký tự." },
              onChange: () => clearErrors(["password", "root.server"]),
            })}
            className={`${getInputClassName("password")} pr-12`}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((previous) => !previous)}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
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
        {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
}
