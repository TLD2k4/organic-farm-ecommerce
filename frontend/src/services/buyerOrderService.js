import axiosClient from "../api/axiosClient";

const unwrapResponse = (response) => {
  if (response?.success !== undefined) {
    return response;
  }

  return response?.data ?? response;
};

const buyerOrderService = {
  getOrders: async (params = {}) => {
    const response = await axiosClient.get("/orders", {
      params: removeEmptyParams(params),
    });

    return unwrapResponse(response);
  },

  getOrder: async (id) => {
    const response = await axiosClient.get(`/orders/${id}`);

    return unwrapResponse(response);
  },

  cancelOrder: async (id, cancelReason = "") => {
    const response = await axiosClient.patch(`/orders/${id}/cancel`, {
      cancel_reason: cancelReason || null,
    });

    return unwrapResponse(response);
  },
};

function removeEmptyParams(params) {
  const cleanParams = {};

  Object.keys(params).forEach((key) => {
    const value = params[key];

    if (value !== null && value !== undefined && value !== "") {
      cleanParams[key] = value;
    }
  });

  return cleanParams;
}

export default buyerOrderService;