// src/components/ui/customer/profile/ChangePasswordForm.jsx

import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { CgSpinner } from "react-icons/cg";

export default function ChangePasswordForm() {
  const { changePassword, logoutAll } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ mode: "onBlur" });

  const password = useWatch({ control, name: "password" });

  const onSubmit = async (data) => {
    try {
      await changePassword(data);
      toast.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      await logoutAll(); // Xóa token/user trong context/localStorage
      navigate("/login"); // Chuyển hướng về trang đăng nhập

      reset();
    } catch (error) {
      const firstError = error?.errors
        ? Object.values(error.errors)[0][0]
        : error?.message;
      toast.error(firstError || "Đổi mật khẩu thất bại");
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-bold mb-6">Đổi mật khẩu</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Mật khẩu hiện tại */}
        <div>
          <input
            type="password"
            placeholder="Mật khẩu hiện tại"
            {...register("current_password", {
              required: "Mật khẩu hiện tại không được để trống",
            })}
            className="w-full h-12 border rounded-xl px-4"
          />
          {errors.current_password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.current_password.message}
            </p>
          )}
        </div>

        {/* Mật khẩu mới */}
        <div>
          <input
            type="password"
            placeholder="Mật khẩu mới"
            {...register("password", {
              required: "Mật khẩu mới không được để trống",
              minLength: { value: 8, message: "Mật khẩu tối thiểu 8 ký tự" },
            })}
            className="w-full h-12 border rounded-xl px-4"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Xác nhận mật khẩu */}
        <div>
          <input
            type="password"
            placeholder="Xác nhận mật khẩu mới"
            {...register("password_confirmation", {
              required: "Xác nhận mật khẩu không được để trống",
              validate: (value) =>
                value === password || "Mật khẩu xác nhận không khớp",
            })}
            className="w-full h-12 border rounded-xl px-4"
          />
          {errors.password_confirmation && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password_confirmation.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="h-12 px-6 rounded-xl bg-[#6BAE4F] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#5d9d43] transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {/* 2. Hiển thị spinner khi đang submitting */}
          {isSubmitting && <CgSpinner className="w-5 h-5 animate-spin" />}
          {isSubmitting ? "Đang xử lý..." : "Đổi mật khẩu"}
        </button>
      </form>
    </div>
  );
}
