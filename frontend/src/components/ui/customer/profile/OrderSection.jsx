import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
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
import buyerCartService from "../../../../services/buyerCartService";
import {
  getPublicFarmPath,
  getPublicProductPath,
} from "../../../../utils/entityLink";
import ResponsiveSelect from "../../../common/ResponsiveSelect";
import {
  formatKg,
  formatQuantity,
  sumItemQuantity,
} from "../../../../utils/quantity";

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
  const [retryPaymentId, setRetryPaymentId] = useState(null);
  const [orderActionId, setOrderActionId] = useState(null);

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

  const handleRetryMomo = async (order) => {
    try {
      setRetryPaymentId(order.id);
      const response = await buyerOrderService.retryMomo(order.id);
      const data = response.data ?? response;
      const url = data.payment_url || data.payUrl || data.pay_url;
      if (!url) throw new Error("Không nhận được đường dẫn MoMo.");
      window.location.href = url;
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Không thể thanh toán lại.");
    } finally {
      setRetryPaymentId(null);
    }
  };

  const handleChangePaymentMethod = async (order) => {
    const currentMethod = order.payment?.payment_method || order.payment_method || "COD";
    const nextMethod = currentMethod === "MOMO" ? "COD" : "MOMO";
    try {
      setOrderActionId(order.id);
      const response = await buyerOrderService.changePaymentMethod(order.id, nextMethod);
      const data = response.data ?? response;
      toast.success(response.message || `Đã đổi sang ${nextMethod}.`);
      if (nextMethod === "MOMO") {
        const url = data.payment_url || data.payUrl || data.pay_url;
        if (!url) throw new Error("Đã đổi sang MoMo nhưng không nhận được đường dẫn thanh toán.");
        window.location.href = url;
        return;
      }
      await fetchOrders();
    } catch (error) {
      toast.error(Object.values(error?.errors || {})[0]?.[0] || error?.message || "Không thể đổi phương thức thanh toán.");
    } finally {
      setOrderActionId(null);
    }
  };

  const handleRebuy = async (order) => {
    const items = getOrderItems(order).filter((item) => item.product_id || item.product?.id);
    if (!items.length) {
      toast.error("Đơn hàng không còn sản phẩm để mua lại.");
      return;
    }
    try {
      setOrderActionId(order.id);
      const results = await Promise.allSettled(items.map((item) => buyerCartService.addItem(item.product_id || item.product?.id, Number(item.quantity) || 1)));
      const added = results.filter((result) => result.status === "fulfilled").length;
      if (!added) throw results.find((result) => result.status === "rejected")?.reason || new Error("Không thể mua lại sản phẩm.");
      window.dispatchEvent(new Event("cart:updated"));
      toast.success(`Đã thêm ${added}/${items.length} loại sản phẩm vào giỏ.`);
      navigate("/cart");
    } catch (error) {
      toast.error(error?.message || "Không thể thêm lại sản phẩm vào giỏ.");
    } finally {
      setOrderActionId(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  useEffect(() => {
  if (handledPaymentRedirect.current) return;

  const payment = searchParams.get("payment");
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
    <div className="w-full min-w-0 space-y-4 sm:space-y-5">
      <div>
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-[#5fa846] sm:h-11 sm:w-11 sm:rounded-2xl">
            <ClipboardList size={22} />
          </div>

          <div className="min-w-0">
            <h2 className="break-words text-xl font-extrabold text-slate-900 sm:text-2xl">
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
              onReview={() => navigate("/profile?tab=reviews")}
              onRetryMomo={handleRetryMomo}
              retrying={retryPaymentId === order.id}
              actionLoading={orderActionId === order.id}
              onChangePaymentMethod={handleChangePaymentMethod}
              onRebuy={handleRebuy}
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
    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex max-w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain">
        {ORDER_TABS.map((tab) => {
          const active = String(value) === String(tab.value);
          const count = getCount(tab.value);

          return (
            <button
              key={tab.label}
              onClick={() => onChange(tab.value)}
              aria-pressed={active}
              title={`Lọc đơn: ${tab.label}`}
              className={`
                relative
                min-w-max
                shrink-0
                snap-start
                px-4
                py-3.5
                text-sm
                font-bold
                transition
                sm:flex-1
                sm:px-5
                sm:py-4
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
                <span className="absolute bottom-0 left-6 right-6 h-0.75 rounded-full bg-[#5fa846]" />
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
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
      <div className="lg:col-span-3">
        <div>
          <ResponsiveSelect
            value={filters.date_from}
            onChange={(value) => onChange("date_from", value)}
            disabled={loading}
            className="w-full"
            options={[
              { value: "", label: "Tất cả thời gian" },
              {
                value: new Date().toISOString().slice(0, 10),
                label: "Hôm nay",
              },
            ]}
          />
        </div>
      </div>

      <div className="min-w-0 sm:col-span-2 lg:col-span-5">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo mã đơn, nông trại, sản phẩm..."
            className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#6BAE4F] focus:ring-4 focus:ring-green-50"
          />
        </div>
      </div>

      <div className="lg:col-span-2">
        <ResponsiveSelect
          value={filters.payment_status}
          onChange={(value) => onChange("payment_status", value)}
          disabled={loading}
          options={[
            { value: "", label: "Thanh toán" },
            { value: "0", label: "Chờ thanh toán" },
            { value: "1", label: "Đã thanh toán" },
            { value: "2", label: "Thất bại" },
            { value: "3", label: "Hoàn tiền" },
          ]}
        />
      </div>

      <div className="lg:col-span-2">
        <ResponsiveSelect
          value={filters.per_page}
          onChange={(value) => onChange("per_page", Number(value))}
          disabled={loading}
          options={[
            { value: 5, label: "5 đơn / trang" },
            { value: 10, label: "10 đơn / trang" },
            { value: 15, label: "15 đơn / trang" },
          ]}
        />
      </div>
    </div>
  );
}

function OrderCard({
  order,
  onViewDetail,
  onCancel,
  onReview,
  onRetryMomo,
  retrying,
  actionLoading,
  onChangePaymentMethod,
  onRebuy,
}) {
  const subOrders = getSubOrders(order);
  const allItems = getOrderItems(order);
  const previewItems = allItems.slice(0, 2);
  const itemTypeCount = getOrderItemTypeCount(order, allItems);
  const totalQuantity = getOrderTotalQuantity(order, allItems);

  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-px hover:shadow-md">
      <div className="flex min-w-0 flex-col gap-3 border-b border-slate-100 bg-white px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-0 items-start gap-2 font-extrabold text-slate-900 sm:items-center">
              <ClipboardList size={18} className="mt-0.5 shrink-0 text-[#5fa846] sm:mt-0" />
              <span className="min-w-0 break-words">Đơn hàng {order.order_code}</span>
            </div>

            {subOrders.length > 1 && (
              <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-[#5fa846]">
                {subOrders.length} gian hàng
              </span>
            )}
          </div>

          <div className="mt-2 flex min-w-0 flex-col gap-1 text-xs font-semibold text-slate-400 min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:gap-2">
            <span className="break-all">Mã đơn: {order.order_code}</span>
            <span className="hidden min-[420px]:inline">|</span>
            <span>Đặt ngày: {formatDateTime(order.created_at)}</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-start gap-2 lg:justify-end">
          <PaymentText order={order} />
          <StatusBadge status={order.status} text={order.status_text} />
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 px-4 py-4 sm:px-5 lg:grid-cols-12 lg:items-center">
        <div className="min-w-0 lg:col-span-6">
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
                  Xem thêm {allItems.length - previewItems.length} loại sản phẩm khác
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

        <div className="min-w-0 border-t border-slate-100 pt-4 lg:col-span-3 lg:border-l lg:border-t-0 lg:px-5 lg:pt-0">
          <p className="text-sm font-semibold text-slate-500">
            {itemTypeCount} loại · {formatKg(totalQuantity)}
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

        <div className="grid min-w-0 grid-cols-1 gap-2 min-[420px]:grid-cols-2 lg:col-span-3 lg:flex lg:flex-col">
          <button
            onClick={() => onViewDetail(order.id)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-[#6BAE4F] hover:bg-green-50 hover:text-[#5fa846]"
          >
            Xem chi tiết
          </button>

          {canRetryMomo(order) && (
            <button disabled={retrying} onClick={() => onRetryMomo(order)} className="h-10 w-full rounded-xl bg-fuchsia-600 px-3 text-sm font-bold text-white hover:bg-fuchsia-700 disabled:opacity-60">
              {retrying ? "Đang tạo link..." : "Thanh toán lại MoMo"}
            </button>
          )}

          {canChangePaymentMethod(order) && (
            <button disabled={actionLoading} onClick={() => onChangePaymentMethod(order)} className="h-10 w-full rounded-xl border border-blue-200 bg-white px-3 text-sm font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-50">
              {(order.payment?.payment_method || order.payment_method) === "MOMO" ? "Đổi sang COD" : "Đổi sang MoMo"}
            </button>
          )}

          {Number(order.status) === 3 && (
            <button disabled={actionLoading} onClick={() => onRebuy(order)} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#6BAE4F] px-4 text-sm font-bold text-white transition hover:bg-[#5d9d43] disabled:opacity-50">
              <RotateCcw size={16} />
              Mua lại
            </button>
          )}

          {Number(order.status) === 3 && (
            <button
              onClick={onReview}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-4 text-sm font-bold text-[#5fa846] transition hover:bg-green-50"
            >
              <Star size={16} />
              Đánh giá
            </button>
          )}

          {canCancelOrder(order) && (
            <button
              onClick={() => onCancel(order)}
              className="h-10 w-full rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-500 transition hover:bg-red-50"
            >
              Hủy đơn
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function ProductLine({ item }) {
  const productPath = getPublicProductPath(item.product);

  return (
    <div className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)] gap-3 sm:grid-cols-[80px_minmax(0,1fr)_auto]">
      {productPath ? (
        <Link to={productPath} className="flex-none">
          <img
            src={
              item.product_image ||
              item.product?.thumbnail ||
              "https://placehold.co/100x100?text=Product"
            }
            alt={item.product_name}
            className="h-16 w-16 rounded-xl border border-slate-100 object-cover sm:h-20 sm:w-20"
          />
        </Link>
      ) : (
        <img
          src={
            item.product_image ||
            item.product?.thumbnail ||
            "https://placehold.co/100x100?text=Product"
          }
          alt={item.product_name}
          className="h-16 w-16 rounded-xl border border-slate-100 object-cover sm:h-20 sm:w-20"
        />
      )}

      <div className="min-w-0 flex-1">
        {productPath ? (
          <Link
            to={productPath}
            className="block truncate text-base font-bold text-slate-900 hover:text-[#5fa846] hover:underline"
          >
            {item.product_name}
          </Link>
        ) : (
          <p className="truncate text-base font-bold text-slate-900">
            {item.product_name}
          </p>
        )}

        <p className="mt-1 text-sm font-semibold text-slate-400">
          {item.unit || "sản phẩm"}
        </p>

        <p className="mt-2 inline-flex rounded-md bg-green-50 px-2 py-1 text-xs font-bold text-[#5fa846]">
          Organic
        </p>
      </div>

      <div className="col-start-2 flex min-w-0 items-center justify-between gap-3 text-left sm:col-start-3 sm:row-start-1 sm:block sm:text-right">
        <p className="shrink-0 text-sm font-semibold text-slate-500">
          {formatQuantity(item.quantity)} {item.unit || "kg"}
        </p>

        <p className="min-w-0 break-words font-bold text-slate-800 sm:mt-2">
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
      <span className="inline-flex max-w-full items-center gap-1 whitespace-normal rounded-full bg-green-50 px-3 py-1.5 text-left text-xs font-bold text-green-600">
        <CheckCircle2 size={14} />
        {paymentMethod === "MOMO" ? "MoMo · Đã thanh toán" : "COD · Đã thu khi giao"}
      </span>
    );
  }

  if (paymentStatus === 2) {
    return (
      <span className="inline-flex max-w-full items-center gap-1 whitespace-normal rounded-full bg-red-50 px-3 py-1.5 text-left text-xs font-bold text-red-500">
        <X size={14} />
        Thanh toán thất bại
      </span>
    );
  }

  if (paymentMethod === "MOMO") {
    return (
      <span className="inline-flex max-w-full items-center gap-1 whitespace-normal rounded-full bg-blue-50 px-3 py-1.5 text-left text-xs font-bold text-blue-600">
        <Truck size={14} />
        Chờ thanh toán MoMo
      </span>
    );
  }

  return (
    <span className="inline-flex max-w-full items-center gap-1 whitespace-normal rounded-full bg-blue-50 px-3 py-1.5 text-left text-xs font-bold text-blue-600">
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
        max-w-full
        rounded-full
        border
        px-3
        py-1.5
        text-xs
        font-extrabold
        whitespace-normal
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
  const pageCount = Math.min(lastPage, 5);
  const firstPage = Math.max(
    1,
    Math.min(currentPage - 2, lastPage - pageCount + 1),
  );
  const pages = Array.from({ length: pageCount }, (_, index) => firstPage + index);

  if (lastPage <= 1) return null;

  return (
    <div className="flex min-w-0 flex-col items-center gap-2 pt-2 sm:flex-row sm:justify-between">
      <p className="text-xs font-semibold text-slate-500 sm:text-sm">
        Trang {currentPage}/{lastPage} · {pagination.total || 0} đơn hàng
      </p>

      <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1">
      <button
        disabled={loading || currentPage <= 1}
        onClick={() => onChangePage(currentPage - 1)}
        aria-label="Trang trước"
        title="Trang trước"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        ‹
      </button>

      {pages.map((page) => {
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
        aria-label="Trang sau"
        title="Trang sau"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        ›
      </button>
      </div>
    </div>
  );
}

function OrderDetailDrawer({ order, loading, onClose, onCancel }) {
  const subOrders = order?.sub_orders || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng chi tiết đơn hàng"
        title="Đóng chi tiết đơn hàng"
        className="absolute inset-0 h-full w-full cursor-default"
      />

      <div className="absolute inset-y-0 right-0 flex h-[100dvh] w-full max-w-130 min-w-0 flex-col bg-white shadow-2xl">
        <div className="flex min-w-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-500">
              Chi tiết đơn hàng
            </p>
            <h3 className="mt-1 break-all text-xl font-extrabold text-slate-900 sm:text-2xl">
              {order?.order_code || "Đang tải..."}
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Đóng chi tiết đơn hàng"
            title="Đóng chi tiết đơn hàng"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition hover:bg-red-50 hover:text-red-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 min-[380px]:p-4 sm:p-6">
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

              {order.cancellation && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm"><p className="font-black text-red-700">Đơn đã bị hủy</p><p className="mt-2 font-semibold text-slate-700">Bởi {order.cancellation.by?.name || "Tài khoản đã xóa"} · {order.cancellation.at}</p><p className="mt-1 text-slate-600">Lý do: {order.cancellation.reason || "Không ghi lý do"}</p></div>}

              <div className="space-y-4">
                {subOrders.map((subOrder) => (
                  <div
                    key={subOrder.id}
                    className="overflow-hidden rounded-2xl border border-slate-100 bg-white"
                  >
                    <div className="flex min-w-0 flex-col gap-2 border-b border-slate-100 px-3 py-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between sm:px-4">
                      <div className="flex min-w-0 items-start gap-2 font-bold text-slate-900">
                        <Store size={17} className="mt-0.5 shrink-0 text-[#5fa846]" />
                        {getPublicFarmPath(subOrder.farm) ? (
                          <Link
                            to={getPublicFarmPath(subOrder.farm)}
                            className="min-w-0 break-words hover:text-[#5fa846] hover:underline"
                          >
                            {subOrder.farm?.name || subOrder.farm_name || "Nông trại"}
                          </Link>
                        ) : (
                          subOrder.farm?.name || subOrder.farm_name || "Nông trại"
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">
                          {Number(subOrder.items_count ?? subOrder.items?.length ?? 0)} loại · {formatKg(subOrder.items_quantity ?? sumItemQuantity(subOrder.items))}
                        </span>
                        <StatusBadge
                          status={subOrder.status}
                          text={subOrder.status_text}
                        />
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {(subOrder.items || []).map((item) => (
                        <div key={item.id} className="p-3 sm:p-4">
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
          <div className="border-t border-slate-100 p-3 sm:p-5">
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
    <div className="fixed inset-0 z-60 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[100dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-xl font-extrabold text-slate-900">
            Hủy đơn hàng
          </h3>

          <p className="mt-1 text-sm text-slate-500">{order?.order_code}</p>
        </div>

        <div className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
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
            className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-50 disabled:opacity-60"
          />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="h-11 w-full rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-600 disabled:opacity-60 sm:h-10 sm:w-auto"
            >
              Đóng
            </button>

            <button
              onClick={onSubmit}
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70 sm:h-10 sm:w-auto"
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
    <div className="flex min-w-0 flex-col gap-1 border-b border-slate-100 py-3 last:border-b-0 sm:grid sm:grid-cols-[minmax(100px,1fr)_minmax(0,2fr)] sm:gap-3">
      <p className="text-sm font-semibold text-slate-400">{label}</p>
      <p className="min-w-0 break-words text-sm font-bold text-slate-700">{value}</p>
    </div>
  );
}

function MoneyRow({ label, value, bold = false }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 py-1">
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

function canRetryMomo(order) {
  const method = order?.payment?.payment_method || order?.payment_method;
  const status = Number(order?.payment_status ?? order?.payment?.status ?? 0);
  return method === "MOMO" && status !== 1 && canChangePaymentMethod(order);
}

function canChangePaymentMethod(order) {
  const paymentStatus = Number(
    order?.payment_status ?? order?.payment?.status ?? 0
  );
  const activeSubOrders = getSubOrders(order).filter(
    (subOrder) => Number(subOrder.status) !== 4
  );

  return (
    paymentStatus !== 1 &&
    Number(order?.status) === 0 &&
    activeSubOrders.length > 0 &&
    activeSubOrders.every((subOrder) => Number(subOrder.status) === 0)
  );
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

function getOrderItemTypeCount(order, items = getOrderItems(order)) {
  if (order?.items_count !== undefined && order?.items_count !== null) {
    return Number(order.items_count || 0);
  }

  if (items.length > 0) return items.length;

  const subOrders = getSubOrders(order);

  return subOrders.reduce((total, subOrder) => {
    return total + Number(subOrder.items_count || subOrder.items?.length || 0);
  }, 0);
}

function getOrderTotalQuantity(order, items = getOrderItems(order)) {
  if (order?.items_quantity !== undefined && order?.items_quantity !== null) {
    return Number(order.items_quantity || 0);
  }

  if (items.length > 0) return sumItemQuantity(items);

  return getSubOrders(order).reduce((total, subOrder) => {
    return total + Number(
      subOrder.items_quantity ??
        subOrder.total_quantity ??
        sumItemQuantity(subOrder.items),
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
