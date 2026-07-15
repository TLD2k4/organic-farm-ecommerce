import axiosClient from "../api/axiosClient";

const adminProductService = {
  getAll(params = {}) {
    return axiosClient.get("/admin/products", { params });
  },

  getOptions() {
    return axiosClient.get("/admin/products/options");
  },

  getById(id) {
    return axiosClient.get(
      `/admin/products/${encodeURIComponent(id)}`,
    );
  },

  approveProduct(id, payload = {}) {
    return axiosClient.patch(
      `/admin/products/${encodeURIComponent(id)}/approve`,
      payload,
    );
  },

  rejectProduct(id, rejectionReason) {
    return axiosClient.patch(
      `/admin/products/${encodeURIComponent(id)}/reject`,
      {
        rejection_reason: rejectionReason,
      },
    );
  },

  suspendProduct(id, reason) {
    return axiosClient.patch(`/admin/products/${encodeURIComponent(id)}/suspend`, { reason });
  },

  reopenProduct(id) {
    return axiosClient.patch(`/admin/products/${encodeURIComponent(id)}/reopen`);
  },

  approveCertificate(productId, certificateId) {
    return axiosClient.patch(
      `/admin/products/${encodeURIComponent(productId)}/certificates/${encodeURIComponent(certificateId)}/approve`,
    );
  },

  rejectCertificate(
    productId,
    certificateId,
    rejectionReason,
  ) {
    return axiosClient.patch(
      `/admin/products/${encodeURIComponent(productId)}/certificates/${encodeURIComponent(certificateId)}/reject`,
      {
        rejection_reason: rejectionReason,
      },
    );
  },
};

export default adminProductService;
