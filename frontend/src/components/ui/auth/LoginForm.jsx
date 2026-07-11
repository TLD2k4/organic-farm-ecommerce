import { useForm } from "react-hook-form";

export default function LoginForm({ onSubmit, loading }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

      <div>
        <label className="block mb-2 text-green-500 font-medium">Mật khẩu</label>

        <input
          type="password"
          {...register("password", {
            required: "Mật khẩu không được để trống",
            minLength: {
              value: 8,
              message: "Mật khẩu tối thiểu 8 ký tự",
            },
            maxLength: {
              value: 255,
              message: "Mật khẩu tối đa 255 ký tự",
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

        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
className="
w-full
py-3
rounded-xl
font-semibold
text-white
bg-green-500
hover:bg-green-600
transition
shadow-md
" >
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
}
