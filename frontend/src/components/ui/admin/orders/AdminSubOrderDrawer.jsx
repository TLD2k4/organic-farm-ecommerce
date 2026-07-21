import { Ban, RefreshCcw, X } from "lucide-react";
import { Link } from "react-router-dom";

import StatusBadge from "@/components/common/StatusBadge";
import { formatDate } from "@/utils/date";
import { getImageUrl } from "@/utils/image";
import { getAdminProductLink } from "@/utils/adminEntityLink";
import { formatQuantity } from "@/utils/quantity";
import {
  formatMoney,
  orderStatusConfig,
  paymentMethodLabel,
  paymentStatusConfig,
  subOrderStatusConfig,
} from "@/utils/adminOrder";

export default function AdminSubOrderDrawer({
  open,
  subOrder,
  loading,
  onClose,
  onUpdateStatus,
}) {
  if (!open) return null;

  const allowedStatuses = Array.isArray(subOrder?.allowed_next_statuses)
    ? subOrder.allowed_next_statuses
    : [];
  const canAdvance = allowedStatuses.some(
    (option) => Number(option.value) !== 4,
  );
  const canCancel = allowedStatuses.some(
    (option) => Number(option.value) === 4,
  );

  return (
    <div className="fixed inset-0 z-60">
      <button
        type="button"
        aria-label="Đóng chi tiết đơn theo nông trại"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div className="absolute right-0 top-0 h-full w-full max-w-4xl overflow-y-auto bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-5">
          <div>
            <h2 className="text-xl font-extrabold">Chi tiết đơn nông trại</h2>
            <p className="text-sm text-slate-500">
              {subOrder?.sub_order_code || "Đang tải..."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canAdvance && (
              <button
                type="button"
                onClick={() => onUpdateStatus(subOrder)}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
              >
                <RefreshCcw size={17} />
                Cập nhật trạng thái
              </button>
            )}
            {canCancel && (
              <button
                type="button"
                onClick={() => onUpdateStatus(subOrder, 4)}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
              >
                <Ban size={17} />
                Hủy đơn con
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng chi tiết đơn gian hàng"
              title="Đóng chi tiết đơn gian hàng"
              className="rounded-lg p-2 hover:bg-slate-100"
            >
              <X size={21} />
            </button>
          </div>
        </div>

        <div className="p-5">
          {loading || !subOrder ? (
            <div className="animate-pulse space-y-4">
              <div className="h-16 rounded-2xl bg-slate-200" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="h-52 rounded-2xl bg-slate-200" />
                <div className="h-52 rounded-2xl bg-slate-200" />
              </div>
              <div className="h-80 rounded-2xl bg-slate-200" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 p-4">
                <StatusBadge
                  status={subOrder.status}
                  deletedAt={subOrder.deleted_at}
                  config={subOrderStatusConfig}
                />
                <StatusBadge
                  status={subOrder.payment_status}
                  config={paymentStatusConfig}
                />
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
                  {paymentMethodLabel(subOrder.payment_method)}
                </span>
                <span className="ml-auto text-sm text-slate-500">
                  {formatDate(subOrder.created_at)}
                </span>
              </div>

              {subOrder.cancellation && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm"><p className="font-black text-red-700">Thông tin hủy đơn con</p><p className="mt-2 font-semibold text-slate-700">Bởi {subOrder.cancellation.by?.name || "Tài khoản đã xóa"} · {subOrder.cancellation.at}</p><p className="mt-1 text-slate-600">Lý do: {subOrder.cancellation.reason || "Không ghi lý do"}</p></div>}

              {!canCancel && subOrder.cancel_block_reason && !subOrder.cancellation && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                  Không thể hủy đơn con: {subOrder.cancel_block_reason}
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-3">
                <Card title="Đơn tổng">
                  <Row label="Mã đơn" value={subOrder.parent_order?.order_code} />
                  <div className="pt-1">
                    <StatusBadge
                      status={subOrder.parent_order?.status}
                      config={orderStatusConfig}
                    />
                  </div>
                  <Row
                    label="Tổng toàn đơn"
                    value={formatMoney(subOrder.parent_order?.grand_total)}
                  />
                </Card>

                <Card title="Nông trại & seller">
                  <Row label="Nông trại" value={subOrder.farm?.name} />
                  <Row label="Seller" value={subOrder.farm?.seller?.name} />
                  <Row label="Email" value={subOrder.farm?.seller?.email} />
                  <Row label="SĐT farm" value={subOrder.farm?.phone} />
                </Card>

                <Card title="Khách hàng & giao hàng">
                  <Row label="Tài khoản" value={subOrder.customer?.name} />
                  <Row label="Người nhận" value={subOrder.shipping_name} />
                  <Row label="Điện thoại" value={subOrder.shipping_phone} />
                  <Row label="Địa chỉ" value={subOrder.shipping_address} />
                </Card>
              </div>

              <Card title="Giá trị đơn theo nông trại">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Money label="Tiền hàng" value={subOrder.items_total} />
                  <Money label="Phí vận chuyển" value={subOrder.shipping_fee} />
                  <Money label="Tổng cộng" value={subOrder.total} strong />
                </div>
              </Card>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-extrabold">
                    Sản phẩm và lô FIFO ({subOrder.items?.length || 0})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-230">
                    <thead>
                      <tr className="text-left text-sm text-slate-500">
                        <th className="px-4 py-3">Sản phẩm</th>
                        <th className="px-4 py-3 text-right">Giá</th>
                        <th className="px-4 py-3 text-center">Số lượng</th>
                        <th className="px-4 py-3 text-right">Thành tiền</th>
                        <th className="px-4 py-3">Lô xuất kho</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(subOrder.items || []).map((item) => (
                        <tr key={item.id} className="border-t border-slate-100">
                          <td className="px-4 py-4">
                            <div className="flex min-w-65 items-center gap-3">
                              {item.product_image && (
                                <img
                                  src={getImageUrl(item.product_image)}
                                  alt={item.product_name}
                                  className="h-12 w-12 rounded-xl object-cover"
                                />
                              )}
                              <div>
                                <ProductNameLink item={item} />
                                <p className="text-xs text-slate-500">
                                  Product #{item.product_id}
                                  {item.current_product?.deleted_at
                                    ? " · đã xóa mềm"
                                    : ""}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            {formatMoney(item.price)}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {formatQuantity(item.quantity)} {item.unit || "kg"}
                          </td>
                          <td className="px-4 py-4 text-right font-bold">
                            {formatMoney(item.subtotal)}
                          </td>
                          <td className="px-4 py-4">
                            {item.allocated_lots?.length ? (
                              <div className="space-y-1">
                                {item.allocated_lots.map((lot) => (
                                  <div
                                    key={lot.id}
                                    className="rounded-lg bg-green-50 px-2 py-1 text-xs text-green-800"
                                  >
                                    <strong>{lot.lot_code || `#${lot.harvest_lot_id}`}</strong>
                                    {` · ${formatQuantity(lot.quantity)} ${item.unit || "kg"}`}
                                    {` · HSD ${lot.expiry_date || "—"}`}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">
                                Đã hoàn kho hoặc không có mapping
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {subOrder.seller_note && (
                <Note title="Ghi chú seller" value={subOrder.seller_note} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductNameLink({ item }) {
  const productLink = getAdminProductLink(
    item.current_product,
  );

  if (!productLink) {
    return <p className="font-semibold">{item.product_name}</p>;
  }

  return (
    <Link
      to={productLink.to}
      title={productLink.title}
      className={`font-semibold hover:underline ${
        productLink.isPublic ? "entity-name-link entity-name-link-public" : "entity-name-link entity-name-link-management"
      }`}
    >
      {item.product_name}
    </Link>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <h3 className="mb-3 font-extrabold">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="wrap-break-word font-semibold">{value || "—"}</p>
    </div>
  );
}

function Money({ label, value, strong = false }) {
  return (
    <div className={`rounded-xl p-4 ${strong ? "bg-red-50" : "bg-slate-50"}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-extrabold ${strong ? "text-red-600" : ""}`}>
        {formatMoney(value)}
      </p>
    </div>
  );
}

function Note({ title, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="font-bold text-slate-700">{title}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
        {value || "Không có ghi chú."}
      </p>
    </div>
  );
}
