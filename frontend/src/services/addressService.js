import axiosClient from "../api/axiosClient";

const unwrapResponse = (response) => {
  if (response?.success !== undefined) {
    return response;
  }

  return response?.data ?? response;
};

const addressService = {
  getMyAddresses: async () => {
    const response = await axiosClient.get("/addresses");
    return unwrapResponse(response);
  },

  createAddress: async (payload) => {
    const response = await axiosClient.post("/addresses", payload);
    return unwrapResponse(response);
  },

  updateAddress: async (id, payload) => {
    const response = await axiosClient.put(`/addresses/${id}`, payload);
    return unwrapResponse(response);
  },

  deleteAddress: async (id) => {
    const response = await axiosClient.delete(`/addresses/${id}`);
    return unwrapResponse(response);
  },

  setDefaultAddress: async (id) => {
    const response = await axiosClient.patch(`/addresses/${id}/default`);
    return unwrapResponse(response);
  },
};

export default addressService;