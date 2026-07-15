import { create } from "zustand";
import dayjs from "dayjs";

import reportService from "@/services/reportService";

export const ADMIN_REPORT_DEFAULT_FILTERS = {
  from_date: dayjs()
    .subtract(29, "day")
    .format("YYYY-MM-DD"),

  to_date: dayjs().format("YYYY-MM-DD"),

  group_by: "day",

  limit: 10,
};

const createInitialReport = () => ({
  filters: {
    ...ADMIN_REPORT_DEFAULT_FILTERS,
  },

  summary: {
    revenue: 0,
    total_orders: 0,
    total_sub_orders: 0,
    paid_orders: 0,
    completed_orders: 0,
    cancelled_orders: 0,
    average_order_value: 0,
    completion_rate: 0,
    cancellation_rate: 0,
    new_users: 0,
    total_items_sold: 0,
  },

  chart: [],

  top_products: [],

  top_categories: [],

  top_farms: [],
});

const useAdminReportStore = create((set, get) => ({
  report: createInitialReport(),

  filters: {
    ...ADMIN_REPORT_DEFAULT_FILTERS,
  },

  loading: false,

  error: null,

  setFilters: (newFilters) => {
    set((state) => ({
      filters: {
        ...state.filters,
        ...newFilters,
      },
    }));
  },

  getReport: async (params = {}) => {
    const requestFilters = {
      ...get().filters,
      ...params,
    };

    requestFilters.limit = Number(
      requestFilters.limit || 10,
    );

    set({
      loading: true,
      error: null,
    });

    try {
      const response =
        await reportService.getAdminReports(
          requestFilters,
        );

      const data = response?.data || {};

      const initialReport =
        createInitialReport();

      const responseFilters = {
        ...requestFilters,
        ...(data.filters || {}),
      };

      responseFilters.limit = Number(
        responseFilters.limit || 10,
      );

      set({
        report: {
          ...initialReport,
          ...data,

          filters: {
            ...initialReport.filters,
            ...(data.filters || {}),
          },

          summary: {
            ...initialReport.summary,
            ...(data.summary || {}),
          },

          chart: Array.isArray(data.chart)
            ? data.chart
            : [],

          top_products: Array.isArray(
            data.top_products,
          )
            ? data.top_products
            : [],

          top_categories: Array.isArray(
            data.top_categories,
          )
            ? data.top_categories
            : [],

          top_farms: Array.isArray(
            data.top_farms,
          )
            ? data.top_farms
            : [],
        },

        filters: responseFilters,
      });

      return response;
    } catch (error) {
      set({
        error:
          error?.message ||
          "Không thể tải báo cáo thống kê.",
      });

      throw error;
    } finally {
      set({
        loading: false,
      });
    }
  },

  resetReport: () => {
    set({
      report: createInitialReport(),

      filters: {
        ...ADMIN_REPORT_DEFAULT_FILTERS,
      },

      loading: false,

      error: null,
    });
  },
}));

export default useAdminReportStore;
