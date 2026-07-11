import axiosClient from "../api/axiosClient";

const userService = {
  // ADMIN
  getAll(params) {
    return axiosClient.get("/admin/users", { params });
  },

  getById(id) {
    return axiosClient.get(`/admin/users/${id}`);
  },

  toggleStatus(id) {
    return axiosClient.patch(`/admin/users/${id}/status`);
  },

  delete(id) {
    return axiosClient.delete(`/admin/users/${id}`);
  },

  forceDelete(id) {
    return axiosClient.delete(`/admin/users/${id}/force`);
  },

  restore(id) {
    return axiosClient.patch(`/admin/users/${id}/restore`);
  },
};

export default userService;