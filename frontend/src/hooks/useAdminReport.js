import useAdminReportStore from "@/store/adminReportStore";

export default function useAdminReport() {
  const report = useAdminReportStore(
    (state) => state.report,
  );

  const filters = useAdminReportStore(
    (state) => state.filters,
  );

  const loading = useAdminReportStore(
    (state) => state.loading,
  );

  const error = useAdminReportStore(
    (state) => state.error,
  );

  const setFilters = useAdminReportStore(
    (state) => state.setFilters,
  );

  const getReport = useAdminReportStore(
    (state) => state.getReport,
  );

  const resetReport = useAdminReportStore(
    (state) => state.resetReport,
  );

  return {
    report,
    filters,
    loading,
    error,
    setFilters,
    getReport,
    resetReport,
  };
}