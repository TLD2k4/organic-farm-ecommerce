// src/services/categoryService.js

import axiosClient from "../api/axiosClient";

const categoryService = {
  // PUBLIC
  getAll(params = {}) {
    return axiosClient.get("/categories", { params });
  },

  getBySlug(slug) {
    return axiosClient.get(
      `/categories/${encodeURIComponent(slug)}`,
    );
  },

  // ADMIN
  adminGetAll(params = {}) {
    return axiosClient.get("/admin/categories", {
      params,
    });
  },

  adminGetById(id) {
    return axiosClient.get(`/admin/categories/${id}`);
  },

  create(data) {
    return axiosClient.post("/admin/categories", data);
  },

  update(id, data) {
    return axiosClient.put(`/admin/categories/${id}`, data);
  },

  toggleStatus(id) {
    return axiosClient.patch(
      `/admin/categories/${id}/toggle-status`,
    );
  },

  delete(id) {
    return axiosClient.delete(`/admin/categories/${id}`);
  },

  forceDelete(id) {
    return axiosClient.delete(
      `/admin/categories/${id}/force`,
    );
  },

  restore(id) {
    return axiosClient.patch(
      `/admin/categories/${id}/restore`,
    );
  },
};

export default categoryService;