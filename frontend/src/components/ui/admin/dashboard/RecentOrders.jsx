import dayjs from "dayjs";
import { Link } from "react-router-dom";

const orderStatusConfig = {
  0: {
    label: "Chờ xác nhận",
    className: "bg-yellow-100 text-yellow-700",
  },
  1: {
    label: "Đang xử lý",
    className: "bg-blue-100 text-blue-700",
  },
  2: {
    label: "Đang giao",
    className: "bg-violet-100 text-violet-700",
  },
  3: {
    label: "Hoàn thành",
    className: "bg-green-100 text-green-700",
  },
  4: {
    label: "Đã hủy",
    className: "bg-red-100 text-red-700",
  },
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

const formatDate = (value) => {
  return value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "—";
};

export default function RecentOrders({ orders = [], loading = false }) {
  if (loading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />;
  }

  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4 sm:p-5">
        <h2 className="text-lg font-bold text-slate-900">Đơn hàng mới nhất</h2>

        <p className="mt-1 text-sm text-slate-500">
          5 đơn hàng gần đây trong hệ thống
        </p>
      </div>

      {!orders.length ? (
        <div className="px-4 py-12 text-center text-slate-500">
          Chưa có đơn hàng.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-180">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm">Mã đơn</th>

                <th className="px-4 py-3 text-left text-sm">Khách hàng</th>

                <th className="px-4 py-3 text-left text-sm">Tổng tiền</th>

                <th className="px-4 py-3 text-center text-sm">Trạng thái</th>

                <th className="px-4 py-3 text-left text-sm">Ngày tạo</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => {
                const status =
                  orderStatusConfig[order.status] || orderStatusConfig[0];

                return (
                  <tr
                    key={order.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-4 py-4 font-semibold">
                      <Link
                        to={`/admin/orders?mode=orders&view=${order.id}`}
                        title={`Xem chi tiết đơn ${order.order_code}`}
                        className="text-slate-900 entity-name-link entity-name-link-management hover:underline"
                      >
                        {order.order_code}
                      </Link>
                    </td>

                    <td className="px-4 py-4">
                      <div className="max-w-55">
                        <p className="truncate font-medium">
                          {order.user?.name || "Không xác định"}
                        </p>

                        <p className="truncate text-xs text-slate-500">
                          {order.user?.email || "—"}
                        </p>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 font-semibold text-green-700">
                      {formatCurrency(order.grand_total)}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span
                        className={`
                          inline-flex
                          whitespace-nowrap
                          rounded-full
                          px-3
                          py-1
                          text-xs
                          font-semibold

                          ${status.className}
                        `}
                      >
                        {status.label}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
