import axiosClient from "../api/axiosClient";

const certificationService = {
  // PUBLIC
  getAll(params) {
    return axiosClient.get("/certifications", { params });
  },

  getById(id) {
    return axiosClient.get(`/certifications/${id}`);
  },

  // ADMIN
  adminGetAll(params) {
    return axiosClient.get("/admin/certifications", { params });
  },

  adminGetById(id) {
    return axiosClient.get(`/admin/certifications/${id}`);
  },

  create(data) {
    return axiosClient.post("/admin/certifications", data);
  },

  update(id, data) {
    return axiosClient.put(`/admin/certifications/${id}`, data);
  },

  toggleStatus(id) {
    return axiosClient.patch(`/admin/certifications/${id}/toggle-status`);
  },

  delete(id) {
    return axiosClient.delete(`/admin/certifications/${id}`);
  },

  forceDelete(id) {
    return axiosClient.delete(`/admin/certifications/${id}/force`);
  },

  restore(id) {
    return axiosClient.patch(`/admin/certifications/${id}/restore`);
  },
};

export default certificationService;