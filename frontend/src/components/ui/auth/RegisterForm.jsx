import { useForm, useWatch } from "react-hook-form";
import { useState } from "react";
// IMPORT UPLOAD AVATAR
import UploadImage from "@/components/upload/UploadImage";
import { CgSpinner } from "react-icons/cg";
export default function RegisterForm({ onSubmit, loading }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
  });

  const [avatar, setAvatar] = useState(null);
  //UPLOAD AVATAR
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const password = useWatch({ control, name: "password" });

  const handleFormSubmit = (data) => {
    onSubmit({
      ...data,
      avatar,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block mb-2 text-green-500 font-medium">Họ tên</label>

        <input
          {...register("name", {
            required: "Tên không được để trống",
            maxLength: {
              value: 30,
              message: "Tên tối đa 30 ký tự",
            },
          })}
          className="
w-full
p-3
rounded-xl
bg-white
border
border-green-200
text-gray-800
focus:outline-none
focus:ring-2
focus:ring-green-300
focus:border-green-400
"
        />

        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block mb-2 text-green-500 font-medium">Email</label>

        <input
          type="email"
          {...register("email", {
            required: "Email không được để trống",
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: "Email không đúng định dạng",
            },
            maxLength: {
              value: 100,
              message: "Email tối đa 100 ký tự",
            },
          })}
          className="
w-full
p-3
rounded-xl
bg-white
border
border-green-200
text-gray-800
focus:outline-none
focus:ring-2
focus:ring-green-300
focus:border-green-400
"
        />

        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="block mb-2 text-green-500 font-medium">
          Số điện thoại
        </label>

        <input
          {...register("phone", {
            pattern: {
              value: /^(0[0-9]{9,10})$/,
              message:
                "Số điện thoại phải bắt đầu bằng số 0 và có 10-11 chữ số",
            },
          })}
          className="
w-full
p-3
rounded-xl
bg-white
border
border-green-200
text-gray-800
focus:outline-none
focus:ring-2
focus:ring-green-300
focus:border-green-400
"
        />

        {errors.phone && (
          <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block mb-2 text-green-500 font-medium">
          Mật khẩu
        </label>
        <input
          type="password"
          {...register("password", {
            required: "Mật khẩu không được để trống",
            minLength: { value: 8, message: "Mật khẩu tối thiểu 8 ký tự" },
            maxLength: { value: 255, message: "Mật khẩu tối đa 255 ký tự" },
          })}
          className="w-full p-3 rounded-xl bg-white border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block mb-2 text-green-500 font-medium">
          Xác nhận mật khẩu
        </label>
        <input
          type="password"
          {...register("password_confirmation", {
            required: "Xác nhận mật khẩu không được để trống",
            validate: (value) =>
              value === password || "Mật khẩu xác nhận không khớp",
          })}
          className="w-full p-3 rounded-xl bg-white border border-green-200 focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        {errors.password_confirmation && (
          <p className="text-red-500 text-sm mt-1">
            {errors.password_confirmation.message}
          </p>
        )}
      </div>

      {/* Avatar */}
      <div>
        <label className="block mb-2 text-green-500 font-medium">Avatar</label>

        <UploadImage
          value={avatar}
          onChange={setAvatar}
          onUploadingChange={setUploadingAvatar}
          publicRegister
        />
      </div>

      <button
        type="submit"
        disabled={loading || uploadingAvatar}
        className="w-full py-3 rounded-xl font-semibold text-white bg-green-500 hover:bg-green-600 transition shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {(loading || uploadingAvatar) && (
          <CgSpinner className="w-5 h-5 animate-spin" />
        )}
        {loading
          ? "Đang xử lý..."
          : uploadingAvatar
            ? "Đang upload avatar..."
            : "Đăng ký"}
      </button>
    </form>
  );
}
