import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ClipboardList, Store } from "lucide-react";
import toast from "react-hot-toast";

import useAdminOrder from "@/hooks/useAdminOrder";
import useDebounce from "@/hooks/useDebounce";

import Pagination from "@/components/common/Pagination";
import AdminOrderStats from "@/components/ui/admin/orders/AdminOrderStats";
import AdminOrdersFilter from "@/components/ui/admin/orders/AdminOrdersFilter";
import AdminOrdersTable from "@/components/ui/admin/orders/AdminOrdersTable";
import AdminSubOrdersTable from "@/components/ui/admin/orders/AdminSubOrdersTable";
import AdminOrderDrawer from "@/components/ui/admin/orders/AdminOrderDrawer";
import AdminSubOrderDrawer from "@/components/ui/admin/orders/AdminSubOrderDrawer";
import AdminSubOrderStatusModal from "@/components/ui/admin/orders/AdminSubOrderStatusModal";
import { requestReason } from "@/utils/actionDialog";
import { getApiErrorMessage as getErrorMessage } from "@/utils/apiError";

const initialParams = {
  page: 1,
  per_page: 10,
  keyword: "",
  farm_id: "",
  status: "",
  payment_status: "",
  payment_method: "",
  date_from: "",
  date_to: "",
  deleted: "",
};

