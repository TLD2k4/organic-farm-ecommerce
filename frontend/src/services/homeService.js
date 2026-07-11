import axiosClient from "../api/axiosClient";

const homeService = {
  getHome(params = {}) {
    return axiosClient.get("/home", { params });
  },
};

export default homeService;