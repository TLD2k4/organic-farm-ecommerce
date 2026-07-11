// src/services/dashboardService.js

import axiosClient from "@/api/axiosClient";

const dashboardService = {
  // ================= SELLER DASHBOARD =================

  getSellerDashboard(params = {}) {
    return axiosClient.get("/vendor/dashboard", {
      params,
    });
  },

  // ================= ADMIN DASHBOARD =================

  getAdminDashboard(params = {}) {
    return axiosClient.get("/admin/dashboard", {
      params,
    });
  },
};

export default dashboardService;