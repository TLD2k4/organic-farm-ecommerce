import { create } from "zustand";

import adminProductService from "../services/adminProductService";

const emptyStats = {
  total: 0,
  pending_products: 0,
  active_products: 0,
  rejected_products: 0,
  pending_certificates: 0,
  expired_certificate_products: 0,
};

const emptyOptions = {
  farms: [],
  categories: [],
};

export const useAdminProductStore = create((set) => ({
  products: [],
  product: null,
  meta: null,
  stats: emptyStats,
  options: emptyOptions,

  listLoading: false,
  detailLoading: false,
  optionsLoading: false,
  actionLoading: false,

  getAll: async (params = {}) => {
    set({ listLoading: true });

    try {
      const response = await adminProductService.getAll(params);

      set({
        products: Array.isArray(response?.data)
          ? response.data
          : [],
        meta: response?.meta ?? null,
        stats: {
          ...emptyStats,
          ...(response?.stats ?? {}),
        },
      });

      return response;
    } finally {
      set({ listLoading: false });
    }
  },

  getOptions: async () => {
    set({ optionsLoading: true });

    try {
      const response = await adminProductService.getOptions();

      set({
        options: {
          farms: Array.isArray(response?.data?.farms)
            ? response.data.farms
            : [],
          categories: Array.isArray(
            response?.data?.categories,
          )
            ? response.data.categories
            : [],
        },
      });

      return response;
    } finally {
      set({ optionsLoading: false });
    }
  },

  getById: async (id) => {
    set({
      detailLoading: true,
      product: null,
    });

    try {
      const response = await adminProductService.getById(id);

      set({
        product: response?.data ?? null,
      });

      return response;
    } finally {
      set({ detailLoading: false });
    }
  },

  approveProduct: async (id, payload = {}) => {
    set({ actionLoading: true });

    try {
      const response = await adminProductService.approveProduct(
        id,
        payload,
      );

      set({ product: response?.data ?? null });

      return response;
    } finally {
      set({ actionLoading: false });
    }
  },

  rejectProduct: async (id, reason) => {
    set({ actionLoading: true });

    try {
      const response = await adminProductService.rejectProduct(
        id,
        reason,
      );

      set({ product: response?.data ?? null });

      return response;
    } finally {
      set({ actionLoading: false });
    }
  },

  approveCertificate: async (productId, certificateId) => {
    set({ actionLoading: true });

    try {
      const response =
        await adminProductService.approveCertificate(
          productId,
          certificateId,
        );

      set({ product: response?.data ?? null });

      return response;
    } finally {
      set({ actionLoading: false });
    }
  },

  rejectCertificate: async (
    productId,
    certificateId,
    reason,
  ) => {
    set({ actionLoading: true });

    try {
      const response =
        await adminProductService.rejectCertificate(
          productId,
          certificateId,
          reason,
        );

      set({ product: response?.data ?? null });

      return response;
    } finally {
      set({ actionLoading: false });
    }
  },

  clearProduct: () => {
    set({ product: null });
  },
}));
