import axiosClient from "../api/axiosClient";

const notificationService = {
  getAll(params = {}) {
    return axiosClient.get("/notifications", { params });
  },

  markAsRead(id) {
    return axiosClient.patch(`/notifications/${id}/read`);
  },

  markAllAsRead() {
    return axiosClient.patch("/notifications/read-all");
  },
};

export default notificationService;
