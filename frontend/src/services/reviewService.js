import axiosClient from "../api/axiosClient";

const unwrapResponse = (response) => {
  if (response?.success !== undefined) {
    return response;
  }

  return response?.data ?? response;
};

const reviewService = {
  getMyReviews: async () => {
    const response = await axiosClient.get("/my-reviews");
    return unwrapResponse(response);
  },

  getReviewableItems: async () => {
    const response = await axiosClient.get("/my-reviews/reviewable-items");
    return unwrapResponse(response);
  },

  createReview: async (payload) => {
    const response = await axiosClient.post("/reviews", payload);
    return unwrapResponse(response);
  },

  updateReview: async (id, payload) => {
    const response = await axiosClient.put(`/reviews/${id}`, payload);
    return unwrapResponse(response);
  },

  deleteReview: async (id) => {
    const response = await axiosClient.delete(`/reviews/${id}`);
    return unwrapResponse(response);
  },

  
};

export default reviewService;