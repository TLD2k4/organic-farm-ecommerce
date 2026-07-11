import { useCategoryStore } from "../store/categoryStore";

export default function useCategory() {
  const {
    // PUBLIC
    publicCategories,
    publicCategory,
    publicMeta,
    publicLoading,
    publicDetailLoading,

    // ADMIN
    categories,
    category,
    categoryOptions,
    meta,
    loading,
    detailLoading,
    optionsLoading,

    // PUBLIC ACTIONS
    getAll,
    getBySlug,

    // ADMIN ACTIONS
    adminGetAll,
    adminGetById,
    getParentOptions,

    create,
    update,
    toggleStatus,
    delete: deleteCategory,
    forceDelete,
    restore,

    clearPublicCategory,
    clearCategory,
  } = useCategoryStore();

  return {
    // PUBLIC
    publicCategories,
    publicCategory,
    publicMeta,
    publicLoading,
    publicDetailLoading,

    // ADMIN
    categories,
    category,
    categoryOptions,
    meta,
    loading,
    detailLoading,
    optionsLoading,

    // PUBLIC ACTIONS
    getAll,
    getBySlug,

    // ADMIN ACTIONS
    adminGetAll,
    adminGetById,
    getParentOptions,

    create,
    update,
    toggleStatus,
    deleteCategory,
    forceDelete,
    restore,

    clearPublicCategory,
    clearCategory,
  };
}