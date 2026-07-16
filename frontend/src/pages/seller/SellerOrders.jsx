import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import sellerOrderService from "../../services/sellerOrderService";
import ResponsiveSelect from "../../components/common/ResponsiveSelect";
import useDebounce from "../../hooks/useDebounce";
import { getApiErrorMessage } from "../../utils/apiError";
import { highlight } from "../../utils/highlight";

const STATUS_TABS = [
  { label: "Tất cả", value: "" },
  { label: "Chờ xác nhận", value: "0" },
  { label: "Đang chuẩn bị", value: "1" },
  { label: "Đang giao", value: "2" },
  { label: "Hoàn thành", value: "3" },
  { label: "Đã hủy", value: "4" },
];

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });

  const [filters, setFilters] = useState({
    keyword: "",
    status: "",
    payment_status: "",
    date_from: "",
    date_to: "",
    per_page: 10,
    page: 1,
  });

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [showActionModal, setShowActionModal] = useState(false);
  const [actionOrder, setActionOrder] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);
  const [sellerNote, setSellerNote] = useState("");
  const debouncedKeyword = useDebounce(filters.keyword, 400);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);

      const response = await sellerOrderService.getOrders({
        keyword: debouncedKeyword,
        status: filters.status,
        payment_status: filters.payment_status,
        date_from: filters.date_from,
        date_to: filters.date_to,
        per_page: filters.per_page,
        page: filters.page,
      });
      const payload = response.data ?? response;

      setOrders(payload.orders || []);
      setStats(payload.stats || {});

      setPagination(payload.pagination || {});
    } catch (error) {
      console.log("LOAD SELLER ORDERS ERROR:", error);

      toast.error(getApiErrorMessage(error, "Không thể tải danh sách đơn hàng."));
    } finally {
      setLoading(false);
    }
  }, [
    debouncedKeyword,
    filters.status,
    filters.payment_status,
    filters.date_from,
    filters.date_to,
    filters.per_page,
    filters.page,
  ]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!showDetailModal && !showActionModal) return undefined;

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = oldOverflow;
    };
  }, [showDetailModal, showActionModal]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      keyword: "",
      status: "",
      payment_status: "",
      date_from: "",
      date_to: "",
      per_page: 10,
      page: 1,
    });
  };

  const handleChangePage = (page) => {
    if (page < 1 || page > pagination.last_page) return;

    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const handleViewDetail = async (orderId) => {
    try {
      setSelectedOrder(null);
      setDetailLoading(true);
      setShowDetailModal(true);

      const response = await sellerOrderService.getOrder(orderId);
      setSelectedOrder(response.data ?? response);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải chi tiết đơn hàng."));
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const openActionModal = (order, status) => {
    setActionOrder(order);
    setActionStatus(status);
    setSellerNote("");
    setShowActionModal(true);
  };

  const closeActionModal = () => {
    setShowActionModal(false);
    setActionOrder(null);
    setActionStatus(null);
    setSellerNote("");
  };

  const handleUpdateStatus = async () => {
    if (!actionOrder || !actionStatus) return;

    try {
      setActionLoading(true);

      const response = await sellerOrderService.updateStatus(actionOrder.id, {
        status: actionStatus,
        seller_note: sellerNote || null,
      });

      toast.success(response.message || "Cập nhật trạng thái thành công.");

      const updatedOrder = response.data ?? response;

      closeActionModal();
      await fetchOrders();

      if (showDetailModal && selectedOrder?.id === updatedOrder.id) {
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      console.log("UPDATE SELLER ORDER STATUS ERROR:", error);

      toast.error(getApiErrorMessage(error, "Cập nhật trạng thái thất bại."));
    } finally {
      setActionLoading(false);
    }
  };

  const getNextActions = (order) => {
    const status = Number(order.status);
    const paymentStatus = Number(order.payment_status ?? 0);

    // Đơn đã thanh toán thì không cho seller hủy trực tiếp
    // vì chưa có chức năng hoàn tiền
    const isPaid = paymentStatus === 1;

    if (status === 0) {
      const actions = [{ status: 1, label: "Xác nhận", variant: "primary" }];

      if (!isPaid) {
        actions.push({ status: 4, label: "Hủy đơn", variant: "danger" });
      }

      return actions;
    }

    if (status === 1) {
      const actions = [{ status: 2, label: "Giao hàng", variant: "indigo" }];

      if (!isPaid) {
        actions.push({ status: 4, label: "Hủy đơn", variant: "danger" });
      }

      return actions;
    }

    if (status === 2) {
      return [{ status: 3, label: "Hoàn thành", variant: "success" }];
    }

    return [];
  };

  return (
    <div className="w-full min-w-0">
      <div className="mx-auto w-full min-w-0 max-w-375 space-y-5 sm:space-y-6">
        <StatsGrid stats={stats} formatMoney={formatMoney} />

        <StatusTabs
          value={filters.status}
          onChange={(value) => handleFilterChange("status", value)}
        />

        <FilterPanel
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        <OrdersTable
          orders={orders}
          keyword={filters.keyword}
          loading={loading}
          pagination={pagination}
          onPageChange={handleChangePage}
          onViewDetail={handleViewDetail}
          getNextActions={getNextActions}
          openActionModal={openActionModal}
        />

        {showDetailModal && (
          <DetailDrawer
            order={selectedOrder}
            loading={detailLoading}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedOrder(null);
            }}
            actions={selectedOrder ? getNextActions(selectedOrder) : []}
            onAction={(status) => openActionModal(selectedOrder, status)}
          />
        )}

        {showActionModal && (
          <ActionModal
            title={getActionTitle(actionStatus)}
            order={actionOrder}
            status={actionStatus}
            sellerNote={sellerNote}
            setSellerNote={setSellerNote}
            loading={actionLoading}
            onClose={closeActionModal}
            onSubmit={handleUpdateStatus}
          />
        )}
      </div>
    </div>
  );
}

function StatsGrid({ stats, formatMoney }) {
  const cards = [
    {
      label: "Tổng đơn",
      value: stats.total_orders || 0,
      icon: "📦",
      color: "from-slate-700 to-slate-900",
    },
    {
      label: "Chờ xác nhận",
      value: stats.pending_orders || 0,
      icon: "⏳",
      color: "from-amber-500 to-orange-500",
    },
    {
      label: "Đang chuẩn bị",
      value: stats.preparing_orders || 0,
      icon: "🧺",
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Đang giao",
      value: stats.shipping_orders || 0,
      icon: "🚚",
      color: "from-indigo-500 to-violet-500",
    },
    {
      label: "Hoàn thành",
      value: stats.completed_orders || 0,
      icon: "✅",
      color: "from-emerald-500 to-green-600",
    },
    {
      label: "Doanh thu tháng",
      value: formatMoney(stats.month_revenue || 0),
      icon: "💰",
      color: "from-lime-500 to-emerald-600",
    },
  ];

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 min-[460px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="group min-w-0 overflow-hidden rounded-3xl border border-white bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
        >
          <div
            className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br ${card.color} text-xl shadow-lg`}
          >
            {card.icon}
          </div>

          <p className="text-sm font-medium text-gray-500">{card.label}</p>
          <p className="mt-2 break-words text-xl font-black text-gray-900 sm:text-2xl">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function StatusTabs({ value, onChange }) {
  return (
    <div className="min-w-0 overflow-x-auto rounded-3xl border border-gray-100 bg-white p-3 shadow-sm">
      <div className="flex w-max min-w-full gap-2 pb-1 sm:w-auto sm:flex-wrap sm:gap-3">
        {STATUS_TABS.map((tab) => {
          const active = String(value) === String(tab.value);

          return (
            <button
              key={tab.label}
              onClick={() => onChange(tab.value)}
              className={`shrink-0 whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-black transition-all duration-200 sm:px-5 ${
                active
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100"
                  : "bg-gray-50 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FilterPanel({ filters, onChange, onReset }) {
  return (
    <div className="min-w-0 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12">
        <div className="sm:col-span-2 xl:col-span-4">
          <label className="mb-1.5 block text-xs font-bold uppercase text-gray-400">
            Tìm kiếm
          </label>
          <input
            value={filters.keyword}
            onChange={(e) => onChange("keyword", e.target.value)}
            placeholder="Mã đơn, tên khách, số điện thoại, sản phẩm..."
            className="w-full min-w-0 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
          />
        </div>

        <div className="xl:col-span-2">
          <label className="mb-1.5 block text-xs font-bold uppercase text-gray-400">
            Thanh toán
          </label>
          <ResponsiveSelect
            value={filters.payment_status}
            onChange={(value) => onChange("payment_status", value)}
            options={[
              { value: "", label: "Tất cả" },
              { value: "0", label: "Chờ thanh toán" },
              { value: "1", label: "Đã thanh toán" },
              { value: "2", label: "Thất bại" },
              { value: "3", label: "Đã hoàn tiền" },
            ]}
          />
        </div>

        <div className="xl:col-span-2">
          <label className="mb-1.5 block text-xs font-bold uppercase text-gray-400">
            Từ ngày
          </label>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => onChange("date_from", e.target.value)}
            className="w-full min-w-0 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
          />
        </div>

        <div className="xl:col-span-2">
          <label className="mb-1.5 block text-xs font-bold uppercase text-gray-400">
            Đến ngày
          </label>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => onChange("date_to", e.target.value)}
            className="w-full min-w-0 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
          />
        </div>

        <div className="flex items-end sm:col-span-2 xl:col-span-2">
          <button
            onClick={onReset}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>
    </div>
  );
}

function OrdersTable({
  orders,
  keyword,
  loading,
  pagination,
  onPageChange,
  onViewDetail,
  getNextActions,
  openActionModal,
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-4 min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between sm:px-5">
        <div className="min-w-0">
          <h2 className="text-lg font-black text-gray-900">Danh sách đơn</h2>
          <p className="text-sm text-gray-500">
            Tổng cộng {pagination.total || 0} đơn hàng
          </p>
        </div>

        <div className="w-fit shrink-0 rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
          Trang {pagination.current_page || 1}/{pagination.last_page || 1}
        </div>
      </div>

      <div className="grid gap-3 bg-[#f8faf9] p-3 xl:hidden">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-80 animate-pulse rounded-2xl bg-gray-200"
            />
          ))
        ) : orders.length === 0 ? (
          <div className="rounded-2xl bg-white px-4 py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-100 text-3xl">
              🧾
            </div>
            <p className="font-bold text-gray-900">Chưa có đơn hàng nào</p>
            <p className="mt-1 text-sm text-gray-500">
              Khi khách đặt hàng, đơn sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderMobileCard
              key={order.id}
              order={order}
              keyword={keyword}
              onViewDetail={onViewDetail}
              actions={getNextActions(order)}
              openActionModal={openActionModal}
            />
          ))
        )}
      </div>

      <div className="hidden overflow-x-auto overscroll-x-contain xl:block">
        <table className="w-full min-w-290">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-black uppercase tracking-wider text-gray-400">
              <th className="px-5 py-4">Đơn hàng</th>
              <th className="px-5 py-4">Khách hàng</th>
              <th className="px-5 py-4">Sản phẩm</th>
              <th className="px-5 py-4">Tổng tiền</th>
              <th className="px-5 py-4">Trạng thái</th>
              <th className="px-5 py-4">Thanh toán</th>
              <th className="px-5 py-4">Ngày tạo</th>
              <th className="px-5 py-4 text-right">Thao tác</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <TableSkeleton />
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-5 py-16 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-100 text-3xl">
                      🧾
                    </div>
                    <p className="font-bold text-gray-900">
                      Chưa có đơn hàng nào
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Khi khách đặt hàng, đơn sẽ hiển thị tại đây.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="group transition hover:bg-emerald-50/40"
                >
                  <td className="whitespace-nowrap px-5 py-4">
                    <button type="button" onClick={() => onViewDetail(order.id)} className="font-black text-gray-900 hover:text-emerald-600 hover:underline">
                      {highlight(order.sub_order_code, keyword)}
                    </button>
                    <div className="mt-1 text-xs font-medium text-gray-400">
                      {highlight(order.order_code, keyword)}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-bold text-gray-900">
                      {highlight(order.customer_name, keyword)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {highlight(order.customer_phone, keyword)}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-semibold text-gray-800">
                      {order.items_count} sản phẩm
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Tổng SL: {order.items_quantity}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="font-black text-emerald-700">
                      {formatMoney(order.total)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Ship: {formatMoney(order.shipping_fee)}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge
                      text={order.status_text}
                      statusClass={order.status_class}
                    />
                  </td>

                  <td className="px-5 py-4">
                    <PaymentBadge
                      text={`${order.payment_method === "MOMO" ? "MoMo" : "COD"} · ${order.payment_status_text}`}
                      status={order.payment_status}
                    />
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-500">
                    {formatDateTime(order.created_at)}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        onClick={() => onViewDetail(order.id)}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        Chi tiết
                      </button>

                      {getNextActions(order).map((action) => (
                        <ActionButton
                          key={action.status}
                          variant={action.variant}
                          onClick={() => openActionModal(order, action.status)}
                        >
                          {action.label}
                        </ActionButton>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-center text-sm text-gray-500 sm:text-left">
          Hiển thị {orders.length} / {pagination.total || 0} đơn hàng
        </p>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            onClick={() => onPageChange((pagination.current_page || 1) - 1)}
            disabled={(pagination.current_page || 1) <= 1}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Trước
          </button>

          <button
            onClick={() => onPageChange((pagination.current_page || 1) + 1)}
            disabled={
              (pagination.current_page || 1) >= (pagination.last_page || 1)
            }
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderMobileCard({ order, keyword, onViewDetail, actions, openActionModal }) {
  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex min-w-0 flex-col gap-3 border-b border-gray-100 p-4 min-[430px]:flex-row min-[430px]:items-start min-[430px]:justify-between">
        <div className="min-w-0">
          <button type="button" onClick={() => onViewDetail(order.id)} className="break-words text-left font-black text-gray-900 hover:text-emerald-600 hover:underline">
            {highlight(order.sub_order_code, keyword)}
          </button>
          <p className="mt-1 break-words text-xs font-medium text-gray-400">
            {highlight(order.order_code, keyword)}
          </p>
          <p className="mt-2 break-words text-sm font-bold text-gray-800">
            {highlight(order.customer_name, keyword)}
          </p>
          <p className="mt-1 text-xs text-gray-500">{highlight(order.customer_phone, keyword)}</p>
        </div>

        <div className="flex flex-wrap gap-2 min-[430px]:max-w-40 min-[430px]:justify-end">
          <StatusBadge
            text={order.status_text}
            statusClass={order.status_class}
          />
          <PaymentBadge
            text={`${order.payment_method === "MOMO" ? "MoMo" : "COD"} · ${order.payment_status_text}`}
            status={order.payment_status}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 min-[400px]:grid-cols-2">
        <div className="rounded-2xl bg-gray-50 p-3">
          <p className="text-xs font-bold uppercase text-gray-400">Sản phẩm</p>
          <p className="mt-1 font-black text-gray-800">
            {order.items_count} sản phẩm
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Tổng SL: {order.items_quantity}
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-3">
          <p className="text-xs font-bold uppercase text-emerald-600">
            Tổng tiền
          </p>
          <p className="mt-1 break-words font-black text-emerald-700">
            {formatMoney(order.total)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Ship: {formatMoney(order.shipping_fee)}
          </p>
        </div>

        <div className="min-[400px]:col-span-2">
          <p className="text-xs font-bold uppercase text-gray-400">Ngày tạo</p>
          <p className="mt-1 text-sm font-semibold text-gray-600">
            {formatDateTime(order.created_at)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 border-t border-gray-100 bg-gray-50 p-3 min-[400px]:grid-cols-2">
        <button
          type="button"
          onClick={() => onViewDetail(order.id)}
          className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-700"
        >
          Chi tiết
        </button>

        {actions.map((action) => (
          <ActionButton
            key={action.status}
            variant={action.variant}
            onClick={() => openActionModal(order, action.status)}
            large
          >
            {action.label}
          </ActionButton>
        ))}
      </div>
    </article>
  );
}

function DetailDrawer({ order, loading, onClose, actions, onAction }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
        aria-label="Close detail drawer"
      />

      <div className="absolute right-0 top-0 flex h-full w-full max-w-195 min-w-0 flex-col overflow-hidden bg-white shadow-2xl">
        <div className="relative flex-none bg-linear-to-r from-emerald-600 via-green-600 to-lime-500 px-4 py-5 text-white sm:px-7 sm:py-6">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/20 blur-2xl" />

          <div className="relative z-10 flex min-w-0 items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <p className="text-sm font-bold text-green-50">
                Chi tiết đơn hàng
              </p>

              <h2 className="mt-1 break-words text-2xl font-black tracking-tight sm:text-3xl">
                {order?.sub_order_code || "Đang tải..."}
              </h2>

              {order?.order_code && (
                <p className="mt-2 text-sm font-medium text-white/80">
                  Đơn chính: {order.order_code}
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="shrink-0 rounded-2xl bg-white/20 px-3 py-2 text-sm font-black text-white backdrop-blur transition hover:bg-white/30 sm:px-4"
            >
              Đóng
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#f8faf9] p-3 sm:p-6">
          {loading || !order ? (
            <div className="space-y-4">
              <SkeletonBox height="h-28" />
              <SkeletonBox height="h-40" />
              <SkeletonBox height="h-64" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <InfoCard title="Khách hàng">
                  <p className="text-lg font-black text-gray-900">
                    {order.customer_name}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {order.customer_phone}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-gray-600">
                    {order.shipping_address}
                  </p>
                </InfoCard>

                <InfoCard title="Mã đơn">
                  <p className="font-black text-gray-900">{order.order_code}</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Shop: {order.sub_order_code}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    {formatDateTime(order.created_at)}
                  </p>
                </InfoCard>

                <InfoCard title="Trạng thái">
                  <div className="space-y-3">
                    <StatusBadge
                      text={order.status_text}
                      statusClass={order.status_class}
                    />
                    <PaymentBadge
                      text={order.payment_status_text}
                      status={order.payment_status}
                    />
                  </div>
                </InfoCard>
              </div>

              {order.seller_note && (
                <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
                  <p className="text-xs font-black uppercase tracking-wider text-amber-600">
                    Ghi chú đơn hàng
                  </p>
                  <p className="mt-2 text-sm font-medium leading-6 text-amber-800">
                    {order.seller_note}
                  </p>
                </div>
              )}

              {order.cancellation && <div className="rounded-3xl border border-red-200 bg-red-50 p-5"><p className="text-xs font-black uppercase tracking-wider text-red-600">Thông tin hủy đơn</p><p className="mt-2 text-sm font-bold text-slate-700">Bởi {order.cancellation.by?.name || "Tài khoản đã xóa"} · {order.cancellation.at}</p><p className="mt-1 text-sm text-slate-600">Lý do: {order.cancellation.reason || "Không ghi lý do"}</p></div>}

              <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-4">
                  <h3 className="text-base font-black text-gray-900">
                    Sản phẩm trong đơn
                  </h3>
                </div>

                <div className="divide-y divide-gray-100">
                  {order.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex min-w-0 flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center"
                    >
                      <img
                        src={
                          item.product_image ||
                          item.product?.thumbnail ||
                          "https://placehold.co/120x120?text=Product"
                        }
                        alt={item.product_name}
                        className="h-24 w-24 flex-none rounded-3xl object-cover ring-4 ring-gray-50"
                      />

                      <div className="min-w-0 flex-1">
                        {item.product?.id ? (
                          <Link to={`/seller/products?view=${item.product.id}`} className="line-clamp-2 text-base font-black text-gray-900 hover:text-emerald-600 hover:underline">{item.product_name}</Link>
                        ) : (
                          <h4 className="line-clamp-2 text-base font-black text-gray-900">{item.product_name}</h4>
                        )}

                        <p className="mt-1 text-sm text-gray-500">
                          {item.quantity} {item.unit} x{" "}
                          {formatMoney(item.price)}
                        </p>

                        {item.allocated_lots?.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.allocated_lots.map((lot) => (
                              <span
                                key={`${lot.harvest_lot_id}-${lot.lot_code}`}
                                className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700"
                              >
                                {lot.lot_code}: {lot.quantity}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 rounded-full bg-gray-50 px-3 py-1 text-xs font-bold text-gray-400">
                            Không còn lô phân bổ hoặc đơn đã hoàn kho.
                          </p>
                        )}
                      </div>

                      <div className="min-w-0 md:text-right">
                        <p className="text-xs font-bold text-gray-400">
                          Thành tiền
                        </p>
                        <p className="mt-1 break-words text-lg font-black text-emerald-700 sm:text-xl">
                          {formatMoney(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ml-auto w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
                <MoneyRow
                  label="Tiền hàng"
                  value={formatMoney(order.items_total)}
                />
                <MoneyRow
                  label="Phí vận chuyển"
                  value={formatMoney(order.shipping_fee)}
                />
                <div className="my-3 border-t border-dashed border-gray-300" />
                <MoneyRow
                  label="Tổng cộng"
                  value={formatMoney(order.total)}
                  bold
                />
              </div>
            </div>
          )}
        </div>

        {!loading && order && actions.length > 0 && (
          <div className="grid flex-none grid-cols-1 gap-2 border-t border-gray-100 bg-white px-4 py-4 min-[430px]:grid-cols-2 sm:px-6">
            {actions.map((action) => (
              <ActionButton
                key={action.status}
                variant={action.variant}
                onClick={() => onAction(action.status)}
                large
              >
                {action.label}
              </ActionButton>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionModal({
  title,
  order,
  status,
  sellerNote,
  setSellerNote,
  loading,
  onClose,
  onSubmit,
}) {
  const isCancel = Number(status) === 4;

  return (
    <div className="fixed inset-0 z-60 flex items-stretch justify-center overflow-y-auto bg-black/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[100dvh] w-full min-w-0 overflow-y-auto bg-white shadow-2xl sm:max-h-[94dvh] sm:max-w-lg sm:rounded-3xl">
        <div
          className={`px-4 py-5 text-white sm:px-6 ${
            isCancel
              ? "bg-linear-to-r from-red-600 to-rose-500"
              : "bg-linear-to-r from-emerald-600 to-lime-500"
          }`}
        >
          <h2 className="text-xl font-black">{title}</h2>
          <p className="mt-1 text-sm text-white/80">
            {order?.sub_order_code} - {order?.customer_name}
          </p>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          <div className="rounded-3xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Tổng tiền</p>
            <p className="mt-1 text-2xl font-black text-gray-900">
              {formatMoney(order?.total)}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              {isCancel ? "Lý do hủy đơn" : "Ghi chú cho đơn hàng"}
            </label>

            <textarea
              value={sellerNote}
              onChange={(e) => setSellerNote(e.target.value)}
              rows="4"
              placeholder={
                isCancel ? "Nhập lý do hủy đơn..." : "Nhập ghi chú nếu có..."
              }
              className="w-full min-w-0 resize-y rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-50"
            />
          </div>

          {isCancel && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
              Bạn có chắc muốn hủy đơn hàng này? Hành động này không thể hoàn
              tác.
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full rounded-2xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-60 sm:w-auto"
          >
            Đóng
          </button>

          <button
            onClick={onSubmit}
            disabled={loading}
            className={`w-full rounded-2xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60 sm:w-auto ${
              isCancel
                ? "bg-red-600 shadow-red-100 hover:bg-red-700"
                : "bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700"
            }`}
          >
            {loading ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="min-w-0 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <p className="mb-3 text-xs font-black uppercase tracking-wider text-gray-400">
        {title}
      </p>
      {children}
    </div>
  );
}

function MoneyRow({ label, value, bold = false }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4 py-1">
      <span className={bold ? "font-black text-gray-900" : "text-gray-500"}>
        {label}
      </span>
      <span
        className={
          bold
            ? "break-words text-right text-lg font-black text-emerald-700 sm:text-xl"
            : "break-words text-right font-bold text-gray-700"
        }
      >
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ text, statusClass }) {
  const className = {
    success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    danger: "bg-red-50 text-red-700 ring-red-100",
    primary: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    info: "bg-blue-50 text-blue-700 ring-blue-100",
    warning: "bg-amber-50 text-amber-700 ring-amber-100",
  }[statusClass];

  return (
    <span
      className={`inline-flex max-w-full items-center whitespace-normal rounded-full px-3 py-1.5 text-center text-xs font-black ring-1 ${
        className || "bg-gray-50 text-gray-700 ring-gray-100"
      }`}
    >
      {text}
    </span>
  );
}

function PaymentBadge({ text, status }) {
  const className =
    Number(status) === 1
      ? "bg-emerald-50 text-emerald-700"
      : Number(status) === 2
        ? "bg-red-50 text-red-700"
        : Number(status) === 3
          ? "bg-purple-50 text-purple-700"
          : "bg-gray-100 text-gray-600";

  return (
    <span
      className={`inline-flex max-w-full whitespace-normal rounded-full px-3 py-1.5 text-center text-xs font-bold ${className}`}
    >
      {text}
    </span>
  );
}

function ActionButton({
  children,
  variant = "primary",
  onClick,
  large = false,
}) {
  const className = {
    primary: "bg-blue-600 hover:bg-blue-700 shadow-blue-100",
    indigo: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100",
    success: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100",
    danger: "bg-red-600 hover:bg-red-700 shadow-red-100",
  }[variant];

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-xl font-bold text-white shadow-lg transition hover:-translate-y-0.5 ${className} ${
        large ? "min-h-10 px-5 py-2.5 text-sm" : "px-3 py-2 text-xs"
      }`}
    >
      {children}
    </button>
  );
}

function TableSkeleton() {
  return Array.from({ length: 6 }).map((_, rowIndex) => (
    <tr key={rowIndex}>
      {Array.from({ length: 8 }).map((__, cellIndex) => (
        <td key={cellIndex} className="px-5 py-4">
          <SkeletonBox />
        </td>
      ))}
    </tr>
  ));
}

function SkeletonBox({ height = "h-5" }) {
  return (
    <div
      className={`${height} w-full animate-pulse rounded-2xl bg-linear-to-r from-gray-100 via-gray-200 to-gray-100`}
    />
  );
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN") + "đ";
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("vi-VN");
}

function getActionTitle(status) {
  switch (Number(status)) {
    case 1:
      return "Xác nhận chuẩn bị đơn hàng";
    case 2:
      return "Chuyển đơn sang đang giao";
    case 3:
      return "Hoàn thành đơn hàng";
    case 4:
      return "Hủy đơn hàng";
    default:
      return "Cập nhật trạng thái";
  }
}
