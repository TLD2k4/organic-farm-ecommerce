import { create } from "zustand";

import dashboardService from "@/services/dashboardService";

const initialData = {
  period: {
    days: 30,
    from_date: null,
    to_date: null,
  },

  cards: {
    total_users: 0,
    total_farms: 0,
    pending_farms: 0,
    total_products: 0,
    active_products: 0,
    hidden_products: 0,
    total_orders: 0,
    today_orders: 0,
    total_revenue: 0,
    total_reviews: 0,
  },

  chart: [],
  recent_orders: [],
  recent_farms: [],
};

const useAdminDashboardStore = create((set, get) => ({
  dashboard: initialData,

  loading: false,
  error: null,

  days: 30,

  setDays: (days) => {
    set({
      days: Number(days),
    });
  },

  getDashboard: async (params = {}) => {
    const selectedDays = Number(params.days ?? get().days ?? 30);

    set({
      loading: true,
      error: null,
    });

    try {
      const response = await dashboardService.getAdminDashboard({
        days: selectedDays,
      });

      set({
        dashboard: {
          ...initialData,
          ...(response?.data || {}),
          period: {
            ...initialData.period,
            ...(response?.data?.period || {}),
          },
          cards: {
            ...initialData.cards,
            ...(response?.data?.cards || {}),
          },
          chart: Array.isArray(response?.data?.chart)
            ? response.data.chart
            : [],
          recent_orders: Array.isArray(response?.data?.recent_orders)
            ? response.data.recent_orders
            : [],
          recent_farms: Array.isArray(response?.data?.recent_farms)
            ? response.data.recent_farms
            : [],
        },

        days: selectedDays,
      });

      return response;
    } catch (error) {
      set({
        error:
          error?.message ||
          "Không thể tải dữ liệu tổng quan hệ thống.",
      });

      throw error;
    } finally {
      set({
        loading: false,
      });
    }
  },

  resetDashboard: () => {
    set({
      dashboard: initialData,
      loading: false,
      error: null,
      days: 30,
    });
  },
}));

export default useAdminDashboardStore;