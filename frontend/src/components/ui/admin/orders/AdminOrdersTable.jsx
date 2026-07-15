import { Eye } from "lucide-react";

import StatusBadge from "@/components/common/StatusBadge";
import { formatDate } from "@/utils/date";
import {
  formatMoney,
  orderStatusConfig,
  paymentMethodLabel,
  paymentStatusConfig,
} from "@/utils/adminOrder";

export default function AdminOrdersTable({ orders, loading, onView }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(8)].map((_, index) => (
          <div
            key={index}
            className="h-18 animate-pulse rounded-xl bg-slate-200"
          />
        ))}
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white py-14 text-center text-slate-500">
        Không có đơn tổng nào.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-300">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-4 text-left">Mã đơn</th>
              <th className="px-4 py-4 text-left">Khách hàng</th>
              <th className="px-4 py-4 text-center">Đơn nông trại</th>
              <th className="px-4 py-4 text-center">Sản phẩm</th>
              <th className="px-4 py-4 text-right">Tổng tiền</th>
              <th className="px-4 py-4 text-center">Trạng thái</th>
              <th className="px-4 py-4 text-center">Thanh toán</th>
              <th className="px-4 py-4 text-left">Ngày đặt</th>
              <th className="px-4 py-4 text-center">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-t border-slate-100 transition hover:bg-slate-50"
              >
                <td className="px-4 py-4">
                  <button type="button" onClick={() => onView(order)} className="font-bold text-slate-900 hover:text-sky-600 hover:underline">{order.order_code}</button>
                  <p className="text-xs text-slate-500">#{order.id}</p>
                </td>

                <td className="px-4 py-4">
                  <p className="font-semibold">{order.shipping_name}</p>
                  <p className="text-sm text-slate-500">
                    {order.shipping_phone}
                  </p>
                  <p className="max-w-70 truncate text-xs text-slate-400">
                    {order.customer?.email || "—"}
                  </p>
                </td>

                <td className="px-4 py-4 text-center font-bold">
                  {order.sub_orders_count}
                </td>

                <td className="px-4 py-4 text-center">
                  <p className="font-bold">{order.items_count}</p>
                  <p className="text-xs text-slate-500">
                    {order.items_quantity} sản lượng
                  </p>
                </td>

                <td className="px-4 py-4 text-right font-extrabold text-red-600">
                  {formatMoney(order.grand_total)}
                </td>

                <td className="px-4 py-4 text-center">
                  <StatusBadge
                    status={order.status}
                    deletedAt={order.deleted_at}
                    config={orderStatusConfig}
                  />
                </td>

                <td className="px-4 py-4 text-center">
                  <div className="space-y-1">
                    <StatusBadge
                      status={order.payment?.status ?? 0}
                      deletedAt={order.payment?.deleted_at}
                      config={paymentStatusConfig}
                    />
                    <p className="text-xs font-semibold text-slate-500">
                      {paymentMethodLabel(order.payment?.payment_method)}
                    </p>
                  </div>
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                  {formatDate(order.created_at)}
                </td>

                <td className="px-4 py-4 text-center">
                  <button
                    type="button"
                    title="Xem toàn bộ chi tiết đơn tổng"
                    onClick={() => onView(order)}
                    className="inline-flex cursor-pointer rounded-lg bg-sky-500 p-2 text-white transition hover:bg-sky-600"
                  >
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
