import axiosClient from "../api/axiosClient";

const unwrapResponse = (response) => {
  if (response?.success !== undefined) {
    return response;
  }

  return response?.data ?? response;
};

const sellerOrderService = {
  getOrders: async (params = {}) => {
    const cleanParams = removeEmptyParams(params);

    const response = await axiosClient.get("/vendor/orders", {
      params: cleanParams,
    });

    return unwrapResponse(response);
  },

  getOrder: async (id) => {
    const response = await axiosClient.get(`/vendor/orders/${id}`);

    return unwrapResponse(response);
  },

  updateStatus: async (id, data) => {
    const response = await axiosClient.patch(
      `/vendor/orders/${id}/status`,
      data
    );

    return unwrapResponse(response);
  },

  prepareOrder: async (id, sellerNote = null) => {
    return sellerOrderService.updateStatus(id, {
      status: 1,
      seller_note: sellerNote,
    });
  },

  shipOrder: async (id, sellerNote = null) => {
    return sellerOrderService.updateStatus(id, {
      status: 2,
      seller_note: sellerNote,
    });
  },

  completeOrder: async (id, sellerNote = null) => {
    return sellerOrderService.updateStatus(id, {
      status: 3,
      seller_note: sellerNote,
    });
  },

  cancelOrder: async (id, sellerNote = null) => {
    return sellerOrderService.updateStatus(id, {
      status: 4,
      seller_note: sellerNote,
    });
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

export default sellerOrderService;