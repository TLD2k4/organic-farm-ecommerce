import axiosClient from "../api/axiosClient";

const unwrapResponse = (response) => {
  if (response?.success !== undefined) {
    return response;
  }

  return response?.data ?? response;
};

const uploadService = {
  uploadFile: async (file, type) => {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("type", type);

    const response = await axiosClient.post("/uploads", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return unwrapResponse(response);
  },

  uploadRegisterAvatar: async (file) => {
    const formData = new FormData();

    formData.append("file", file);

    const response = await axiosClient.post("/uploads/register-avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return unwrapResponse(response);
  },

  uploadUserAvatar: async (file) => {
    return uploadService.uploadFile(file, "user_avatar");
  },

  uploadFarmLogo: async (file) => {
    return uploadService.uploadFile(file, "farm_logo");
  },

  uploadFarmCover: async (file) => {
    return uploadService.uploadFile(file, "farm_cover");
  },
  
  uploadProductThumbnail: async (file) => {
    return uploadService.uploadFile(file, "product_thumbnail");
  },

  uploadProductDetail: async (file) => {
    return uploadService.uploadFile(file, "product_detail");
  },

  uploadCategoryImage: async (file) => {
    return uploadService.uploadFile(
      file,
      "category_image",
    );
  },

  uploadCertificateFile: async (file) => {
    return uploadService.uploadFile(file, "certificate_file");
  },
};

export default uploadService;