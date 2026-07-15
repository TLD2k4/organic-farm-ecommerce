import { Eye, RefreshCcw } from "lucide-react";
import { Link } from "react-router-dom";

import StatusBadge from "@/components/common/StatusBadge";
import { formatDate } from "@/utils/date";
import {
  formatMoney,
  paymentMethodLabel,
  paymentStatusConfig,
  subOrderStatusConfig,
} from "@/utils/adminOrder";

export default function AdminSubOrdersTable({
  subOrders,
  loading,
  onView,
  onUpdateStatus,
}) {
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

  if (!subOrders.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white py-14 text-center text-slate-500">
        Không có đơn theo nông trại nào.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-340">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-4 text-left">Mã đơn nông trại</th>
              <th className="px-4 py-4 text-left">Nông trại</th>
              <th className="px-4 py-4 text-left">Khách hàng</th>
              <th className="px-4 py-4 text-center">Sản phẩm</th>
              <th className="px-4 py-4 text-right">Tổng tiền</th>
              <th className="px-4 py-4 text-center">Trạng thái</th>
              <th className="px-4 py-4 text-center">Thanh toán</th>
              <th className="px-4 py-4 text-left">Ngày tạo</th>
              <th className="px-4 py-4 text-center">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {subOrders.map((subOrder) => {
              const canUpdate =
                !subOrder.deleted_at &&
                Array.isArray(subOrder.allowed_next_statuses) &&
                subOrder.allowed_next_statuses.length > 0;

              return (
                <tr
                  key={subOrder.id}
                  className="border-t border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-4 py-4">
                    <button type="button" onClick={() => onView(subOrder)} className="font-bold hover:text-sky-600 hover:underline">{subOrder.sub_order_code}</button>
                    <p className="text-xs text-slate-500">
                      Đơn tổng: {subOrder.order_code}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    {subOrder.farm?.slug ? (
                      <Link to={`/farms/${subOrder.farm.slug}`} className="block max-w-55 truncate font-semibold hover:text-green-700 hover:underline">{subOrder.farm.name}</Link>
                    ) : (
                      <p className="max-w-55 truncate font-semibold">{subOrder.farm?.name || "—"}</p>
                    )}
                    <p className="max-w-55 truncate text-xs text-slate-500">
                      {subOrder.farm?.seller?.name || "Không có seller"}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-semibold">{subOrder.shipping_name}</p>
                    <p className="text-sm text-slate-500">
                      {subOrder.shipping_phone}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <p className="font-bold">{subOrder.items_count}</p>
                    <p className="text-xs text-slate-500">
                      {subOrder.items_quantity} sản lượng
                    </p>
                  </td>

                  <td className="px-4 py-4 text-right font-extrabold text-red-600">
                    {formatMoney(subOrder.total)}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <StatusBadge
                      status={subOrder.status}
                      deletedAt={subOrder.deleted_at}
                      config={subOrderStatusConfig}
                    />
                  </td>

                  <td className="px-4 py-4 text-center">
                    <div className="space-y-1">
                      <StatusBadge
                        status={subOrder.payment_status}
                        config={paymentStatusConfig}
                      />
                      <p className="text-xs font-semibold text-slate-500">
                        {paymentMethodLabel(subOrder.payment_method)}
                      </p>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                    {formatDate(subOrder.created_at)}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex min-w-max items-center justify-center gap-2">
                      <button
                        type="button"
                        title="Xem chi tiết"
                        onClick={() => onView(subOrder)}
                        className="cursor-pointer rounded-lg bg-sky-500 p-2 text-white transition hover:bg-sky-600"
                      >
                        <Eye size={16} />
                      </button>

                      {canUpdate && (
                        <button
                          type="button"
                          title="Cập nhật trạng thái"
                          onClick={() => onUpdateStatus(subOrder)}
                          className="cursor-pointer rounded-lg bg-indigo-500 p-2 text-white transition hover:bg-indigo-600"
                        >
                          <RefreshCcw size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
