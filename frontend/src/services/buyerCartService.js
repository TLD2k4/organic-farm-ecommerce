import axiosClient from "../api/axiosClient";

const unwrapResponse = (response) => {
  if (response?.success !== undefined) {
    return response;
  }

  return response?.data ?? response;
};

const buyerCartService = {
  getCart: async () => {
    const response = await axiosClient.get("/cart");
    return unwrapResponse(response);
  },

  addItem: async (productId, quantity = 1) => {
    const response = await axiosClient.post("/cart/items", {
      product_id: productId,
      quantity,
    });

    return unwrapResponse(response);
  },

  updateItem: async (cartItemId, quantity) => {
    const response = await axiosClient.put(`/cart/items/${cartItemId}`, {
      quantity,
    });

    return unwrapResponse(response);
  },

  removeItem: async (cartItemId) => {
    const response = await axiosClient.delete(`/cart/items/${cartItemId}`);
    return unwrapResponse(response);
  },

  clearCart: async () => {
    const response = await axiosClient.delete("/cart");
    return unwrapResponse(response);
  },
};

export default buyerCartService;