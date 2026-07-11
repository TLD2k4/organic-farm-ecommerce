import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import RegisterForm from "@/components/ui/auth/RegisterForm";
import useAuth from "@/hooks/useAuth";

export default function RegisterPage() {
  const navigate = useNavigate();

  const { register, loading } = useAuth();

  const handleRegister = async (values) => {
    try {
      const formData = new FormData();

      formData.append("name", values.name);

      formData.append("email", values.email);

      formData.append("phone", values.phone);

      formData.append("password", values.password);

      formData.append("password_confirmation", values.password_confirmation);

      if (values.avatar) {
        formData.append("avatar", values.avatar);
      }

      await register(formData);

      toast.success("Đăng ký thành công");

      navigate("/");
    } catch (error) {
      const firstError = error?.errors
        ? Object.values(error.errors)[0][0]
        : error?.message;

      toast.error(firstError || "Đăng ký thất bại");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-linear-to-br  from-green-50 via-white to-green-100">
      <div
        className="
w-full
max-w-lg
p-8
rounded-3xl
bg-white
border
border-green-100
shadow-xl
"
      >
        <h1
          className="
text-4xl
font-bold
text-center
mb-6
text-green-500
"
        >
          Đăng ký
        </h1>

        <RegisterForm onSubmit={handleRegister} loading={loading} />

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Đã có tài khoản?
            <Link
              to="/login"
              className="ml-1 text-green-600 font-medium hover:underline"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
