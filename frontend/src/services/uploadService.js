import axiosClient from "../api/axiosClient";
import { optimizeImageForUpload } from "../utils/imageUpload";

const unwrapResponse = (response) => {
  if (response?.success !== undefined) {
    return response;
  }

  return response?.data ?? response;
};

const uploadService = {
  uploadFile: async (file, type, options = {}) => {
    const formData = new FormData();
    const optimizedFile = await optimizeImageForUpload(file, type);

    formData.append("file", optimizedFile);
    formData.append("type", type);

    const response = await axiosClient.post("/uploads", formData, {
      onUploadProgress: options.onUploadProgress,
    });

    return unwrapResponse(response);
  },

  uploadRegisterAvatar: async (file, options = {}) => {
    const formData = new FormData();
    const optimizedFile = await optimizeImageForUpload(file, "register_avatar");

    formData.append("file", optimizedFile);

    const response = await axiosClient.post("/uploads/register-avatar", formData, {
      onUploadProgress: options.onUploadProgress,
    });

    return unwrapResponse(response);
  },

  uploadUserAvatar: async (file, options) => {
    return uploadService.uploadFile(file, "user_avatar", options);
  },

  uploadFarmLogo: async (file, options) => {
    return uploadService.uploadFile(file, "farm_logo", options);
  },

  uploadFarmCover: async (file, options) => {
    return uploadService.uploadFile(file, "farm_cover", options);
  },
  
  uploadProductThumbnail: async (file, options) => {
    return uploadService.uploadFile(file, "product_thumbnail", options);
  },

  uploadProductDetail: async (file, options) => {
    return uploadService.uploadFile(file, "product_detail", options);
  },

  uploadCategoryImage: async (file, options) => {
    return uploadService.uploadFile(
      file,
      "category_image",
      options,
    );
  },

  uploadCertificateFile: async (file, options) => {
    return uploadService.uploadFile(file, "certificate_file", options);
  },
};

export default uploadService;
