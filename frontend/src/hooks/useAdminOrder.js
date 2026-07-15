import { useAdminOrderStore } from "../store/adminOrderStore";

export default function useAdminOrder() {
  const store = useAdminOrderStore();

  return {
    options: store.options,
    orders: store.orders,
    orderStats: store.orderStats,
    orderMeta: store.orderMeta,
    subOrders: store.subOrders,
    subOrderStats: store.subOrderStats,
    subOrderMeta: store.subOrderMeta,
    selectedOrder: store.selectedOrder,
    selectedSubOrder: store.selectedSubOrder,
    loading: store.loading,
    optionsLoading: store.optionsLoading,
    detailLoading: store.detailLoading,
    actionLoading: store.actionLoading,
    getOptions: store.getOptions,
    getOrders: store.getOrders,
    getOrder: store.getOrder,
    cancelOrder: store.cancelOrder,
    getSubOrders: store.getSubOrders,
    getSubOrder: store.getSubOrder,
    updateSubOrderStatus: store.updateSubOrderStatus,
    clearSelectedOrder: store.clearSelectedOrder,
    clearSelectedSubOrder: store.clearSelectedSubOrder,
  };
}
