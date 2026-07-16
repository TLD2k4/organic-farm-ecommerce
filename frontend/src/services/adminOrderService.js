import axiosClient from "../api/axiosClient";

function unwrapResponse(response) {
  if (response?.success !== undefined) return response;
  return response?.data ?? response;
}

function removeEmptyParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      return value !== null && value !== undefined && value !== "";
    }),
  );
}

const adminOrderService = {
  async getOptions() {
    const response = await axiosClient.get("/admin/orders/options");
    return unwrapResponse(response);
  },

  async getOrders(params = {}) {
    const response = await axiosClient.get("/admin/orders", {
      params: removeEmptyParams(params),
    });
    return unwrapResponse(response);
  },

  async getOrder(id) {
    const response = await axiosClient.get(
      `/admin/orders/${encodeURIComponent(id)}`,
    );
    return unwrapResponse(response);
  },

  async cancelOrder(id, reason) {
    const response = await axiosClient.patch(
      `/admin/orders/${encodeURIComponent(id)}/cancel`,
      { reason },
    );
    return unwrapResponse(response);
  },

  async getSubOrders(params = {}) {
    const response = await axiosClient.get("/admin/sub-orders", {
      params: removeEmptyParams(params),
    });
    return unwrapResponse(response);
  },

  async getSubOrder(id) {
    const response = await axiosClient.get(
      `/admin/sub-orders/${encodeURIComponent(id)}`,
    );
    return unwrapResponse(response);
  },

  async updateSubOrderStatus(id, payload) {
    const response = await axiosClient.patch(
      `/admin/sub-orders/${encodeURIComponent(id)}/status`,
      payload,
    );
    return unwrapResponse(response);
  },
};

export default adminOrderService;
