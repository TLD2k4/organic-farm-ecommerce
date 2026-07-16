// src\components\upload\UploadImage.jsx

import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Camera, Loader2, Trash2, UploadCloud } from "lucide-react";
import { useDropzone } from "react-dropzone";
import uploadService from "@/services/uploadService";
import { getApiErrorMessage } from "@/utils/apiError";

// 🌟 BƯỚC 1: Chuyển uploadMap ra ngoài này.
// Nó sẽ được khởi tạo ĐÚNG 1 LẦN duy nhất khi app chạy, không lo bị re-render tạo lại nữa!
const UPLOAD_MAP = {
  user_avatar: uploadService.uploadUserAvatar,
  farm_logo: uploadService.uploadFarmLogo,
  farm_cover: uploadService.uploadFarmCover,
  product_thumbnail: uploadService.uploadProductThumbnail,
  product_detail: uploadService.uploadProductDetail,
  category_image: uploadService.uploadCategoryImage,
  certificate_file: uploadService.uploadCertificateFile,
};

export default function UploadImage({
  value,
  onChange,
  onUploadingChange,
  publicRegister = false,
  uploadType = "user_avatar",
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const setUploadState = useCallback(
    (state) => {
      setUploading(state);
      if (onUploadingChange) {
        onUploadingChange(state);
      }
    },
    [onUploadingChange],
  );

  // 🌟 BƯỚC 2: Hàm này giờ cực kỳ sạch sẽ và thỏa mãn hoàn toàn ESLint
  const processAndUploadFile = useCallback(
    async (file) => {
      if (!file) return;

      const maxFileSizeMb = 5;
      if (file.size > maxFileSizeMb * 1024 * 1024) {
        toast.error(`Ảnh không được vượt quá ${maxFileSizeMb}MB.`);
        return;
      }

      try {
        setUploadState(true);
        setProgress(0);
        let response;
        const uploadOptions = {
          onUploadProgress: (event) => {
            if (!event.total) return;
            setProgress(Math.min(100, Math.round((event.loaded * 100) / event.total)));
          },
        };

        if (publicRegister) {
          response = await uploadService.uploadRegisterAvatar(file, uploadOptions);
        } else {
          // Dùng object viết hoa khai báo bên ngoài scope component
          const uploadFn = UPLOAD_MAP[uploadType];
          if (!uploadFn) {
            throw new Error("Loại upload không hợp lệ.");
          }
          response = await uploadFn(file, uploadOptions);
        }

        const uploaded = response.data ?? response;
        onChange(uploaded.url);
        toast.success(response.message || "Upload ảnh thành công.");
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Upload ảnh thất bại."));
      } finally {
        setUploadState(false);
        setProgress(0);
      }
    },
    [publicRegister, uploadType, onChange, setUploadState],
  ); // UPLOAD_MAP ở ngoài nên không cần điền vào đây!

  // Cấu hình hook useDropzone
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (uploading) return;
      const file = acceptedFiles?.[0];
      processAndUploadFile(file);
    },
    [uploading, processAndUploadFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp"],
    },
    multiple: false,
    disabled: uploading,
  });

  const handleRemove = (e) => {
    e.stopPropagation();
    if (uploading) return;
    onChange(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <div
          {...getRootProps()}
          className={`relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 transition-all duration-200
            ${
              isDragActive
                ? "border-dashed border-green-500 bg-green-100 scale-105"
                : "border-green-200 bg-green-50 hover:border-green-400"
            } ${uploading ? "pointer-events-none opacity-80" : ""}`}
        >
          <input {...getInputProps()} />

          {value ? (
            <img
              src={value}
              alt="Preview"
              className="h-full w-full object-cover"
            />
          ) : isDragActive ? (
            <UploadCloud size={30} className="animate-bounce text-green-600" />
          ) : (
            <Camera size={30} className="text-green-500" />
          )}

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 size={28} className="animate-spin text-white" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            {...getRootProps()}
            disabled={uploading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-green-500 px-4 text-sm font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading && <Loader2 size={16} className="animate-spin" />}
            {uploading
              ? progress === 0
                ? "Đang tối ưu ảnh..."
                : progress < 100
                  ? `Đang tải ${progress}%`
                  : "Đang lưu ảnh..."
              : "Chọn hoặc Kéo ảnh vào đây"}
          </button>

          {value && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={16} />
              Xóa ảnh
            </button>
          )}
        </div>
      </div>

      <p className="text-xs font-medium text-gray-400">
        {isDragActive
          ? "Thả tay ra để upload ảnh ngay lập tức!"
          : "Hỗ trợ kéo thả hoặc click chọn: jpg, jpeg, png, webp. Tối đa 5MB."}
      </p>
    </div>
  );
}
