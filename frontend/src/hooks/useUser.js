// src/hooks/useUser.js

import { useUserStore } from "../store/userStore";

export default function useUser() {
  const {
    users,
    user,
    meta,
    loading,
    detailLoading,

    getAll,
    getById,
    toggleStatus,
    delete: deleteUser,
    forceDelete,
    restore,
    clearUser,
  } = useUserStore();

  return {
    users,
    user,
    meta,
    loading,
    detailLoading,

    getAll,
    getById,
    toggleStatus,
    deleteUser,
    forceDelete,
    restore,
    clearUser,
  };
}