import { useAdminProductStore } from "../store/adminProductStore";

export default function useAdminProduct() {
  const {
    products,
    product,
    meta,
    stats,
    options,

    listLoading,
    detailLoading,
    optionsLoading,
    actionLoading,

    getAll,
    getOptions,
    getById,
    approveProduct,
    rejectProduct,
    approveCertificate,
    rejectCertificate,
    clearProduct,
  } = useAdminProductStore();

  return {
    products,
    product,
    meta,
    stats,
    options,

    listLoading,
    detailLoading,
    optionsLoading,
    actionLoading,

    getAll,
    getOptions,
    getById,
    approveProduct,
    rejectProduct,
    approveCertificate,
    rejectCertificate,
    clearProduct,
  };
}
