import axiosClient from "@/api/axiosClient";

const reportService = {
  getAdminReports(params = {}) {
    return axiosClient.get("/admin/reports", {
      params,
    });
  },
};

export default reportService;