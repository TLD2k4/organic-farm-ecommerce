// src/components/ui/customer/profile/ProfileInfoForm.jsx

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import useAuth from "@/hooks/useAuth";
import authService from "@/services/authService";
import UploadImage from "@/components/upload/UploadImage";
import { getImageUrl } from "@/utils/image";
import { CgSpinner } from "react-icons/cg";
export default function ProfileInfoForm() {
  const { user, getProfile } = useAuth();

  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (!user) return;

    reset({
      name: user.name || "",
      phone: user.phone || "",
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvatar(user.avatar || "");
  }, [user, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const payload = {
        name: data.name,
        phone: data.phone || null,
        avatar: avatar || null,
      };

      await authService.updateProfile(payload);

      await getProfile();

      toast.success("Cập nhật thông tin thành công");
    } catch (error) {
      const errors = error?.response?.data?.errors || error?.errors;

      const firstError = errors ? Object.values(errors)?.[0]?.[0] : null;

      toast.error(
        firstError ||
          error?.response?.data?.message ||
          error?.message ||
          "Cập nhật thất bại",
      );
    } finally {
      setLoading(false);
    }
  };

  // const previewAvatar =
  //   avatar || `https://ui-avatars.com/api/?name=${user?.name || "User"}`;

  const previewAvatar = avatar
    ? getImageUrl(avatar)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "User")}`;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-bold mb-6">Thông tin cá nhân</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block mb-2 font-medium">Avatar</label>

          <div className="mb-4">
            <img
              src={previewAvatar}
              alt={user?.name || "Avatar"}
              className="
                w-24
                h-24
                rounded-full
                object-cover
                border
              "
            />
          </div>

          <UploadImage
            value={avatar}
            onChange={setAvatar}
            onUploadingChange={setUploadingAvatar}
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Họ tên</label>

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
              h-12
              border
              rounded-xl
              px-4
              focus:outline-none
              focus:ring-2
              focus:ring-green-200
              focus:border-[#6BAE4F]
            "
          />

          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block mb-2 font-medium">Email</label>

          <input
            value={user?.email || ""}
            disabled
            className="
              w-full
              h-12
              border
              rounded-xl
              px-4
              bg-gray-100
              text-gray-500
            "
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Số điện thoại</label>

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
              h-12
              border
              rounded-xl
              px-4
              focus:outline-none
              focus:ring-2
              focus:ring-green-200
              focus:border-[#6BAE4F]
            "
          />

          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
          )}
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
            ? "Đang cập nhật..."
            : uploadingAvatar
              ? "Đang upload avatar..."
              : "Cập nhật thông tin"}
        </button>
      </form>
    </div>
  );
}
