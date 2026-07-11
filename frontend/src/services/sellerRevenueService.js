import axiosClient from "../api/axiosClient";

const unwrapResponse = (response) => {
  if (response?.success !== undefined) {
    return response;
  }

  return response?.data ?? response;
};

const sellerRevenueService = {
  getReport: async (params = {}) => {
    const response = await axiosClient.get("/vendor/revenue", { params });
    return unwrapResponse(response);
  },
};

export default sellerRevenueService;