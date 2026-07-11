import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import LoginForm from "@/components/ui/auth/LoginForm";
import useAuth from "@/hooks/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();

  const { login, loading } = useAuth();

  const handleLogin = async (data) => {
    try {
      await login(data);

      toast.success("Đăng nhập thành công");

      navigate("/");
    } catch (error) {
      const firstError = error?.errors
        ? Object.values(error.errors)[0][0]
        : error?.message;

      toast.error(firstError || "Đăng nhập thất bại");
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
          Đăng nhập
        </h1>

        <LoginForm onSubmit={handleLogin} loading={loading} />

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Chưa có tài khoản?
            <Link
              to="/register"
              className="ml-1 text-green-600 font-medium hover:underline"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
