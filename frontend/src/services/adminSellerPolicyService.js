import axiosClient from "@/api/axiosClient";

const adminSellerPolicyService = {
  index: (params = {}) => axiosClient.get("/admin/seller-policies", { params }),
  show: (id) => axiosClient.get(`/admin/seller-policies/${id}`),
  create: (data) => axiosClient.post("/admin/seller-policies", data),
  update: (id, data) => axiosClient.put(`/admin/seller-policies/${id}`, data),
  publish: (id, reason, expectedCurrentPolicyId) => axiosClient.post(`/admin/seller-policies/${id}/publish`, { reason, expected_current_policy_id: expectedCurrentPolicyId || null }),
  remove: (id) => axiosClient.delete(`/admin/seller-policies/${id}`),
};

export default adminSellerPolicyService;
