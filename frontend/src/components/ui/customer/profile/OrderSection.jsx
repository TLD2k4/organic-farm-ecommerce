import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Loader2,
  PackageOpen,
  RotateCcw,
  Search,
  Star,
  Store,
  Truck,
  X,
} from "lucide-react";

import buyerOrderService from "../../../../services/buyerOrderService";

const ORDER_TABS = [
  { label: "Tất cả", value: "" },
  { label: "Chờ xác nhận", value: "0" },
  { label: "Đang xử lý", value: "1" },
  { label: "Đang giao", value: "2" },
  { label: "Hoàn thành", value: "3" },
  { label: "Đã hủy", value: "4" },
];

export default function OrderSection() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const handledPaymentRedirect = useRef(false);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const [filters, setFilters] = useState({
    status: "",
    payment_status: "",
    date_from: "",
    date_to: "",
    per_page: 5,
    page: 1,
  });

  const [keyword, setKeyword] = useState("");

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelOrder, setCancelOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);

      const response = await buyerOrderService.getOrders(filters);
      const payload = response.data ?? response;

      setOrders(payload.orders || []);
      setStats(payload.stats || {});
      setPagination(
        payload.pagination || {
          current_page: 1,
          last_page: 1,
          total: 0,
        }
      );
    } catch (error) {
      console.log("LOAD BUYER ORDERS ERROR:", error);
      toast.error(
        error?.response?.data?.message || "Không thể tải danh sách đơn hàng."
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  useEffect(() => {
  if (handledPaymentRedirect.current) return;

  const payment = searchParams.get("payment");
  const orderId = searchParams.get("order");

  if (!payment) return;

  handledPaymentRedirect.current = true;

  if (payment === "success") {
    toast.success("Thanh toán MoMo thành công.");
    fetchOrders();
  }

  if (payment === "failed") {
    toast.error("Thanh toán MoMo thất bại.");
  }

  if (payment === "invalid") {
    toast.error("Xác thực thanh toán không hợp lệ.");
  }

  if (payment === "not_found") {
    toast.error("Không tìm thấy đơn hàng thanh toán.");
  }

  const nextParams = new URLSearchParams(searchParams);

  nextParams.delete("payment");
  nextParams.delete("order");

  setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, fetchOrders]);

  useEffect(() => {
    if (showDetail || showCancelModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showDetail, showCancelModal]);

  const filteredOrders = useMemo(() => {
    const text = keyword.trim().toLowerCase();

    if (!text) return orders;

    return orders.filter((order) => {
      const orderCode = String(order.order_code || "").toLowerCase();
      const receiver = String(order.shipping_name || "").toLowerCase();
      const phone = String(order.shipping_phone || "").toLowerCase();

      const farmNames = (order.sub_orders || [])
        .map((subOrder) => subOrder.farm?.name || subOrder.farm_name || "")
        .join(" ")
        .toLowerCase();

      const productNames = (order.sub_orders || [])
        .flatMap((subOrder) => subOrder.items || [])
        .map((item) => item.product_name || "")
        .join(" ")
        .toLowerCase();

      return (
        orderCode.includes(text) ||
        receiver.includes(text) ||
        phone.includes(text) ||
        farmNames.includes(text) ||
        productNames.includes(text)
      );
    });
  }, [orders, keyword]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }));
  };

  const handleChangePage = (page) => {
    if (page < 1 || page > Number(pagination.last_page || 1)) return;

    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const handleViewDetail = async (orderId) => {
    try {
      setSelectedOrder(null);
      setShowDetail(true);
      setDetailLoading(true);

      const response = await buyerOrderService.getOrder(orderId);
      setSelectedOrder(response.data ?? response);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Không thể tải chi tiết đơn hàng."
      );
      setShowDetail(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const openCancelModal = (order) => {
    setCancelOrder(order);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    if (cancelLoading) return;

    setShowCancelModal(false);
    setCancelOrder(null);
    setCancelReason("");
  };

  const handleCancelOrder = async () => {
    if (!cancelOrder || cancelLoading) return;

    try {
      setCancelLoading(true);

      const response = await buyerOrderService.cancelOrder(
        cancelOrder.id,
        cancelReason
      );

      toast.success(response.message || "Hủy đơn hàng thành công.");

      closeCancelModal();
      await fetchOrders();

      if (selectedOrder?.id === cancelOrder.id) {
        setShowDetail(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      const errors = error?.response?.data?.errors;
      const firstError = errors ? Object.values(errors)?.[0]?.[0] : null;

      toast.error(
        firstError ||
          error?.response?.data?.message ||
          "Không thể hủy đơn hàng."
      );
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#5fa846]">
            <ClipboardList size={22} />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Đơn hàng của tôi
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Theo dõi trạng thái đơn hàng và quản lý các đơn đã đặt.
            </p>
          </div>
        </div>
      </div>

      <OrderTabs
        value={filters.status}
        stats={stats}
        onChange={(value) => handleFilterChange("status", value)}
      />

      <OrderFilters
        keyword={keyword}
        setKeyword={setKeyword}
        filters={filters}
        loading={loading}
        onChange={handleFilterChange}
      />

      {loading ? (
        <OrderSkeleton />
      ) : filteredOrders.length === 0 ? (
        <EmptyOrders />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onViewDetail={handleViewDetail}
              onCancel={openCancelModal}
            />
          ))}
        </div>
      )}

      <Pagination
        pagination={pagination}
        loading={loading}
        onChangePage={handleChangePage}
      />

      {showDetail && (
        <OrderDetailDrawer
          order={selectedOrder}
          loading={detailLoading}
          onClose={() => {
            setShowDetail(false);
            setSelectedOrder(null);
          }}
          onCancel={openCancelModal}
        />
      )}

      {showCancelModal && (
        <CancelOrderModal
          order={cancelOrder}
          reason={cancelReason}
          setReason={setCancelReason}
          loading={cancelLoading}
          onClose={closeCancelModal}
          onSubmit={handleCancelOrder}
        />
      )}
    </div>
  );
}

function OrderTabs({ value, stats, onChange }) {
  const getCount = (status) => {
    if (status === "") return stats.total_orders || 0;
    if (status === "0") return stats.pending_orders || 0;
    if (status === "1") return stats.processing_orders || 0;
    if (status === "2") return stats.shipping_orders || 0;
    if (status === "3") return stats.completed_orders || 0;
    if (status === "4") return stats.cancelled_orders || 0;

    return 0;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex overflow-x-auto">
        {ORDER_TABS.map((tab) => {
          const active = String(value) === String(tab.value);
          const count = getCount(tab.value);

          return (
            <button
              key={tab.label}
              onClick={() => onChange(tab.value)}
              className={`
                relative
                min-w-max
                flex-1
                px-5
                py-4
                text-sm
                font-bold
                transition
                ${
                  active
                    ? "text-[#5fa846]"
                    : "text-slate-600 hover:bg-green-50 hover:text-[#5fa846]"
                }
              `}
            >
              {tab.label}
              {count > 0 && (
                <span className="ml-2 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-extrabold text-orange-500">
                  {count}
                </span>
              )}

              {active && (
                <span className="absolute bottom-0 left-6 right-6 h-[3px] rounded-full bg-[#5fa846]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OrderFilters({ keyword, setKeyword, filters, loading, onChange }) {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
      <div className="lg:col-span-3">
        <div className="relative">
          <CalendarDays
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <select
            value={filters.date_from}
            onChange={(e) => onChange("date_from", e.target.value)}
            disabled={loading}
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#6BAE4F] focus:ring-4 focus:ring-green-50 disabled:opacity-60"
          >
            <option value="">Tất cả thời gian</option>
            <option value={new Date().toISOString().slice(0, 10)}>
              Hôm nay
            </option>
          </select>
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo mã đơn, nông trại, sản phẩm..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#6BAE4F] focus:ring-4 focus:ring-green-50"
          />
        </div>
      </div>

      <div className="lg:col-span-2">
        <select
          value={filters.payment_status}
          onChange={(e) => onChange("payment_status", e.target.value)}
          disabled={loading}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#6BAE4F] focus:ring-4 focus:ring-green-50 disabled:opacity-60"
        >
          <option value="">Thanh toán</option>
          <option value="0">Chờ thanh toán</option>
          <option value="1">Đã thanh toán</option>
          <option value="2">Thất bại</option>
          <option value="3">Hoàn tiền</option>
        </select>
      </div>

      <div className="lg:col-span-2">
        <select
          value={filters.per_page}
          onChange={(e) => onChange("per_page", Number(e.target.value))}
          disabled={loading}
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#6BAE4F] focus:ring-4 focus:ring-green-50 disabled:opacity-60"
        >
          <option value={5}>5 đơn / trang</option>
          <option value={10}>10 đơn / trang</option>
          <option value={15}>15 đơn / trang</option>
        </select>
      </div>
    </div>
  );
}

function OrderCard({ order, onViewDetail, onCancel }) {
  const subOrders = getSubOrders(order);
  const allItems = getOrderItems(order);
  const previewItems = allItems.slice(0, 2);
  const itemCount = getOrderItemCount(order);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-[1px] hover:shadow-md">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-white px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 font-extrabold text-slate-900">
              <ClipboardList size={18} className="text-[#5fa846]" />
              Đơn hàng {order.order_code}
            </div>

            {subOrders.length > 1 && (
              <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-[#5fa846]">
                {subOrders.length} gian hàng
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-400">
            <span>Mã đơn: {order.order_code}</span>
            <span>|</span>
            <span>Đặt ngày: {formatDateTime(order.created_at)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PaymentText order={order} />
          <StatusBadge status={order.status} text={order.status_text} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-5 py-4 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-6">
          {previewItems.length > 0 ? (
            <div className="space-y-3">
              {previewItems.map((item) => (
                <ProductLine key={item.id} item={item} />
              ))}

              {allItems.length > previewItems.length && (
                <button
                  onClick={() => onViewDetail(order.id)}
                  className="text-sm font-bold text-[#5fa846] hover:underline"
                >
                  Xem thêm {allItems.length - previewItems.length} sản phẩm khác
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-5 text-slate-400">
              <PackageOpen size={22} />
              <div>
                <p className="text-sm font-bold text-slate-500">
                  Chưa có dữ liệu sản phẩm ở danh sách
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Bấm xem chi tiết để xem sản phẩm trong đơn.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-slate-100 lg:col-span-3 lg:border-l lg:px-5">
          <p className="text-sm font-semibold text-slate-500">
            Tổng tiền ({itemCount} sản phẩm)
          </p>

          <p
            className={`
              mt-1
              text-2xl
              font-extrabold
              ${
                Number(order.status) === 4
                  ? "text-slate-500"
                  : "text-[#5fa846]"
              }
            `}
          >
            {formatMoney(order.grand_total)}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-400">
            Phí vận chuyển: {formatMoney(order.shipping_fee)}
          </p>
        </div>

        <div className="flex flex-col gap-2 lg:col-span-3">
          <button
            onClick={() => onViewDetail(order.id)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-[#6BAE4F] hover:bg-green-50 hover:text-[#5fa846]"
          >
            Xem chi tiết
          </button>

          {Number(order.status) === 3 && (
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#6BAE4F] px-4 text-sm font-bold text-white transition hover:bg-[#5d9d43]">
              <RotateCcw size={16} />
              Mua lại
            </button>
          )}

          {Number(order.status) === 3 && (
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-4 text-sm font-bold text-[#5fa846] transition hover:bg-green-50">
              <Star size={16} />
              onClick={() => navigate("/profile?tab=reviews")}
              Đánh giá
            </button>
          )}

          {canCancelOrder(order) && (
            <button
              onClick={() => onCancel(order)}
              className="h-10 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-500 transition hover:bg-red-50"
            >
              Hủy đơn
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductLine({ item }) {
  return (
    <div className="flex gap-3">
      <img
        src={
          item.product_image ||
          item.product?.thumbnail ||
          "https://placehold.co/100x100?text=Product"
        }
        alt={item.product_name}
        className="h-20 w-20 rounded-xl border border-slate-100 object-cover"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-slate-900">
          {item.product_name}
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-400">
          {item.unit || "sản phẩm"}
        </p>

        <p className="mt-2 inline-flex rounded-md bg-green-50 px-2 py-1 text-xs font-bold text-[#5fa846]">
          Organic
        </p>
      </div>

      <div className="text-right">
        <p className="text-sm font-semibold text-slate-500">x {item.quantity}</p>

        <p className="mt-2 font-bold text-slate-800">
          {formatMoney(item.subtotal)}
        </p>
      </div>
    </div>
  );
}

function PaymentText({ order }) {
  const paymentMethod =
    order.payment?.payment_method || order.payment_method || "COD";

  const paymentStatus = Number(
    order.payment_status ?? order.payment?.status ?? 0
  );

  if (paymentStatus === 1) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-600">
        <CheckCircle2 size={14} />
        Đã thanh toán
      </span>
    );
  }

  if (paymentStatus === 2) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-500">
        <X size={14} />
        Thanh toán thất bại
      </span>
    );
  }

  if (paymentMethod === "MOMO") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600">
        <Truck size={14} />
        Chờ thanh toán MoMo
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600">
      <Truck size={14} />
      Thanh toán khi nhận hàng
    </span>
  );
}

function StatusBadge({ status, text }) {
  const numberStatus = Number(status);

  const config = {
    0: "bg-amber-50 text-amber-600 border-amber-100",
    1: "bg-blue-50 text-blue-600 border-blue-100",
    2: "bg-indigo-50 text-indigo-600 border-indigo-100",
    3: "bg-green-50 text-green-600 border-green-100",
    4: "bg-red-50 text-red-500 border-red-100",
  };

  return (
    <span
      className={`
        inline-flex
        rounded-full
        border
        px-3
        py-1.5
        text-xs
        font-extrabold
        ${config[numberStatus] || "bg-slate-50 text-slate-500 border-slate-100"}
      `}
    >
      {text || "-"}
    </span>
  );
}

function Pagination({ pagination, loading, onChangePage }) {
  const currentPage = Number(pagination.current_page || 1);
  const lastPage = Number(pagination.last_page || 1);

  if (lastPage <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button
        disabled={loading || currentPage <= 1}
        onClick={() => onChangePage(currentPage - 1)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        ‹
      </button>

      {Array.from({ length: Math.min(lastPage, 5) }).map((_, index) => {
        const page = index + 1;
        const active = page === currentPage;

        return (
          <button
            key={page}
            disabled={loading}
            onClick={() => onChangePage(page)}
            className={`
              h-9
              w-9
              rounded-lg
              text-sm
              font-bold
              ${
                active
                  ? "bg-[#6BAE4F] text-white"
                  : "border border-slate-200 bg-white text-slate-600"
              }
            `}
          >
            {page}
          </button>
        );
      })}

      <button
        disabled={loading || currentPage >= lastPage}
        onClick={() => onChangePage(currentPage + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        ›
      </button>
    </div>
  );
}

function OrderDetailDrawer({ order, loading, onClose, onCancel }) {
  const subOrders = order?.sub_orders || [];
  const items = subOrders.flatMap((subOrder) => subOrder.items || []);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      <div className="absolute right-0 top-0 flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-slate-500">
              Chi tiết đơn hàng
            </p>
            <h3 className="mt-1 text-2xl font-extrabold text-slate-900">
              {order?.order_code || "Đang tải..."}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-red-50 hover:text-red-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading || !order ? (
            <DetailSkeleton />
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <InfoRow label="Mã đơn" value={order.order_code} />
                <InfoRow
                  label="Ngày đặt"
                  value={formatDateTime(order.created_at)}
                />
                <InfoRow
                  label="Người nhận"
                  value={order.shipping_name || order.customer_name || "-"}
                />
                <InfoRow
                  label="SĐT"
                  value={order.shipping_phone || order.customer_phone || "-"}
                />
                <InfoRow
                  label="Địa chỉ"
                  value={order.shipping_address || "-"}
                />
              </div>

              <div className="space-y-4">
                {subOrders.map((subOrder) => (
                  <div
                    key={subOrder.id}
                    className="overflow-hidden rounded-2xl border border-slate-100 bg-white"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <Store size={17} className="text-[#5fa846]" />
                        {subOrder.farm?.name || subOrder.farm_name || "Nông trại"}
                      </div>

                      <StatusBadge
                        status={subOrder.status}
                        text={subOrder.status_text}
                      />
                    </div>

                    <div className="divide-y divide-slate-100">
                      {(subOrder.items || []).map((item) => (
                        <div key={item.id} className="p-4">
                          <ProductLine item={item} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-green-50 p-4">
                <MoneyRow
                  label="Tiền hàng"
                  value={formatMoney(order.items_total)}
                />
                <MoneyRow
                  label="Phí vận chuyển"
                  value={formatMoney(order.shipping_fee)}
                />
                <div className="my-3 border-t border-dashed border-green-200" />
                <MoneyRow
                  label="Tổng thanh toán"
                  value={formatMoney(order.grand_total)}
                  bold
                />
              </div>
            </div>
          )}
        </div>

        {!loading && order && (
          <div className="border-t border-slate-100 p-5">
            {canCancelOrder(order) && (
              <button
                onClick={() => onCancel(order)}
                className="mb-3 h-11 w-full rounded-xl border border-red-200 bg-white text-sm font-bold text-red-500 transition hover:bg-red-50"
              >
                Hủy đơn
              </button>
            )}

            <button
              onClick={onClose}
              className="h-11 w-full rounded-xl bg-[#6BAE4F] text-sm font-bold text-white transition hover:bg-[#5d9d43]"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CancelOrderModal({
  order,
  reason,
  setReason,
  loading,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="px-6 py-5">
          <h3 className="text-xl font-extrabold text-slate-900">
            Hủy đơn hàng
          </h3>

          <p className="mt-1 text-sm text-slate-500">{order?.order_code}</p>
        </div>

        <div className="space-y-4 px-6 pb-6">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Tổng thanh toán</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {formatMoney(order?.grand_total)}
            </p>
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
            rows="4"
            placeholder="Nhập lý do hủy đơn..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-50 disabled:opacity-60"
          />

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="h-10 rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 disabled:opacity-60"
            >
              Đóng
            </button>

            <button
              onClick={onSubmit}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Đang hủy..." : "Xác nhận hủy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="grid grid-cols-3 gap-3 border-b border-slate-100 py-3 last:border-b-0">
      <p className="text-sm font-semibold text-slate-400">{label}</p>
      <p className="col-span-2 text-sm font-bold text-slate-700">{value}</p>
    </div>
  );
}

function MoneyRow({ label, value, bold = false }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span
        className={
          bold ? "font-extrabold text-slate-900" : "font-semibold text-slate-500"
        }
      >
        {label}
      </span>

      <span
        className={
          bold
            ? "text-2xl font-extrabold text-[#5fa846]"
            : "font-bold text-slate-700"
        }
      >
        {value}
      </span>
    </div>
  );
}

function EmptyOrders() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-green-50 text-[#5fa846]">
        <PackageOpen size={32} />
      </div>

      <h3 className="mt-4 text-lg font-extrabold text-slate-900">
        Chưa có đơn hàng nào
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        Khi bạn đặt hàng, đơn sẽ hiển thị tại đây.
      </p>
    </div>
  );
}

function OrderSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
        >
          <div className="mb-4 h-5 w-1/3 animate-pulse rounded-full bg-slate-100" />

          <div className="flex gap-4">
            <div className="h-20 w-20 animate-pulse rounded-xl bg-slate-100" />

            <div className="flex-1 space-y-3">
              <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-100" />
              <div className="h-4 w-1/3 animate-pulse rounded-full bg-slate-100" />
              <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
            </div>

            <div className="hidden w-48 space-y-3 lg:block">
              <div className="h-4 animate-pulse rounded-full bg-slate-100" />
              <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-44 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}

function canCancelOrder(order) {
  if (!order) return false;

  const status = Number(order.status);

  if ([2, 3, 4].includes(status)) {
    return false;
  }

  const paymentMethod =
    order.payment?.payment_method || order.payment_method || "COD";

  const paymentStatus = Number(
    order.payment_status ?? order.payment?.status ?? 0
  );

  if (paymentMethod === "MOMO" && paymentStatus === 1) {
    return false;
  }

  const subOrders = order.sub_orders || [];

  if (subOrders.some((subOrder) => [2, 3].includes(Number(subOrder.status)))) {
    return false;
  }

  return true;
}

function getTotalItems(order) {
  return (order.sub_orders || []).reduce((total, subOrder) => {
    return (
      total +
      (subOrder.items || []).reduce((sum, item) => {
        return sum + Number(item.quantity || 0);
      }, 0)
    );
  }, 0);
}

function getSubOrders(order) {
  return order?.sub_orders || order?.subOrders || [];
}

function getOrderItems(order) {
  const directItems = order?.items || order?.order_items || [];

  const nestedItems = getSubOrders(order).flatMap((subOrder) => {
    return subOrder.items || subOrder.order_items || [];
  });

  return [...directItems, ...nestedItems].filter(Boolean);
}

  function getOrderItemCount(order) {
    const items = getOrderItems(order);

    if (items.length > 0) {
      return items.reduce((total, item) => {
        return total + Number(item.quantity || 0);
      }, 0);
    }

    if (order?.items_quantity !== undefined && order?.items_quantity !== null) {
      return Number(order.items_quantity || 0);
    }

    if (order?.items_count !== undefined && order?.items_count !== null) {
      return Number(order.items_count || 0);
    }

    const subOrders = getSubOrders(order);

    return subOrders.reduce((total, subOrder) => {
      return (
        total +
        Number(
          subOrder.items_quantity ||
            subOrder.items_count ||
            subOrder.total_quantity ||
            0
        )
      );
    }, 0);
  }

function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN") + "đ";
}

function formatDateTime(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

