// src\services\authService.js

import axiosClient from "../api/axiosClient";

const authService = {
  register(data) {
    return axiosClient.post("/register", data);
  },

  login(data) {
    return axiosClient.post("/login", data);
  },

  profile() {
    return axiosClient.get("/profile");
  },

  updateProfile(data) {
    return axiosClient.put("/profile", data);
  },

  changePassword(data) {
    return axiosClient.post("/change-password", data);
  },

  logout() {
    return axiosClient.post("/logout");
  },

  logoutAll() {
    return axiosClient.post("/logout-all");
  },
};

export default authService;