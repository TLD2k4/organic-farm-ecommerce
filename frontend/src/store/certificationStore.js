// src/store/certificationStore.js

import { create } from "zustand";
import certificationService from "../services/certificationService";

export const useCertificationStore = create((set) => ({
  certifications: [],
  certification: null,
  meta: null,
  loading: false,

  // PUBLIC
  getAll: async (params = {}) => {
    set({ loading: true });

    try {
      const res = await certificationService.getAll(params);

      set({
        certifications: res.data,
        meta: res.meta,
      });

      return res;
    } finally {
      set({ loading: false });
    }
  },

  getById: async (id) => {
    set({
      loading: true,
      certification: null,
    });

    try {
      const res = await certificationService.getById(id);

      set({
        certification: res.data,
      });

      return res;
    } finally {
      set({
        loading: false,
      });
    }
  },

  // ADMIN
  adminGetAll: async (params = {}) => {
    set({ loading: true });

    try {
      const res = await certificationService.adminGetAll(params);

      set({
        certifications: res.data,
        meta: res.meta,
      });

      return res;
    } finally {
      set({ loading: false });
    }
  },

  adminGetById: async (id) => {
    set({
      loading: true,
      certification: null,
    });

    try {
      const res = await certificationService.adminGetById(id);

      set({
        certification: res.data,
      });

      return res;
    } finally {
      set({
        loading: false,
      });
    }
  },

  create: (data) => certificationService.create(data),

  update: (id, data) => certificationService.update(id, data),

  toggleStatus: (id) => certificationService.toggleStatus(id),

  delete: (id) => certificationService.delete(id),

  forceDelete: (id) => certificationService.forceDelete(id),

  restore: (id) => certificationService.restore(id),
}));