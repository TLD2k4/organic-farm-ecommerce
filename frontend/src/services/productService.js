import axiosClient from "../api/axiosClient";

const productService = {
  // =========================
  // PUBLIC PRODUCTS
  // dùng cho trang /products
  // =========================

  getProducts(params = {}) {
    return axiosClient.get("/products", { params });
  },

  getFilterOptions() {
    return axiosClient.get("/products/filters");
  },

  getProduct(id) {
  return axiosClient.get(`/products/${id}`);
  },

  getProductReviews(id, params = {}) {
  return axiosClient.get(`/products/${id}/reviews`, { params });
},

  // =========================
  // SELLER PRODUCTS
  // dùng cho seller quản lý sản phẩm
  // =========================

  getOptions() {
    return axiosClient.get("/vendor/products/options");
  },


  getSellerProducts(params = {}) {
    return axiosClient.get("/vendor/products", { params });
  },

  getSellerProduct(id) {
    return axiosClient.get(`/vendor/products/${id}`);
  },

  createSellerProduct(payload) {
    return axiosClient.post("/vendor/products", payload);
  },

  updateSellerProduct(id, payload) {
    return axiosClient.put(`/vendor/products/${id}`, payload);
  },

  deleteSellerProduct(id) {
    return axiosClient.delete(`/vendor/products/${id}`);
  },

  toggleStatus(id) {
    return axiosClient.patch(`/vendor/products/${id}/toggle-status`);
  },

  renewCertificate(id, payload) {
    return axiosClient.post(`/vendor/products/${id}/certificates/renew`, payload);
  },
};

export default productService;