export default function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    options,
    orders,
    orderStats,
    orderMeta,
    subOrders,
    subOrderStats,
    subOrderMeta,
    selectedOrder,
    selectedSubOrder,
    loading,
    detailLoading,
    actionLoading,
    getOptions,
    getOrders,
    getOrder,
    cancelOrder,
    getSubOrders,
    getSubOrder,
    updateSubOrderStatus,
    clearSelectedOrder,
    clearSelectedSubOrder,
  } = useAdminOrder();

  const [mode, setMode] = useState("orders");
  const [orderParams, setOrderParams] = useState(initialParams);
  const [subOrderParams, setSubOrderParams] = useState(initialParams);

  const orderKeyword = useDebounce(orderParams.keyword, 500);
  const subOrderKeyword = useDebounce(subOrderParams.keyword, 500);

  const [openOrderDrawer, setOpenOrderDrawer] = useState(false);
  const [openSubOrderDrawer, setOpenSubOrderDrawer] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusInitialValue, setStatusInitialValue] = useState(null);

  const activeParams = mode === "orders" ? orderParams : subOrderParams;
  const setActiveParams = mode === "orders" ? setOrderParams : setSubOrderParams;
  const activeMeta = mode === "orders" ? orderMeta : subOrderMeta;
  const activeStats = mode === "orders" ? orderStats : subOrderStats;

  const orderRequest = useMemo(
    () => ({
      page: orderParams.page,
      per_page: orderParams.per_page,
      keyword: orderKeyword,
      farm_id: orderParams.farm_id,
      status: orderParams.status,
      payment_status: orderParams.payment_status,
      payment_method: orderParams.payment_method,
      date_from: orderParams.date_from,
      date_to: orderParams.date_to,
      deleted: orderParams.deleted,
    }),
    [
      orderParams.page,
      orderParams.per_page,
      orderParams.farm_id,
      orderParams.status,
      orderParams.payment_status,
      orderParams.payment_method,
      orderParams.date_from,
      orderParams.date_to,
      orderParams.deleted,
      orderKeyword,
    ],
  );

  const subOrderRequest = useMemo(
    () => ({
      page: subOrderParams.page,
      per_page: subOrderParams.per_page,
      keyword: subOrderKeyword,
      farm_id: subOrderParams.farm_id,
      status: subOrderParams.status,
      payment_status: subOrderParams.payment_status,
      payment_method: subOrderParams.payment_method,
      date_from: subOrderParams.date_from,
      date_to: subOrderParams.date_to,
      deleted: subOrderParams.deleted,
    }),
    [
      subOrderParams.page,
      subOrderParams.per_page,
      subOrderParams.farm_id,
      subOrderParams.status,
      subOrderParams.payment_status,
      subOrderParams.payment_method,
      subOrderParams.date_from,
      subOrderParams.date_to,
      subOrderParams.deleted,
      subOrderKeyword,
    ],
  );

  useEffect(() => {
    const requestedMode = searchParams.get("mode");
    const requestedId = Number(searchParams.get("view"));

    if (requestedMode === "sub_orders") {
      setMode("sub_orders");
    } else if (requestedMode === "orders") {
      setMode("orders");
    }

    if (!Number.isInteger(requestedId) || requestedId <= 0) {
      return;
    }

    if (requestedMode === "sub_orders") {
      setOpenSubOrderDrawer(true);
      getSubOrder(requestedId).catch((error) => {
        setOpenSubOrderDrawer(false);
        toast.error(
          getErrorMessage(error, "Không thể tải chi tiết đơn nông trại."),
        );
      });
      return;
    }

    setOpenOrderDrawer(true);
    getOrder(requestedId).catch((error) => {
      setOpenOrderDrawer(false);
      toast.error(getErrorMessage(error, "Không thể tải chi tiết đơn tổng."));
    });
  }, [searchParams, getOrder, getSubOrder]);

  useEffect(() => {
    getOptions().catch(() => {
      toast.error("Không thể tải danh sách nông trại.");
    });
  }, [getOptions]);

  useEffect(() => {
    if (mode === "orders") {
      getOrders(orderRequest).catch((error) => {
        toast.error(getErrorMessage(error, "Không thể tải đơn tổng."));
      });
      return;
    }

    getSubOrders(subOrderRequest).catch((error) => {
      toast.error(
        getErrorMessage(error, "Không thể tải đơn theo nông trại."),
      );
    });
  }, [mode, orderRequest, subOrderRequest, getOrders, getSubOrders]);

  const reloadActive = async () => {
    if (mode === "orders") {
      return getOrders(orderRequest);
    }
    return getSubOrders(subOrderRequest);
  };

  const handleViewOrder = async (order) => {
    setOpenOrderDrawer(true);
    try {
      await getOrder(order.id);
    } catch (error) {
      setOpenOrderDrawer(false);
      toast.error(getErrorMessage(error, "Không thể tải chi tiết đơn tổng."));
    }
  };

  const handleViewSubOrder = async (subOrder) => {
    setOpenSubOrderDrawer(true);
    try {
      await getSubOrder(subOrder.id);
    } catch (error) {
      setOpenSubOrderDrawer(false);
      toast.error(
        getErrorMessage(error, "Không thể tải chi tiết đơn nông trại."),
      );
    }
  };

  const handleCancelOrder = async (order) => {
    const reason = await requestReason({ title: `Hủy đơn ${order.order_code}`, description: "Đơn và các đơn con sẽ bị hủy, tồn kho được hoàn lại. Thao tác này được lưu vào nhật ký.", placeholder: "Nhập lý do hủy đơn...", confirmLabel: "Hủy đơn", danger: true });
    if (!reason) return;

    try {
      const response = await cancelOrder(order.id, reason);
      toast.success(response.message || "Đã hủy toàn bộ đơn và hoàn kho.");
      await getOrders(orderRequest);
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể hủy đơn tổng."));
    }
  };

  const handleOpenStatus = (subOrder, initialStatus = null) => {
    setStatusTarget(subOrder);
    setStatusInitialValue(initialStatus);
  };

  const handleUpdateStatus = async (status, reason) => {
    if (!statusTarget) return;

    try {
      const response = await updateSubOrderStatus(statusTarget.id, {
        status,
        reason,
      });

      toast.success(response.message || "Cập nhật trạng thái thành công.");
      setStatusTarget(null);
      setStatusInitialValue(null);

      await reloadActive();

      if (
        openSubOrderDrawer &&
        Number(selectedSubOrder?.id) === Number(statusTarget.id)
      ) {
        await getSubOrder(statusTarget.id);
      }

      if (openOrderDrawer && selectedOrder?.id) {
        await getOrder(selectedOrder.id);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Cập nhật trạng thái thất bại."));
      throw error;
    }
  };

  const clearAuditViewParams = () => {
    if (!searchParams.has("view") && !searchParams.has("mode")) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("view");
    nextParams.delete("mode");
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="min-w-0 space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Quản lý đơn hàng
        </h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          Theo dõi đơn tổng của khách và từng đơn được tách cho mỗi nông trại.
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:grid-cols-2">
        <ModeButton
          active={mode === "orders"}
          icon={ClipboardList}
          title="Đơn tổng"
          description="Một lần checkout của khách hàng"
          onClick={() => setMode("orders")}
        />
        <ModeButton
          active={mode === "sub_orders"}
          icon={Store}
          title="Đơn theo nông trại"
          description="Phần đơn seller xử lý tại từng farm"
          onClick={() => setMode("sub_orders")}
        />
      </div>

      <AdminOrderStats stats={activeStats} mode={mode} />

      <AdminOrdersFilter
        mode={mode}
        params={activeParams}
        setParams={setActiveParams}
        farms={options.farms}
      />

      {mode === "orders" ? (
        <AdminOrdersTable
          orders={orders}
          loading={loading}
          keyword={activeParams.keyword}
          onView={handleViewOrder}
        />
      ) : (
        <AdminSubOrdersTable
          subOrders={subOrders}
          loading={loading}
          keyword={activeParams.keyword}
          onView={handleViewSubOrder}
          onUpdateStatus={handleOpenStatus}
        />
      )}

      <Pagination
        meta={activeMeta}
        params={activeParams}
        setParams={setActiveParams}
        itemLabel={mode === "orders" ? "đơn hàng" : "đơn con"}
        loading={loading}
      />

      <AdminOrderDrawer
        open={openOrderDrawer}
        order={selectedOrder}
        loading={detailLoading}
        actionLoading={actionLoading}
        onCancelOrder={handleCancelOrder}
        onClose={() => {
          setOpenOrderDrawer(false);
          clearSelectedOrder();
          clearAuditViewParams();
        }}
      />

      <AdminSubOrderDrawer
        open={openSubOrderDrawer}
        subOrder={selectedSubOrder}
        loading={detailLoading}
        onUpdateStatus={handleOpenStatus}
        onClose={() => {
          setOpenSubOrderDrawer(false);
          clearSelectedSubOrder();
          clearAuditViewParams();
        }}
      />

      <AdminSubOrderStatusModal
        open={Boolean(statusTarget)}
        subOrder={statusTarget}
        loading={actionLoading}
        initialStatus={statusInitialValue}
        onClose={() => {
          if (!actionLoading) {
            setStatusTarget(null);
            setStatusInitialValue(null);
          }
        }}
        onSubmit={handleUpdateStatus}
      />
    </div>
  );
}

function ModeButton({ active, icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl p-4 text-left transition ${
        active
          ? "bg-red-600 text-white shadow-sm"
          : "bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          active ? "bg-white/20" : "bg-red-50 text-red-600"
        }`}
      >
        <Icon size={22} />
      </span>
      <span>
        <span className="block font-extrabold">{title}</span>
        <span className={`block text-xs ${active ? "text-red-100" : "text-slate-500"}`}>
          {description}
        </span>
      </span>
    </button>
  );
}
