import axiosClient from "../api/axiosClient";

const userService = {
  // ADMIN
  getAll(params) {
    return axiosClient.get("/admin/users", { params });
  },

  getById(id) {
    return axiosClient.get(`/admin/users/${id}`);
  },

  toggleStatus(id, reason) {
    return axiosClient.patch(`/admin/users/${id}/status`, { reason });
  },

  delete(id, reason) {
    return axiosClient.delete(`/admin/users/${id}`, { data: { reason } });
  },

  forceDelete(id, reason) {
    return axiosClient.delete(`/admin/users/${id}/force`, { data: { reason } });
  },

  restore(id) {
    return axiosClient.patch(`/admin/users/${id}/restore`);
  },
};

export default userService;
