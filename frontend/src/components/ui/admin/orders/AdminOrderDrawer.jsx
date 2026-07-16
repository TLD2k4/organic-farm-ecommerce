import { Ban, X } from "lucide-react";
import { Link } from "react-router-dom";

import StatusBadge from "@/components/common/StatusBadge";
import { formatDate } from "@/utils/date";
import { getImageUrl } from "@/utils/image";
import { getAdminProductLink } from "@/utils/adminEntityLink";
import {
  formatMoney,
  orderStatusConfig,
  paymentMethodLabel,
  paymentStatusConfig,
  subOrderStatusConfig,
} from "@/utils/adminOrder";

export default function AdminOrderDrawer({
  open,
  order,
  loading,
  actionLoading = false,
  onCancelOrder,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60">
      <button
        type="button"
        aria-label="Đóng chi tiết đơn tổng"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div className="absolute right-0 top-0 h-full w-full max-w-5xl overflow-y-auto bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-5">
          <div>
            <h2 className="text-xl font-extrabold">Chi tiết đơn tổng</h2>
            <p className="text-sm text-slate-500">
              {order?.order_code || "Đang tải..."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết đơn tổng"
            title="Đóng chi tiết đơn tổng"
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X size={21} />
          </button>
        </div>

        <div className="p-5">
          {loading || !order ? (
            <DrawerSkeleton />
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <StatusBadge
                  status={order.status}
                  deletedAt={order.deleted_at}
                  config={orderStatusConfig}
                />
                <StatusBadge
                  status={order.payment?.status ?? 0}
                  deletedAt={order.payment?.deleted_at}
                  config={paymentStatusConfig}
                />
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
                  {paymentMethodLabel(order.payment?.payment_method)}
                </span>
                <span className="ml-auto text-sm text-slate-500">
                  Tạo: {formatDate(order.created_at)}
                </span>
                {order.can_cancel_all && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => onCancelOrder(order)}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    <Ban size={16} />
                    Hủy toàn bộ đơn
                  </button>
                )}
              </div>

              {order.cancellation && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm"><p className="font-black text-red-700">Thông tin hủy đơn</p><p className="mt-2 font-semibold text-slate-700">Bởi {order.cancellation.by?.name || "Tài khoản đã xóa"} · {order.cancellation.at}</p><p className="mt-1 text-slate-600">Lý do: {order.cancellation.reason || "Không ghi lý do"}</p></div>
              )}

              <div className="grid gap-4 lg:grid-cols-3">
                <InfoCard title="Khách hàng">
                  <AvatarLine user={order.customer} />
                  <InfoRow label="Người nhận" value={order.shipping_name} />
                  <InfoRow label="Điện thoại" value={order.shipping_phone} />
                  <InfoRow label="Email" value={order.customer?.email} />
                </InfoCard>

                <InfoCard title="Địa chỉ giao hàng">
                  <p className="whitespace-pre-wrap font-semibold text-slate-800">
                    {order.shipping_address || "—"}
                  </p>
                  {order.address?.deleted_at && (
                    <p className="mt-2 text-xs font-semibold text-red-600">
                      Địa chỉ gốc đã bị xóa mềm.
                    </p>
                  )}
                </InfoCard>

                <InfoCard title="Thanh toán">
                  <InfoRow
                    label="Mã giao dịch"
                    value={order.payment?.transaction_code}
                  />
                  <InfoRow
                    label="Phương thức"
                    value={paymentMethodLabel(order.payment?.payment_method)}
                  />
                  <InfoRow
                    label="Số tiền"
                    value={formatMoney(order.payment?.amount)}
                  />
                  <InfoRow
                    label="Thanh toán lúc"
                    value={formatDate(order.payment?.paid_at)}
                  />
                </InfoCard>
              </div>

              <InfoCard title="Tổng tiền đơn hàng">
                <div className="grid gap-3 sm:grid-cols-3">
                  <MoneyBox label="Tiền hàng" value={order.items_total} />
                  <MoneyBox label="Phí vận chuyển" value={order.shipping_fee} />
                  <MoneyBox label="Tổng thanh toán" value={order.grand_total} strong />
                </div>
              </InfoCard>

              <div>
                <h3 className="mb-3 text-lg font-extrabold">
                  {order.sub_orders.length} đơn theo nông trại
                </h3>
                <div className="space-y-4">
                  {order.sub_orders.map((subOrder) => (
                    <div
                      key={subOrder.id}
                      className="overflow-hidden rounded-2xl border border-slate-200"
                    >
                      <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-4">
                        <div>
                          <p className="font-extrabold">
                            {subOrder.sub_order_code}
                          </p>
                          <p className="text-sm text-slate-500">
                            {subOrder.farm?.name || "Nông trại không còn tồn tại"}
                          </p>
                        </div>
                        <StatusBadge
                          status={subOrder.status}
                          deletedAt={subOrder.deleted_at}
                          config={subOrderStatusConfig}
                        />
                        <StatusBadge
                          status={subOrder.payment_status}
                          config={paymentStatusConfig}
                        />
                        <p className="ml-auto font-extrabold text-red-600">
                          {formatMoney(subOrder.total)}
                        </p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-210">
                          <thead className="bg-white">
                            <tr className="text-left text-sm text-slate-500">
                              <th className="px-4 py-3">Sản phẩm</th>
                              <th className="px-4 py-3 text-right">Giá</th>
                              <th className="px-4 py-3 text-center">SL</th>
                              <th className="px-4 py-3 text-right">Thành tiền</th>
                              <th className="px-4 py-3">Lô FIFO</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(subOrder.items || []).map((item) => (
                              <tr key={item.id} className="border-t border-slate-100">
                                <td className="px-4 py-3">
                                  <ProductLine item={item} />
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {formatMoney(item.price)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {item.quantity} {item.unit}
                                </td>
                                <td className="px-4 py-3 text-right font-bold">
                                  {formatMoney(item.subtotal)}
                                </td>
                                <td className="px-4 py-3">
                                  <Lots lots={item.allocated_lots} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {subOrder.seller_note && (
                        <div className="border-t border-slate-200 p-4">
                          <Note label="Ghi chú seller" value={subOrder.seller_note} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DrawerSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-16 rounded-2xl bg-slate-200" />
      <div className="grid gap-4 lg:grid-cols-3">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="h-48 rounded-2xl bg-slate-200" />
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-slate-200" />
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 font-extrabold text-slate-900">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="wrap-break-word font-semibold">{value || "—"}</p>
    </div>
  );
}

function AvatarLine({ user }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      {user?.avatar ? (
        <img
          src={getImageUrl(user.avatar)}
          alt={user.name}
          className="h-11 w-11 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 font-bold text-red-700">
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
      )}
      <div>
        <p className="font-bold">{user?.name || "—"}</p>
        <p className="text-xs text-slate-500">ID #{user?.id || "—"}</p>
      </div>
    </div>
  );
}

function MoneyBox({ label, value, strong = false }) {
  return (
    <div className={`rounded-xl p-4 ${strong ? "bg-red-50" : "bg-slate-50"}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-extrabold ${strong ? "text-red-600" : ""}`}>
        {formatMoney(value)}
      </p>
    </div>
  );
}

function ProductLine({ item }) {
  const productLink = getAdminProductLink(
    item.current_product,
  );

  return (
    <div className="flex min-w-60 items-center gap-3">
      {item.product_image && (
        <img
          src={getImageUrl(item.product_image)}
          alt={item.product_name}
          className="h-11 w-11 rounded-xl object-cover"
        />
      )}
      <div>
        {productLink ? (
          <Link to={productLink.to} title={productLink.title} className={`font-semibold hover:underline ${productLink.isPublic ? "hover:text-green-700" : "hover:text-sky-600"}`}>{item.product_name}</Link>
        ) : (
          <p className="font-semibold">{item.product_name}</p>
        )}
        <p className="text-xs text-slate-500">SP #{item.product_id}</p>
      </div>
    </div>
  );
}

function Lots({ lots = [] }) {
  if (!lots?.length) return <span className="text-xs text-slate-400">Đã hoàn kho/không có</span>;
  return (
    <div className="flex max-w-70 flex-wrap gap-1">
      {lots.map((lot) => (
        <span
          key={lot.id}
          className="rounded-lg bg-green-50 px-2 py-1 text-xs font-semibold text-green-700"
          title={`Thu hoạch: ${lot.harvest_date || "—"}; HSD: ${lot.expiry_date || "—"}`}
        >
          {lot.lot_code || `Lô #${lot.harvest_lot_id}`}: {lot.quantity}
        </span>
      ))}
    </div>
  );
}

function Note({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm">{value || "—"}</p>
    </div>
  );
}
