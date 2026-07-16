import axiosClient from "@/api/axiosClient";

const sellerPolicyService = {
  current: () => axiosClient.get("/seller-policies/current"),
  status: () => axiosClient.get("/seller-policy/status"),
  history: () => axiosClient.get("/seller-policy/history"),
  accept: (policy) =>
    axiosClient.post("/seller-policy/accept", {
      policy_accepted: true,
      seller_policy_id: policy.id,
      policy_version: policy.version,
    }),
};

export default sellerPolicyService;
