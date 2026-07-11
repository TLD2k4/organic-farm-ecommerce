// src\store\categoryStore.js

import { create } from "zustand";
import categoryService from "../services/categoryService";

function removeInvalidParentOptions(categories, currentCategoryId) {
  if (!currentCategoryId) {
    return categories;
  }

  const currentId = Number(currentCategoryId);
  const blockedIds = new Set([currentId]);

  let changed = true;

  while (changed) {
    changed = false;

    categories.forEach((category) => {
      const categoryId = Number(category.id);

      const parentId =
        category.parent_id !== null &&
        category.parent_id !== undefined
          ? Number(category.parent_id)
          : null;

      if (
        parentId !== null &&
        blockedIds.has(parentId) &&
        !blockedIds.has(categoryId)
      ) {
        blockedIds.add(categoryId);
        changed = true;
      }
    });
  }

  return categories.filter(
    (category) => !blockedIds.has(Number(category.id)),
  );
}

export const useCategoryStore = create((set) => ({
  // ================= PUBLIC =================

  publicCategories: [],
  publicCategory: null,
  publicMeta: null,

  publicLoading: false,
  publicDetailLoading: false,

  // ================= ADMIN =================

  categories: [],
  category: null,
  categoryOptions: [],
  meta: null,

  loading: false,
  detailLoading: false,
  optionsLoading: false,

  // ================= PUBLIC ACTIONS =================

  getAll: async (params = {}) => {
    set({ publicLoading: true });

    try {
      const res = await categoryService.getAll(params);

      set({
        publicCategories: Array.isArray(res.data)
          ? res.data
          : [],
        publicMeta: res.meta ?? null,
      });

      return res;
    } finally {
      set({ publicLoading: false });
    }
  },

  getBySlug: async (slug) => {
    set({
      publicDetailLoading: true,
      publicCategory: null,
    });

    try {
      const res = await categoryService.getBySlug(slug);

      set({
        publicCategory: res.data ?? null,
      });

      return res;
    } finally {
      set({
        publicDetailLoading: false,
      });
    }
  },

  // ================= ADMIN ACTIONS =================

  adminGetAll: async (params = {}) => {
    set({ loading: true });

    try {
      const res = await categoryService.adminGetAll(params);

      set({
        categories: Array.isArray(res.data)
          ? res.data
          : [],
        meta: res.meta ?? null,
      });

      return res;
    } finally {
      set({ loading: false });
    }
  },

  adminGetById: async (id) => {
    set({
      detailLoading: true,
      category: null,
    });

    try {
      const res = await categoryService.adminGetById(id);

      set({
        category: res.data ?? null,
      });

      return res;
    } finally {
      set({
        detailLoading: false,
      });
    }
  },

  getParentOptions: async (currentCategoryId = null) => {
    set({ optionsLoading: true });

    try {
      const res = await categoryService.adminGetAll({
        page: 1,
        limit: 50,
        deleted: 0,
      });

      let options = Array.isArray(res.data)
        ? [...res.data]
        : [];

      options = removeInvalidParentOptions(
        options,
        currentCategoryId,
      );

      options.sort((a, b) =>
        a.name.localeCompare(b.name, "vi"),
      );

      set({
        categoryOptions: options,
      });

      return options;
    } finally {
      set({ optionsLoading: false });
    }
  },

  create: (data) => {
    return categoryService.create(data);
  },

  update: (id, data) => {
    return categoryService.update(id, data);
  },

  toggleStatus: (id) => {
    return categoryService.toggleStatus(id);
  },

  delete: (id) => {
    return categoryService.delete(id);
  },

  forceDelete: (id) => {
    return categoryService.forceDelete(id);
  },

  restore: (id) => {
    return categoryService.restore(id);
  },

  clearPublicCategory: () => {
    set({
      publicCategory: null,
    });
  },

  clearCategory: () => {
    set({
      category: null,
    });
  },
}));