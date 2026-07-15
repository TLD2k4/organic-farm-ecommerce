// src/api/axiosClient.js

import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const axiosClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 401) {
      localStorage.removeItem("access_token");

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    // Giữ nguyên AxiosError để các màn hình cũ vẫn đọc được
    // error.response.data, đồng thời đưa message/errors của backend lên
    // top-level cho các form mới. Trước đây reject(data) làm mất status,
    // headers và khiến nhiều nơi chỉ hiện thông báo lỗi chung chung.
    if (data && typeof data === "object") {
      Object.assign(error, data);

      const backendMessage = data.message || data.error;

      if (backendMessage) {
        error.message = backendMessage;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
