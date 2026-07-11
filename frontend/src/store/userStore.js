// src/store/userStore.js

import { create } from "zustand";

import userService from "../services/userService";

export const useUserStore = create((set) => ({
  users: [],
  user: null,
  meta: null,
  loading: false,
  detailLoading: false,

  getAll: async (params = {}) => {
    set({
      loading: true,
    });

    try {
      const res =
        await userService.getAll(params);

      set({
        users: Array.isArray(res?.data)
          ? res.data
          : [],

        meta: res?.meta ?? null,
      });

      return res;
    } finally {
      set({
        loading: false,
      });
    }
  },

  getById: async (id) => {
    set({
      detailLoading: true,
      user: null,
    });

    try {
      const res =
        await userService.getById(id);

      set({
        user: res?.data ?? null,
      });

      return res;
    } finally {
      set({
        detailLoading: false,
      });
    }
  },

  toggleStatus: async (id) => {
    return userService.toggleStatus(id);
  },

  delete: async (id) => {
    return userService.delete(id);
  },

  forceDelete: async (id) => {
    return userService.forceDelete(id);
  },

  restore: async (id) => {
    return userService.restore(id);
  },

  clearUser: () => {
    set({
      user: null,
    });
  },
}));