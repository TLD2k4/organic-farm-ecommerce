import axiosClient from "../api/axiosClient";

const harvestLotService = {
  getOptions() {
    return axiosClient.get("/vendor/harvest-lots/options");
  },

  getLots(params = {}) {
    return axiosClient.get("/vendor/harvest-lots", { params });
  },

  getLot(id) {
    return axiosClient.get(`/vendor/harvest-lots/${id}`);
  },

  createLot(payload) {
    return axiosClient.post("/vendor/harvest-lots", payload);
  },

  updateLot(id, payload) {
    return axiosClient.put(`/vendor/harvest-lots/${id}`, payload);
  },

  deleteLot(id) {
    return axiosClient.delete(`/vendor/harvest-lots/${id}`);
  },

  restoreLot(id) {
    return axiosClient.patch(`/vendor/harvest-lots/${id}/restore`);
  },

  forceDeleteLot(id) {
    return axiosClient.delete(`/vendor/harvest-lots/${id}/force`);
  },
};

export default harvestLotService;