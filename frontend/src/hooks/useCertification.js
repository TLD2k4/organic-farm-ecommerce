//src\hooks\useCertification.js
import { useCertificationStore } from "../store/certificationStore";

export default function useCertification() {
  const {
    certifications,
    certification,
    meta,
    loading,

    getAll,
    getById,

    adminGetAll,
    adminGetById,

    create,
    update,
    toggleStatus,
    delete: deleteCert,
    forceDelete,
    restore,
  } = useCertificationStore();

  return {
    certifications,
    certification,
    meta,
    loading,

    getAll,
    getById,

    adminGetAll,
    adminGetById,

    create,
    update,
    toggleStatus,
    deleteCert,
    forceDelete,
    restore,
  };
}