import axiosClient from "../api/axiosClient";

const unwrapResponse = (response) => {
  if (response?.success !== undefined) {
    return response;
  }

  return response?.data ?? response;
};

const sellerReviewService = {
  getReviews: async (params = {}) => {
    const response = await axiosClient.get("/vendor/reviews", { params });
    return unwrapResponse(response);
  },

  updateStatus: async (id, status, reason = null) => {
    const response = await axiosClient.patch(`/vendor/reviews/${id}/status`, {
      status,
      reason,
    });

    return unwrapResponse(response);
  },

  reply: async (id, comment) => {
    const response = await axiosClient.post(`/vendor/reviews/${id}/replies`, {
      comment,
    });

    return unwrapResponse(response);
  },

  createProductComment: async (productId, comment) => unwrapResponse(
    await axiosClient.post(`/vendor/products/${productId}/comments`, { comment }),
  ),
};

export default sellerReviewService;
