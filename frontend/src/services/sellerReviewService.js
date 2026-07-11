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

  updateStatus: async (id, status) => {
    const response = await axiosClient.patch(`/vendor/reviews/${id}/status`, {
      status,
    });

    return unwrapResponse(response);
  },
};

export default sellerReviewService;