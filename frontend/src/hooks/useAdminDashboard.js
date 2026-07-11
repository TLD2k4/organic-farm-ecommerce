import useAdminDashboardStore from "@/store/adminDashboardStore";

export default function useAdminDashboard() {
  const dashboard = useAdminDashboardStore(
    (state) => state.dashboard,
  );

  const loading = useAdminDashboardStore(
    (state) => state.loading,
  );

  const error = useAdminDashboardStore(
    (state) => state.error,
  );

  const days = useAdminDashboardStore(
    (state) => state.days,
  );

  const setDays = useAdminDashboardStore(
    (state) => state.setDays,
  );

  const getDashboard = useAdminDashboardStore(
    (state) => state.getDashboard,
  );

  const resetDashboard = useAdminDashboardStore(
    (state) => state.resetDashboard,
  );

  return {
    dashboard,
    loading,
    error,
    days,
    setDays,
    getDashboard,
    resetDashboard,
  };
}