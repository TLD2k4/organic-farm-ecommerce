// src\services\farmService.js

import axiosClient from "../api/axiosClient";

const farmService = {
  // PUBLIC
  getAll(params = {}) {
    return axiosClient.get("/farms", {
      params,
    });
  },

  getBySlug(slug, params = {}) {
    return axiosClient.get(
      `/farms/${encodeURIComponent(slug)}`,
      {
        params,
      },
    );
  },

  // OWNER
  register(data) {
    return axiosClient.post(
      "/farms/register",
      data,
    );
  },

  getMyFarm() {
    return axiosClient.get("/farms/my");
  },

  update(id, data) {
    return axiosClient.put(
      `/farms/${id}`,
      data,
    );
  },

  resubmit(id) {
    return axiosClient.patch(
      `/farms/${id}/resubmit`,
    );
  },

  ownerForceDelete(id) {
    return axiosClient.delete(
      `/farms/${id}/force`,
    );
  },

  // ADMIN
  adminGetAll(params = {}) {
    return axiosClient.get(
      "/admin/farms",
      {
        params,
      },
    );
  },

  adminGetById(id) {
    return axiosClient.get(
      `/admin/farms/${id}`,
    );
  },

  approve(id) {
    return axiosClient.patch(
      `/admin/farms/${id}/approve`,
    );
  },

  reject(id, rejectionReason) {
    return axiosClient.patch(
      `/admin/farms/${id}/reject`,
      {
        rejection_reason: rejectionReason,
      },
    );
  },

  suspend(id, reason) {
    return axiosClient.patch(
      `/admin/farms/${id}/suspend`,
      { reason },
    );
  },

  reopen(id) {
    return axiosClient.patch(
      `/admin/farms/${id}/reopen`,
    );
  },

  delete(id, reason) {
    return axiosClient.delete(
      `/admin/farms/${id}`,
      { data: { reason } },
    );
  },

  restore(id) {
    return axiosClient.patch(
      `/admin/farms/${id}/restore`,
    );
  },

  forceDelete(id) {
    return axiosClient.delete(
      `/admin/farms/${id}/force`,
    );
  },
};

export default farmService;
