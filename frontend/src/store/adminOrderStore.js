import { create } from "zustand";
import adminOrderService from "../services/adminOrderService";

function getPayload(response) {
  return response?.data ?? response ?? {};
}

export const useAdminOrderStore = create((set) => ({
  options: { farms: [] },

  orders: [],
  orderStats: {},
  orderMeta: null,

  subOrders: [],
  subOrderStats: {},
  subOrderMeta: null,

  selectedOrder: null,
  selectedSubOrder: null,

  loading: false,
  optionsLoading: false,
  detailLoading: false,
  actionLoading: false,

  getOptions: async () => {
    set({ optionsLoading: true });
    try {
      const response = await adminOrderService.getOptions();
      const payload = getPayload(response);
      set({
        options: {
          farms: Array.isArray(payload.farms) ? payload.farms : [],
        },
      });
      return response;
    } finally {
      set({ optionsLoading: false });
    }
  },

  getOrders: async (params = {}) => {
    set({ loading: true });
    try {
      const response = await adminOrderService.getOrders(params);
      const payload = getPayload(response);
      set({
        orders: Array.isArray(payload.orders) ? payload.orders : [],
        orderStats: payload.stats ?? {},
        orderMeta: payload.meta ?? null,
      });
      return response;
    } finally {
      set({ loading: false });
    }
  },

  getOrder: async (id) => {
    set({ detailLoading: true, selectedOrder: null });
    try {
      const response = await adminOrderService.getOrder(id);
      set({ selectedOrder: getPayload(response) });
      return response;
    } finally {
      set({ detailLoading: false });
    }
  },

  cancelOrder: async (id, reason) => {
    set({ actionLoading: true });
    try {
      const response = await adminOrderService.cancelOrder(id, reason);
      set({ selectedOrder: getPayload(response) });
      return response;
    } finally {
      set({ actionLoading: false });
    }
  },

  getSubOrders: async (params = {}) => {
    set({ loading: true });
    try {
      const response = await adminOrderService.getSubOrders(params);
      const payload = getPayload(response);
      set({
        subOrders: Array.isArray(payload.sub_orders)
          ? payload.sub_orders
          : [],
        subOrderStats: payload.stats ?? {},
        subOrderMeta: payload.meta ?? null,
      });
      return response;
    } finally {
      set({ loading: false });
    }
  },

  getSubOrder: async (id) => {
    set({ detailLoading: true, selectedSubOrder: null });
    try {
      const response = await adminOrderService.getSubOrder(id);
      set({ selectedSubOrder: getPayload(response) });
      return response;
    } finally {
      set({ detailLoading: false });
    }
  },

  updateSubOrderStatus: async (id, payload) => {
    set({ actionLoading: true });
    try {
      const response = await adminOrderService.updateSubOrderStatus(id, payload);
      set({ selectedSubOrder: getPayload(response) });
      return response;
    } finally {
      set({ actionLoading: false });
    }
  },

  clearSelectedOrder: () => set({ selectedOrder: null }),
  clearSelectedSubOrder: () => set({ selectedSubOrder: null }),
}));
