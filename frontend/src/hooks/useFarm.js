// src\hooks\useFarm.js

import { useFarmStore } from "../store/farmStore";

export default function useFarm() {
  const {
    // PUBLIC
    publicFarms,
    publicFarm,
    publicMeta,
    publicLoading,
    publicDetailLoading,

    publicFarmProducts,
    publicFarmProductsMeta,
    publicFarmProductsLoading,

    // OWNER
    myFarm,
    ownerLoading,
    ownerActionLoading,

    // ADMIN
    farms,
    farm,
    meta,
    loading,
    detailLoading,
    actionLoading,

    // PUBLIC ACTIONS
    getAll,
    getBySlug,

    // OWNER ACTIONS
    getMyFarm,
    registerFarm,
    updateFarm,
    resubmitFarm,
    ownerForceDeleteFarm,

    // ADMIN ACTIONS
    adminGetAll,
    adminGetById,
    approve,
    reject,
    suspend,
    reopen,
    deleteFarm,
    restore,
    forceDelete,

    clearPublicFarm,
    clearMyFarm,
    clearAdminFarm,
  } = useFarmStore();

  return {
    publicFarms,
    publicFarm,
    publicMeta,
    publicLoading,
    publicDetailLoading,

    publicFarmProducts,
    publicFarmProductsMeta,
    publicFarmProductsLoading,

    myFarm,
    ownerLoading,
    ownerActionLoading,

    farms,
    farm,
    meta,
    loading,
    detailLoading,
    actionLoading,

    getAll,
    getBySlug,

    getMyFarm,
    registerFarm,
    updateFarm,
    resubmitFarm,
    ownerForceDeleteFarm,

    adminGetAll,
    adminGetById,
    approve,
    reject,
    suspend,
    reopen,
    deleteFarm,
    restore,
    forceDelete,

    clearPublicFarm,
    clearMyFarm,
    clearAdminFarm,
  };
}