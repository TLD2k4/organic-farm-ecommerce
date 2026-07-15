import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";

import useAuth from "@/hooks/useAuth";
import authService from "@/services/authService";
import UploadImage from "@/components/upload/UploadImage";
import { getImageUrl } from "@/utils/image";

const PHONE_REGEX = /^0[0-9]{9,10}$/;

function getErrorData(error) {
  return error?.response?.data ?? error;
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function ProfileInfoForm() {
  const { user, getProfile } = useAuth();
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { name: "", phone: "" },
  });

  const name = useWatch({ control, name: "name" }) || "";

  useEffect(() => {
    if (!user) return;
    reset({ name: user.name || "", phone: user.phone || "" });
    setAvatar(user.avatar || "");
  }, [user, reset]);

  const previewAvatar = useMemo(
    () => avatar
      ? getImageUrl(avatar)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}`,
    [avatar, user?.name],
  );

  const inputClass = (field) => `
    h-12 w-full rounded-xl border px-4 outline-none transition focus:ring-2
    disabled:cursor-not-allowed disabled:bg-slate-100
    ${errors[field]
      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
      : "border-slate-200 focus:border-[#6BAE4F] focus:ring-green-200"}
  `;

  const onSubmit = async (data) => {
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

    try {
      setLoading(true);

      await authService.updateProfile({
        name: cleanName,
        phone: cleanPhone || null,
        avatar: avatar || null,
      });

      await getProfile();
      toast.success("Cập nhật thông tin thành công");
    } catch (error) {
      const errorData = getErrorData(error);
      const serverErrors = errorData?.errors;

      if (serverErrors) {
        Object.entries(serverErrors).forEach(([field, messages]) => {
          setError(field, {
            type: "server",
            message: Array.isArray(messages) ? messages[0] : messages,
          });
        });
      } else {
        setError("root.server", {
          type: "server",
          message: errorData?.message || errorData?.error || "Cập nhật thất bại.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || uploadingAvatar;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-6 text-xl font-bold">Thông tin cá nhân</h2>

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="mb-2 block font-medium">Avatar</label>
          <img
            src={previewAvatar}
            alt={user?.name ? `Avatar của ${user.name}` : "Avatar người dùng"}
            title={user?.name ? `Avatar của ${user.name}` : "Avatar người dùng"}
            className="mb-4 h-24 w-24 rounded-full border object-cover"
          />
          <UploadImage
            value={avatar}
            onChange={(url) => {
              setAvatar(url || "");
              clearErrors(["avatar", "root.server"]);
            }}
            onUploadingChange={setUploadingAvatar}
          />
          <p className="mt-1 text-xs text-slate-500">Ảnh không bắt buộc. Đường dẫn ảnh tối đa 255 ký tự.</p>
          {errors.avatar && <p className="mt-1 text-sm text-red-500">{errors.avatar.message}</p>}
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Họ tên <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            autoComplete="name"
            maxLength={30}
            disabled={disabled}
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
            className={inputClass("name")}
          />
          <div className="mt-1 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">Tên hiển thị trên hồ sơ, đơn hàng và đánh giá.</p>
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
            </div>
            <span className="shrink-0 text-xs text-slate-400">{name.length}/30</span>
          </div>
        </div>

        <div>
          <label className="mb-2 block font-medium">Email</label>
          <input
            type="email"
            value={user?.email || ""}
            disabled
            title="Email không thể thay đổi tại đây"
            className="h-12 w-full rounded-xl border bg-gray-100 px-4 text-gray-500"
          />
          <p className="mt-1 text-xs text-slate-500">Email đăng nhập không thể thay đổi tại trang này.</p>
        </div>

        <div>
          <label className="mb-2 block font-medium">Số điện thoại</label>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={11}
            disabled={disabled}
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
            className={inputClass("phone")}
          />
          <p className="mt-1 text-xs text-slate-500">Không bắt buộc. Chỉ nhập chữ số.</p>
          {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>}
        </div>

        {errors.root?.server && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600">
            {errors.root.server.message}
          </div>
        )}

        <button
          type="submit"
          disabled={disabled}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-3 font-semibold text-white shadow-md transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {disabled && <Loader2 className="h-5 w-5 animate-spin" />}
          {loading ? "Đang cập nhật..." : uploadingAvatar ? "Đang upload avatar..." : "Cập nhật thông tin"}
        </button>
      </form>
    </div>
  );
}
