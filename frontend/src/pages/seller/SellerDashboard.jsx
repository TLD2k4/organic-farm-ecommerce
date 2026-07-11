import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  ClipboardList,
  ShoppingCart,
  Banknote,
  Warehouse,
  MoreHorizontal,
} from "lucide-react";
import dashboardService from "../../services/dashboardService";

function SellerDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await dashboardService.getSellerDashboard();
      setDashboard(res.data);
    } catch (err) {
      setError(err.error || "Không thể tải dữ liệu dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <p className="font-bold text-red-500">{error}</p>;
  }

  if (!dashboard) return null;

  const stats = dashboard.stats || {};
  const revenueChart = dashboard.revenue_chart || [];
  const harvestLots = dashboard.harvest_lots || [];
  const lowStockProducts = dashboard.low_stock_products || [];
  const recentOrders = dashboard.recent_orders || [];
  const warningProducts = dashboard.warning_products || [];

  const maxRevenue = Math.max(
    ...revenueChart.map((item) => Number(item.revenue || 0)),
    1
  );
  const hasRevenueChart = revenueChart.some(
    (item) => Number(item.revenue || 0) > 0
    );

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950">
            Xin chào, {dashboard.farm?.name || "Nông dân An Tâm"}! 👋
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Đây là tổng quan hoạt động nông trại của bạn hôm nay.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
          Hôm nay: {dashboard.today || "19/06/2026"}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <StatCard
          icon={<Package size={28} />}
          iconClass="bg-green-100 text-green-700"
          title="Tổng sản phẩm"
          value={stats.total_products ?? 0}
          sub={`+ ${stats.new_products ?? 0} so với tháng trước ↑`}
        />

        <StatCard
          icon={<ClipboardList size={28} />}
          iconClass="bg-blue-100 text-blue-600"
          title="Tổng lô thu hoạch"
          value={stats.total_lots ?? 0}
          sub={`+ ${stats.new_lots ?? 0} so với tháng trước ↑`}
        />

        <StatCard
          icon={<ShoppingCart size={28} />}
          iconClass="bg-orange-100 text-orange-600"
          title="Đơn hàng mới"
          value={stats.new_orders ?? 0}
          sub="Chờ xác nhận"
          subClass="text-orange-500"
        />

        <StatCard
          icon={<Banknote size={28} />}
          iconClass="bg-purple-100 text-purple-600"
          title="Doanh thu tháng"
          value={stats.month_revenue_text ?? "0 đ"}
          sub={`+ ${stats.revenue_growth ?? 0}% so với tháng trước ↑`}
        />

        <StatCard
          icon={<Warehouse size={28} />}
          iconClass="bg-green-100 text-green-700"
          title="Tổng tồn kho"
          value={`${stats.total_stock ?? 0} kg`}
          sub="Trong các lô"
        />
      </div>

      <div className="grid grid-cols-[0.85fr_1.25fr] gap-5">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Doanh thu 7 ngày gần nhất</h2>

            <select className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none">
              <option>7 ngày qua</option>
            </select>
          </div>

          <div className="relative flex h-[245px] items-end justify-between gap-3 border-b border-slate-200 bg-[linear-gradient(to_bottom,transparent_24%,#eef2ee_25%,transparent_26%,transparent_49%,#eef2ee_50%,transparent_51%,transparent_74%,#eef2ee_75%,transparent_76%)] px-3 pb-3">
          {hasRevenueChart ? (
            <div className="relative flex h-[245px] items-end justify-between gap-3 border-b border-slate-200 bg-[linear-gradient(to_bottom,transparent_24%,#eef2ee_25%,transparent_26%,transparent_49%,#eef2ee_50%,transparent_51%,transparent_74%,#eef2ee_75%,transparent_76%)] px-3 pb-3">
              {revenueChart.map((item) => {
                const revenue = Number(item.revenue || 0);
                const height =
                  revenue > 0 ? Math.round((revenue / maxRevenue) * 100) : 15;

                return (
                  <div
                    key={item.date}
                    className="flex h-full flex-1 flex-col items-center justify-end"
                  >
                    <p className="mb-2 text-xs font-extrabold text-green-700">
                      {item.revenue_text}
                    </p>

                    <div
                      style={{ height: `${Math.max(height, 15)}%` }}
                      className="w-8 rounded-t-xl bg-gradient-to-b from-green-400 to-green-700"
                    />

                    <span className="mt-3 text-xs font-semibold text-slate-500">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-[245px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
              <p className="text-base font-extrabold text-slate-700">
                Chưa có doanh thu trong 7 ngày gần nhất
              </p>

              <p className="mt-2 text-sm font-medium text-slate-500">
                Doanh thu sẽ hiển thị khi có đơn hàng hoàn thành.
              </p>
            </div>
          )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">
              Tồn kho theo lô thu hoạch
              <span className="ml-2 text-sm font-bold text-slate-400">
                Top 5
              </span>
            </h2>

            <button
              onClick={() => navigate("/seller/harvest-lots")}
              className="text-sm font-extrabold text-green-700"
            >
              Xem tất cả
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-slate-500">
                  <th className="px-3 py-3 font-extrabold">Mã lô</th>
                  <th className="px-3 py-3 font-extrabold">Sản phẩm</th>
                  <th className="px-3 py-3 font-extrabold">Ngày thu hoạch</th>
                  <th className="px-3 py-3 font-extrabold">Đã nhập</th>
                  <th className="px-3 py-3 font-extrabold">Còn lại</th>
                  <th className="px-3 py-3 font-extrabold">Trạng thái</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>

              <tbody>
                {harvestLots.map((lot) => (
                  <tr key={lot.id} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-extrabold text-slate-700">
                      {lot.lot_code}
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={lot.thumbnail || "/placeholder-product.png"}
                          alt={lot.product_name}
                          className="h-10 w-10 rounded-lg object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <div>
                          <p className="font-extrabold text-slate-800">
                            {lot.product_name}
                          </p>
                          <p className="text-xs font-semibold text-slate-400">
                            {lot.certificate_name}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3 font-semibold text-slate-600">
                      {lot.harvest_date}
                    </td>

                    <td className="px-3 py-3 font-semibold text-slate-600">
                      {lot.quantity_imported} kg
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={
                          Number(lot.quantity_remaining || 0) <= 20
                            ? "font-extrabold text-red-500"
                            : "font-extrabold text-green-700"
                        }
                      >
                        {lot.quantity_remaining} kg
                      </span>
                      {lot.percent_remaining !== undefined && (
                        <span className="ml-1 text-xs font-semibold text-slate-400">
                          ({lot.percent_remaining}%)
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <StatusBadge statusClass={lot.status_class}>
                        {lot.status_text}
                      </StatusBadge>
                    </td>

                    <td className="px-3 py-3 text-right">
                      <button className="rounded-lg p-1 hover:bg-slate-100">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))}

                {harvestLots.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-3 py-10 text-center font-bold text-slate-400"
                    >
                      Chưa có lô thu hoạch.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[0.58fr_0.42fr] gap-5">
        <div className="grid grid-cols-2 gap-5">
          <SmallListCard
            title="Sản phẩm sắp hết hàng"
            action="Xem tất cả"
            onAction={() => navigate("/seller/products")}
          >
            {lowStockProducts.length === 0 && (
              <EmptyText>Không có sản phẩm sắp hết hàng.</EmptyText>
            )}

            {lowStockProducts.map((item) => (
              <ProductMiniItem
                key={item.id}
                image={item.thumbnail}
                name={item.name}
                sub={`Tồn kho: ${item.stock_quantity} kg`}
                rightText={`Còn ${item.stock_quantity} kg`}
                danger={Number(item.stock_quantity || 0) <= 10}
              />
            ))}
          </SmallListCard>

          <SmallListCard
            title="Đơn hàng gần đây"
            action="Xem tất cả"
            onAction={() => navigate("/seller/orders")}
          >
            {recentOrders.length === 0 && (
              <EmptyText>Chưa có đơn hàng mới.</EmptyText>
            )}

            {recentOrders.slice(0, 4).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between border-b border-slate-100 py-3 last:border-b-0"
              >
                <div>
                  <p className="font-extrabold text-blue-600">{order.code}</p>
                  <p className="text-xs font-semibold text-slate-400">
                    {order.created_at}
                  </p>
                  <p className="text-sm font-extrabold text-slate-800">
                    {order.total_text}
                  </p>
                </div>

                <StatusBadge statusClass={order.status_class}>
                  {order.status_text}
                </StatusBadge>
              </div>
            ))}
          </SmallListCard>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Sản phẩm cần chú ý</h2>

            <button
              onClick={() => navigate("/seller/products")}
              className="text-sm font-extrabold text-green-700"
            >
              Xem tất cả
            </button>
          </div>

          <div className="space-y-3">
            {warningProducts.length === 0 && (
              <EmptyText>Không có sản phẩm cần chú ý.</EmptyText>
            )}

            {warningProducts.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[48px_1fr_110px] items-center gap-3 border-b border-slate-100 pb-3 last:border-b-0"
              >
                <img
                  src={item.thumbnail || "/placeholder-product.png"}
                  alt={item.name}
                  className="h-12 w-12 rounded-lg object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />

                <div>
                  <p className="font-extrabold text-slate-900">{item.name}</p>
                  <p className="text-xs font-semibold text-slate-500">
                    Chứng nhận
                  </p>
                  <p className="text-sm font-extrabold text-slate-800">
                    {item.certificate_name || "Chưa có"}
                  </p>
                </div>

                <StatusBadge statusClass={item.status_class}>
                  {item.status_text}
                </StatusBadge>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-5 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1">
              <i className="h-2 w-2 rounded-full bg-green-500"></i> Đã duyệt
            </span>
            <span className="flex items-center gap-1">
              <i className="h-2 w-2 rounded-full bg-orange-400"></i> Chờ duyệt
            </span>
            <span className="flex items-center gap-1">
              <i className="h-2 w-2 rounded-full bg-red-500"></i> Hết hạn
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, iconClass, title, value, sub, subClass = "text-green-700" }) {
  return (
    <div className="flex min-h-[104px] items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
        {icon}
      </div>

      <div>
        <p className="text-sm font-bold text-slate-500">{title}</p>
        <h2 className="mt-1 text-2xl font-extrabold text-slate-950">{value}</h2>
        <p className={`mt-1 text-xs font-extrabold ${subClass}`}>{sub}</p>
      </div>
    </div>
  );
}

function StatusBadge({ statusClass, children }) {
  const classMap = {
    active: "bg-green-50 text-green-700",
    pending: "bg-orange-50 text-orange-600",
    warning: "bg-orange-50 text-orange-600",
    danger: "bg-red-50 text-red-600",
    shipping: "bg-blue-50 text-blue-600",
    completed: "bg-green-50 text-green-700",
    cancelled: "bg-red-50 text-red-600",
  };

  return (
    <span
      className={`inline-flex min-w-[82px] justify-center rounded-lg px-2.5 py-1.5 text-xs font-extrabold ${
        classMap[statusClass] || classMap.active
      }`}
    >
      {children}
    </span>
  );
}

function SmallListCard({ title, action, onAction, children }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-extrabold">{title}</h2>
        <button onClick={onAction} className="text-xs font-extrabold text-green-700">
          {action}
        </button>
      </div>

      <div>{children}</div>
    </div>
  );
}

function ProductMiniItem({ image, name, sub, rightText, danger }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <img
          src={image || "/placeholder-product.png"}
          alt={name}
          className="h-11 w-11 rounded-lg object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />

        <div>
          <p className="font-extrabold text-slate-900">{name}</p>
          <p className="text-xs font-semibold text-slate-500">{sub}</p>
        </div>
      </div>

      <p className={`text-sm font-extrabold ${danger ? "text-red-500" : "text-green-700"}`}>
        {rightText}
      </p>
    </div>
  );
}

function EmptyText({ children }) {
  return <p className="py-6 text-center text-sm font-bold text-slate-400">{children}</p>;
}

function SkeletonBox({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <SkeletonBox className="h-8 w-[360px]" />
          <SkeletonBox className="mt-3 h-4 w-[280px]" />
        </div>

        <SkeletonBox className="h-10 w-[160px]" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex min-h-[104px] items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <SkeletonBox className="h-14 w-14 shrink-0 rounded-full" />

            <div className="flex-1">
              <SkeletonBox className="h-4 w-24" />
              <SkeletonBox className="mt-3 h-7 w-20" />
              <SkeletonBox className="mt-3 h-3 w-32" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart + table */}
      <div className="grid grid-cols-[0.85fr_1.25fr] gap-5">
        {/* Chart skeleton */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <SkeletonBox className="h-6 w-52" />
            <SkeletonBox className="h-9 w-28" />
          </div>

          <div className="flex h-[245px] items-end justify-between gap-3 border-b border-slate-200 px-3 pb-3">
            {[65, 40, 75, 55, 90, 45, 70].map((height, index) => (
              <div
                key={index}
                className="flex h-full flex-1 flex-col items-center justify-end"
              >
                <SkeletonBox className="mb-2 h-3 w-10" />

                <SkeletonBox
                  className="w-8 rounded-t-xl"
                  style={{ height: `${height}%` }}
                />

                <SkeletonBox className="mt-3 h-3 w-8" />
              </div>
            ))}
          </div>
        </div>

        {/* Harvest lots table skeleton */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <SkeletonBox className="h-6 w-60" />
            <SkeletonBox className="h-4 w-16" />
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-slate-500">
                  <th className="px-3 py-3">Mã lô</th>
                  <th className="px-3 py-3">Sản phẩm</th>
                  <th className="px-3 py-3">Ngày thu hoạch</th>
                  <th className="px-3 py-3">Đã nhập</th>
                  <th className="px-3 py-3">Còn lại</th>
                  <th className="px-3 py-3">Trạng thái</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>

              <tbody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-t border-slate-100">
                    <td className="px-3 py-4">
                      <SkeletonBox className="h-4 w-16" />
                    </td>

                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        <SkeletonBox className="h-10 w-10 rounded-lg" />
                        <div>
                          <SkeletonBox className="h-4 w-28" />
                          <SkeletonBox className="mt-2 h-3 w-20" />
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-4">
                      <SkeletonBox className="h-4 w-20" />
                    </td>

                    <td className="px-3 py-4">
                      <SkeletonBox className="h-4 w-14" />
                    </td>

                    <td className="px-3 py-4">
                      <SkeletonBox className="h-4 w-16" />
                    </td>

                    <td className="px-3 py-4">
                      <SkeletonBox className="h-6 w-20 rounded-lg" />
                    </td>

                    <td className="px-3 py-4">
                      <SkeletonBox className="ml-auto h-7 w-7 rounded-lg" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-[0.58fr_0.42fr] gap-5">
        <div className="grid grid-cols-2 gap-5">
          {Array.from({ length: 2 }).map((_, cardIndex) => (
            <div
              key={cardIndex}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <SkeletonBox className="h-6 w-40" />
                <SkeletonBox className="h-4 w-16" />
              </div>

              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-slate-100 py-3 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <SkeletonBox className="h-11 w-11 rounded-lg" />

                    <div>
                      <SkeletonBox className="h-4 w-28" />
                      <SkeletonBox className="mt-2 h-3 w-20" />
                    </div>
                  </div>

                  <SkeletonBox className="h-4 w-16" />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <SkeletonBox className="h-6 w-44" />
            <SkeletonBox className="h-4 w-16" />
          </div>

          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-[48px_1fr_110px] items-center gap-3 border-b border-slate-100 pb-3 last:border-b-0"
              >
                <SkeletonBox className="h-12 w-12 rounded-lg" />

                <div>
                  <SkeletonBox className="h-4 w-32" />
                  <SkeletonBox className="mt-2 h-3 w-20" />
                  <SkeletonBox className="mt-2 h-4 w-24" />
                </div>

                <SkeletonBox className="h-6 w-24 rounded-lg" />
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-5">
            <SkeletonBox className="h-3 w-16" />
            <SkeletonBox className="h-3 w-20" />
            <SkeletonBox className="h-3 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}
export default SellerDashboard;