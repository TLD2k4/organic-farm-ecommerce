import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Copy,
  Headphones,
  Leaf,
  MapPin,
  PackageCheck,
  PackageSearch,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Wallet,
  XCircle,
} from "lucide-react";

import buyerOrderService from "../../services/buyerOrderService";
import { getPublicFarmPath } from "../../utils/entityLink";
import { formatKg } from "../../utils/quantity";

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();

  const orderId = searchParams.get("order");
  const method = searchParams.get("method");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchOrder = useCallback(async ({ background = false } = {}) => {
    if (!orderId) {
      setLoadError("Thiếu mã đơn hàng nên không thể tải tiến trình.");
      setLoading(false);
      return;
    }

    try {
      if (background) setRefreshing(true);
      else setLoading(true);

      const response = await buyerOrderService.getOrder(orderId);
      const payload = response.data ?? response;
      const nextOrder = payload.data ?? payload;

      setOrder(nextOrder);
      setLoadError("");
      setLastUpdated(new Date());
    } catch (error) {
      console.log("LOAD ORDER SUCCESS DETAIL ERROR:", error);
      setLoadError(
        error?.response?.data?.message ||
          error?.message ||
          "Không thể cập nhật trạng thái đơn hàng.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (!orderId || [3, 4].includes(Number(order?.status))) return undefined;

    const intervalId = window.setInterval(() => {
      fetchOrder({ background: true });
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [fetchOrder, order?.status, orderId]);

  const paymentMethod =
    order?.payment_method || order?.payment?.payment_method || method || "COD";
  const isMomo = paymentMethod === "MOMO";

  const paymentStatus = Number(
    order?.payment_status ?? order?.payment?.status ?? 0
  );

  const isPaid = paymentStatus === 1;

  const orderCode = useMemo(() => {
    if (order?.order_code) return order.order_code;
    if (orderId) return `#${orderId}`;
    return "Đơn hàng mới";
  }, [order, orderId]);

  const paymentText = useMemo(() => {
    if (isMomo) return "ATM qua MoMo";
    return "Thanh toán khi nhận hàng";
  }, [isMomo]);

  const paymentSubText = useMemo(() => {
    if (isMomo) return "Thanh toán online";
    return "COD";
  }, [isMomo]);

  const paymentDesc = useMemo(() => {
    if (isMomo) {
      if (isPaid) return "Hệ thống đã ghi nhận thanh toán online của bạn.";
      if (paymentStatus === 2) return "Thanh toán chưa thành công. Bạn có thể thử lại trong hồ sơ đơn hàng.";
      return "Giao dịch đang chờ hệ thống thanh toán xác nhận.";
    }

    return "Bạn sẽ thanh toán khi nhận và kiểm tra hàng.";
  }, [isMomo, isPaid, paymentStatus]);

  const statusText = order?.id
    ? getOrderStatusText(order.status)
    : loading
      ? "Đang cập nhật"
      : "Chưa xác định";

  const itemsTotal = Number(order?.items_total ?? 0);
  const itemTypes = Number(order?.items_count ?? 0);
  const totalQuantity = Number(order?.items_quantity ?? 0);
  const shippingFee = Number(order?.shipping_fee ?? 0);
  const grandTotal = Number(order?.grand_total ?? 0);

  const copyOrderCode = async () => {
    try {
      await navigator.clipboard.writeText(orderCode);
      toast.success("Đã sao chép mã đơn hàng.");
    } catch {
      toast.error("Không thể sao chép mã đơn hàng.");
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-180px)] overflow-hidden bg-linear-to-b from-[#f3fbef] via-white to-[#f8fff5] py-8">
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-green-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-44 h-80 w-80 rounded-full bg-lime-100/70 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-emerald-50 blur-3xl" />

      <div className="container-main relative z-10">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[32px] border border-green-100 bg-white shadow-[0_24px_90px_rgba(34,100,34,0.13)]">
            <SuccessHero orderCode={orderCode} onCopy={copyOrderCode} status={order?.status} />

            <div className="space-y-6 p-5 md:p-7">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <InfoBox
                  icon={<ClipboardList size={22} />}
                  label="Mã đơn hàng"
                  value={orderCode}
                  action={
                    <button
                      type="button"
                      onClick={copyOrderCode}
                      className="rounded-lg p-1 text-slate-400 transition hover:bg-green-50 hover:text-[#2f9b35]"
                      title="Sao chép"
                    >
                      <Copy size={15} />
                    </button>
                  }
                />

                <InfoBox
                  icon={<Wallet size={22} />}
                  label="Phương thức"
                  value={paymentText}
                />

                <InfoBox
                  icon={<PackageCheck size={22} />}
                  label="Trạng thái"
                  value={statusText}
                  badge
                  badgeClass={getStatusBadgeClass(order?.status)}
                />

                <InfoBox
                  icon={<CalendarDays size={22} />}
                  label="Thời gian đặt"
                  value={formatDateTime(order?.created_at)}
                />
              </div>

              {loadError && (
                <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800 sm:flex-row sm:items-center sm:justify-between">
                  <span>{loadError}</span>
                  <button
                    type="button"
                    onClick={() => fetchOrder()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-amber-800 shadow-sm"
                  >
                    <RefreshCw size={16} />
                    Thử lại
                  </button>
                </div>
              )}

              <OrderTimeline
                order={order}
                isPaid={isPaid}
                refreshing={refreshing}
                lastUpdated={lastUpdated}
                onRefresh={() => fetchOrder({ background: true })}
              />

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                <div className="lg:col-span-4">
                  <OrderSummaryCard
                    loading={loading}
                    itemTypes={itemTypes}
                    totalQuantity={totalQuantity}
                    itemsTotal={itemsTotal}
                    shippingFee={shippingFee}
                    grandTotal={grandTotal}
                  />
                </div>

                <div className="lg:col-span-4">
                  <PaymentCard
                    paymentText={paymentText}
                    paymentSubText={paymentSubText}
                    paymentDesc={paymentDesc}
                    isPaid={isPaid}
                    paymentStatus={paymentStatus}
                    isMomo={isMomo}
                  />
                </div>

                <div className="lg:col-span-4">
                  <DeliveryCard order={order} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Link
                  to="/profile?tab=orders"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-[#168f2e] to-[#55b83a] px-6 text-sm font-black text-white shadow-lg shadow-green-100 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <PackageSearch size={19} />
                  Xem đơn hàng
                </Link>

                <Link
                  to="/products"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-6 text-sm font-black text-[#2f8f35] transition hover:-translate-y-0.5 hover:bg-green-50"
                >
                  <ShoppingBag size={19} />
                  Tiếp tục mua sắm
                </Link>
              </div>

              <TrustStrip />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessHero({ orderCode, onCopy, status }) {
  const statusNumber = Number(status);
  const hero = {
    0: {
      title: "Đặt hàng thành công!",
      desc: "Đơn hàng đã được tạo và đang chờ nông trại xác nhận.",
    },
    1: {
      title: "Đơn hàng đang được chuẩn bị",
      desc: "Nông trại đã xác nhận và đang đóng gói sản phẩm của bạn.",
    },
    2: {
      title: "Đơn hàng đang được giao",
      desc: "Sản phẩm đang trên đường đến địa chỉ nhận hàng.",
    },
    3: {
      title: "Đơn hàng đã hoàn thành",
      desc: "Cảm ơn bạn đã mua hàng tại Organic Farm.",
    },
    4: {
      title: "Đơn hàng đã hủy",
      desc: "Xem lý do và chi tiết từng nông trại trong hồ sơ đơn hàng.",
    },
  }[statusNumber] || {
    title: "Đặt hàng thành công!",
    desc: "Hệ thống đang tải trạng thái mới nhất của đơn hàng.",
  };

  return (
    <div className="relative overflow-hidden bg-linear-to-r from-[#168f2e] via-[#40bd31] to-[#94df00] px-6 py-8 text-white md:px-12">
      <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/15 blur-3xl" />

      <div className="absolute right-10 top-8 hidden text-white/15 md:block">
        <Sparkles size={130} />
      </div>

      <div className="absolute left-20 top-10 hidden h-4 w-4 rounded-full bg-white/30 md:block" />
      <div className="absolute bottom-10 right-52 hidden h-3 w-3 rounded-full bg-white/25 md:block" />

      <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
        <div className="flex justify-center lg:col-span-4">
          <div className="relative">
            <div className="absolute inset-0 scale-125 rounded-full bg-white/20 blur-2xl" />

            <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white/20">
              <div className="flex h-22 w-22 items-center justify-center rounded-full bg-white shadow-2xl shadow-green-900/20">
                <CheckCircle2 size={58} className="text-[#168f2e]" />
              </div>
            </div>

            <span className="absolute -right-2 top-2 rounded-full bg-white/25 p-2">
              <Sparkles size={18} />
            </span>

            <span className="absolute -left-3 bottom-5 rounded-full bg-white/25 p-2">
              <Leaf size={17} />
            </span>
          </div>
        </div>

        <div className="text-center lg:col-span-8 lg:text-left">
          <p className="mb-3 inline-flex rounded-full bg-white/20 px-4 py-1 text-xs font-extrabold uppercase tracking-wide text-white">
            Organic Farm
          </p>

          <h1 className="text-4xl font-black leading-tight tracking-tight md:text-5xl">
            {hero.title}
          </h1>

          <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-white/90 md:text-lg">
            {hero.desc}
          </p>

          <div className="mt-5 inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-3 text-left text-slate-900 shadow-xl shadow-green-900/10">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Mã đơn hàng
              </p>

              <p className="text-2xl font-black text-[#168f2e]">{orderCode}</p>
            </div>

            <button
              type="button"
              onClick={onCopy}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-[#168f2e] transition hover:bg-green-100"
              title="Sao chép mã đơn"
            >
              <Copy size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ icon, label, value, action, badge = false, badgeClass = "" }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-green-50 text-[#2f9b35]">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <div className="mt-1 flex items-center gap-2">
            {badge ? (
              <span className={`rounded-full px-3 py-1 text-xs font-black ${badgeClass || "bg-amber-50 text-amber-600"}`}>
                {value || "-"}
              </span>
            ) : (
              <p className="truncate text-sm font-black text-slate-900">
                {value || "-"}
              </p>
            )}

            {action}
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderTimeline({ order, isPaid, refreshing, lastUpdated, onRefresh }) {
  const hasOrder = Boolean(order?.id);
  const status = hasOrder ? Number(order.status) : -1;
  const cancelled = status === 4;
  const currentIndex = { 0: 1, 1: 2, 2: 3, 3: 4 }[status] ?? -1;
  const steps = [
    { title: "Đã đặt hàng", desc: "Hệ thống đã tạo đơn" },
    { title: "Chờ xác nhận", desc: "Nông trại tiếp nhận đơn" },
    { title: "Chuẩn bị hàng", desc: "Đóng gói và kiểm tra" },
    { title: "Đang giao", desc: "Giao đến địa chỉ nhận" },
    { title: "Hoàn thành", desc: "Bạn đã nhận được hàng" },
  ].map((step, index) => ({
    ...step,
    done: cancelled ? index === 0 : status === 3 ? true : index < currentIndex,
    active: !cancelled && index === currentIndex,
  }));

  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-black text-slate-900">Tiến trình đơn hàng thực tế</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {hasOrder && (
              <span className={`rounded-full px-3 py-1 text-xs font-black ${getStatusBadgeClass(status)}`}>
                Hiện tại: {getOrderStatusText(status)}
              </span>
            )}
            <p className="text-xs font-semibold text-slate-500">
            {lastUpdated
              ? `Cập nhật lúc ${lastUpdated.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
              : "Đang lấy dữ liệu mới nhất từ hệ thống"}
            {!cancelled && status !== 3 ? " · Tự cập nhật mỗi 15 giây" : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-4 text-sm font-black text-green-700 hover:bg-green-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Đang cập nhật" : "Cập nhật ngay"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {steps.map((step, index) => (
          <div key={step.title} className="relative">
            {index < steps.length - 1 && (
              <div className={`absolute left-12 top-6 hidden h-0.5 w-[calc(100%-40px)] border-t border-dashed md:block ${step.done && steps[index + 1]?.done ? "border-green-500" : "border-slate-300"}`} />
            )}

            <div className="relative z-10 flex gap-3 md:block">
              <div
                className={`flex h-12 w-12 flex-none items-center justify-center rounded-full border-2 text-sm font-black ${
                  step.active
                    ? "border-green-700 bg-green-700 text-white shadow-lg shadow-green-200 ring-4 ring-green-100"
                    : step.done
                    ? "border-green-400 bg-green-50 text-green-700"
                    : "border-slate-300 bg-white text-slate-400"
                }`}
              >
                {step.done ? <CheckCircle2 size={22} /> : index + 1}
              </div>

              <div className="md:mt-3">
                <p
                  className={`font-black ${
                    step.active
                      ? "text-green-800"
                      : step.done
                        ? "text-slate-700"
                        : "text-slate-400"
                  }`}
                >
                  {step.title}
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  {step.desc}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {cancelled && (
        <div className="mt-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <XCircle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-black">Đơn hàng đã bị hủy</p>
            <p className="mt-1 font-semibold">
              {order?.cancellation?.reason || "Xem chi tiết đơn hàng để biết thêm thông tin."}
            </p>
          </div>
        </div>
      )}

      {isPaid && (
        <div className="mt-5 rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-700">
          Thanh toán online đã được hệ thống xác nhận.
        </div>
      )}

      <SubOrderProgress subOrders={order?.sub_orders || []} />
    </div>
  );
}

function SubOrderProgress({ subOrders }) {
  if (!subOrders.length) return null;

  return (
    <div className="mt-5 border-t border-slate-200 pt-5">
      <p className="mb-3 text-sm font-black text-slate-800">
        Tiến độ theo từng nông trại
      </p>
      {subOrders.length > 1 && (
        <p className="mb-3 text-xs font-semibold text-slate-500">
          Mỗi nông trại xử lý độc lập nên có thể đang ở các bước khác nhau; mốc phía trên là trạng thái tổng của đơn hàng.
        </p>
      )}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {subOrders.map((subOrder) => {
          const farmPath = getPublicFarmPath(subOrder.farm);
          return (
            <div key={subOrder.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <Store size={15} />
                    {subOrder.sub_order_code || `Đơn #${subOrder.id}`}
                  </p>
                  {farmPath ? (
                    <Link to={farmPath} className="mt-1 block truncate font-black text-slate-900 hover:text-green-700 hover:underline">
                      {subOrder.farm?.name || subOrder.farm_name || "Nông trại"}
                    </Link>
                  ) : (
                    <p className="mt-1 truncate font-black text-slate-900">
                      {subOrder.farm?.name || subOrder.farm_name || "Nông trại"}
                    </p>
                  )}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${getStatusBadgeClass(subOrder.status)}`}>
                  {getOrderStatusText(subOrder.status)}
                </span>
              </div>
              {subOrder.cancellation?.reason && (
                <p className="mt-3 text-xs font-semibold text-red-600">
                  Lý do: {subOrder.cancellation.reason}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderSummaryCard({
  loading,
  itemTypes,
  totalQuantity,
  itemsTotal,
  shippingFee,
  grandTotal,
}) {
  return (
    <div className="h-full rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50 text-[#2f9b35]">
          <ClipboardList size={20} />
        </div>

        <h2 className="text-lg font-black text-slate-900">Tóm tắt đơn hàng</h2>
      </div>

      <div className="space-y-3">
        <MoneyRow
          label="Số loại sản phẩm"
          value={loading ? "Đang tải..." : `${itemTypes} loại`}
        />

        <MoneyRow
          label="Tổng khối lượng"
          value={loading ? "Đang tải..." : formatKg(totalQuantity)}
        />

        <MoneyRow
          label="Tạm tính"
          value={loading ? "Đang tải..." : formatMoney(itemsTotal)}
        />

        <MoneyRow
          label="Phí vận chuyển"
          value={loading ? "Đang tải..." : formatMoney(shippingFee)}
        />

        <MoneyRow label="Ưu đãi" value="0đ" success />

        <div className="border-t border-dashed border-slate-200 pt-3">
          <MoneyRow
            label="Tổng thanh toán"
            value={loading ? "Đang tải..." : formatMoney(grandTotal)}
            bold
          />
        </div>
      </div>
    </div>
  );
}

function PaymentCard({
  paymentText,
  paymentSubText,
  paymentDesc,
  isPaid,
  paymentStatus,
  isMomo,
}) {
  const failed = paymentStatus === 2;
  const statusMessage = isPaid
    ? "Đã ghi nhận thanh toán."
    : failed
      ? "Thanh toán chưa thành công."
      : isMomo
        ? "Đang chờ xác nhận thanh toán."
        : "Thanh toán sau khi nhận hàng.";

  return (
    <div className="h-full rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50 text-[#2f9b35]">
          <Wallet size={20} />
        </div>

        <h2 className="text-lg font-black text-slate-900">
          Phương thức thanh toán
        </h2>
      </div>

      <div className="rounded-2xl bg-green-50 p-4">
        <div className="flex gap-3">
          <Wallet size={22} className="mt-0.5 flex-none text-[#2f9b35]" />

          <div>
            <p className="font-black text-slate-900">{paymentText}</p>
            <p className="mt-0.5 text-sm font-bold text-slate-500">
              {paymentSubText}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">
        {paymentDesc}
      </p>

      <div
        className={`mt-5 rounded-2xl p-4 text-sm font-bold ${
          isPaid
            ? "bg-green-50 text-green-700"
            : failed
              ? "bg-red-50 text-red-700"
              : "bg-blue-50 text-blue-700"
        }`}
      >
        {statusMessage}
      </div>
    </div>
  );
}

function DeliveryCard({ order }) {
  const name = order?.shipping_name || order?.customer_name || "Người nhận";
  const phone = order?.shipping_phone || order?.customer_phone || "-";
  const address = order?.shipping_address || "Địa chỉ giao hàng đã chọn";

  return (
    <div className="h-full rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50 text-[#2f9b35]">
          <MapPin size={20} />
        </div>

        <h2 className="text-lg font-black text-slate-900">Địa chỉ giao hàng</h2>
      </div>

      <div>
        <p className="font-black text-slate-900">{name}</p>
        <p className="mt-1 text-sm font-bold text-slate-500">{phone}</p>

        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          {address}
        </p>
      </div>

      <Link
        to="/profile?tab=orders"
        className="mt-5 inline-flex rounded-xl border border-green-200 px-4 py-2 text-sm font-black text-[#2f8f35] transition hover:bg-green-50"
      >
        Xem chi tiết
      </Link>
    </div>
  );
}

function TrustStrip() {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
      <TrustItem
        icon={<Leaf size={22} />}
        title="Nông sản sạch"
        desc="100% nguồn gốc rõ ràng"
      />

      <TrustItem
        icon={<Truck size={22} />}
        title="Giao hàng nhanh"
        desc="Giao tận nơi toàn quốc"
      />

      <TrustItem
        icon={<ShieldCheck size={22} />}
        title="Đổi trả dễ dàng"
        desc="Hỗ trợ trong 7 ngày"
      />

      <TrustItem
        icon={<Headphones size={22} />}
        title="Hỗ trợ 24/7"
        desc="Luôn sẵn sàng hỗ trợ"
      />
    </div>
  );
}

function TrustItem({ icon, title, desc }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
      <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-green-50 text-[#2f9b35]">
        {icon}
      </div>

      <div>
        <p className="text-sm font-black text-slate-900">{title}</p>
        <p className="mt-0.5 text-xs font-semibold text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

function MoneyRow({ label, value, bold = false, success = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          bold ? "font-black text-slate-900" : "font-semibold text-slate-500"
        }
      >
        {label}
      </span>

      <span
        className={
          bold
            ? "text-2xl font-black text-[#2f9b35]"
            : success
            ? "font-black text-green-600"
            : "font-bold text-slate-700"
        }
      >
        {value}
      </span>
    </div>
  );
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN") + "đ";
}

function getStatusBadgeClass(status) {
  return {
    0: "bg-amber-50 text-amber-700",
    1: "bg-blue-50 text-blue-700",
    2: "bg-indigo-50 text-indigo-700",
    3: "bg-green-50 text-green-700",
    4: "bg-red-50 text-red-700",
  }[Number(status)] || "bg-slate-100 text-slate-600";
}

function getOrderStatusText(status) {
  return {
    0: "Chờ xác nhận",
    1: "Đang chuẩn bị",
    2: "Đang giao",
    3: "Hoàn thành",
    4: "Đã hủy",
  }[Number(status)] || "Đang cập nhật";
}

function formatDateTime(value) {
  if (!value) return "Đang cập nhật";

  const date = new Date(value);

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
