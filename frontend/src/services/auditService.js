import axiosClient from "../api/axiosClient";

const auditService = {
  getAdminLogs(params = {}) {
    return axiosClient.get("/admin/audit-logs", { params });
  },

  getMyActivity() {
    return axiosClient.get("/activity");
  },
};

export default auditService;
