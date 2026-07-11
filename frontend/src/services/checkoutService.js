// src/services/checkoutService.js

import axiosClient from "../api/axiosClient";

const unwrapResponse = (response) => {
  if (response?.success !== undefined) return response;
  return response?.data ?? response;
};

const checkoutService = {
  checkout: async (payload) => {
    const response = await axiosClient.post("/checkout", payload);
    return unwrapResponse(response);
  },
};

export default checkoutService;