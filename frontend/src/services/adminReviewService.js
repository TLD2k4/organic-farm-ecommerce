import axiosClient from "../api/axiosClient";

const adminReviewService = {
  getReviews(params = {}) {
    return axiosClient.get("/admin/reviews", { params });
  },

  updateStatus(id, status, reason = null) {
    return axiosClient.patch(`/admin/reviews/${id}/status`, {
      status,
      reason,
    });
  },

  deleteReview(id, reason) {
    return axiosClient.delete(`/admin/reviews/${id}`, {
      data: { reason },
    });
  },

  restoreReview(id) {
    return axiosClient.patch(`/admin/reviews/${id}/restore`);
  },

  reply(id, comment) {
    return axiosClient.post(`/admin/reviews/${id}/replies`, { comment });
  },

  createProductComment(productId, comment) {
    return axiosClient.post(`/admin/products/${productId}/comments`, {
      comment,
    });
  },
};

export default adminReviewService;
