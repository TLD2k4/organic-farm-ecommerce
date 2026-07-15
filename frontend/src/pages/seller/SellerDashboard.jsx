import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  ClipboardList,
  ShoppingCart,
  Banknote,
  Warehouse,
  MoreHorizontal,
  TrendingUp,
  CircleGauge,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
  const orderStatus = dashboard.order_status || {};
  const harvestLots = dashboard.harvest_lots || [];
  const lowStockProducts = dashboard.low_stock_products || [];
  const recentOrders = dashboard.recent_orders || [];
  const warningProducts = dashboard.warning_products || [];

  const hasRevenueChart = revenueChart.some(
    (item) => Number(item.revenue || 0) > 0,
  );

  return (
    <div className="w-full min-w-0 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-xl font-extrabold text-slate-950 sm:text-2xl">
            Xin chào, {dashboard.farm?.name || "Nông dân An Tâm"}! 👋
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Đây là tổng quan hoạt động nông trại của bạn hôm nay.
          </p>
        </div>

        <div className="w-fit shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
          Hôm nay: {dashboard.today || "19/06/2026"}
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 min-[460px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
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

      <SellerPerformanceCharts
        revenueData={revenueChart}
        orderStatus={orderStatus}
        hasRevenue={hasRevenueChart}
      />

      <div className="grid min-w-0 gap-5">

        <div className="min-w-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="break-words text-lg font-extrabold">
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

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-205 text-sm">
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
                        <div className="min-w-0">
                          <p className="max-w-44 break-words font-extrabold text-slate-800">
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

      <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,0.58fr)_minmax(0,0.42fr)]">
        <div className="grid min-w-0 gap-5 lg:grid-cols-2">
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
                className="flex min-w-0 flex-col gap-2 border-b border-slate-100 py-3 last:border-b-0 min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between"
              >
                <div className="min-w-0">
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

        <div className="min-w-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-2 min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between">
            <h2 className="break-words text-lg font-extrabold">
              Sản phẩm cần chú ý
            </h2>

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
                className="grid min-w-0 grid-cols-[48px_minmax(0,1fr)] items-center gap-3 border-b border-slate-100 pb-3 last:border-b-0 sm:grid-cols-[48px_minmax(0,1fr)_auto]"
              >
                <img
                  src={item.thumbnail || "/placeholder-product.png"}
                  alt={item.name}
                  className="h-12 w-12 rounded-lg object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />

                <div className="min-w-0">
                  <p className="break-words font-extrabold text-slate-900">
                    {item.name}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    Chứng nhận
                  </p>
                  <p className="text-sm font-extrabold text-slate-800">
                    {item.certificate_name || "Chưa có"}
                  </p>
                </div>

                <div className="col-span-2 sm:col-span-1 sm:justify-self-end">
                  <StatusBadge statusClass={item.status_class}>
                    {item.status_text}
                  </StatusBadge>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-slate-500">
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

const ORDER_COLORS = ["#f59e0b", "#3b82f6", "#8b5cf6", "#10b981", "#f43f5e"];

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur">
      <p className="text-xs font-bold text-slate-500">Ngày {label}</p>
      <p className="mt-1 font-black text-emerald-700">{Number(payload[0]?.value || 0).toLocaleString("vi-VN")} đ</p>
    </div>
  );
}

function SellerPerformanceCharts({ revenueData, orderStatus, hasRevenue }) {
  const orderData = [
    { name: "Chờ xác nhận", value: Number(orderStatus.pending || 0) },
    { name: "Đang chuẩn bị", value: Number(orderStatus.processing || 0) },
    { name: "Đang giao", value: Number(orderStatus.shipping || 0) },
    { name: "Hoàn thành", value: Number(orderStatus.completed || 0) },
    { name: "Đã hủy", value: Number(orderStatus.cancelled || 0) },
  ];
  const totalOrders = orderData.reduce((sum, item) => sum + item.value, 0);
  const totalRevenue = revenueData.reduce((sum, item) => sum + Number(item.revenue || 0), 0);

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)]">
      <section className="relative min-w-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"><TrendingUp size={20} /></span><div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-600">Dòng tiền 7 ngày</p><h2 className="mt-0.5 text-lg font-black text-slate-950">Xu hướng doanh thu</h2><p className="mt-1 text-xs font-semibold text-slate-500">Doanh thu từ các đơn con đã hoàn thành</p></div></div>
          <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-right"><p className="text-[10px] font-black uppercase tracking-wide text-emerald-600">Tổng 7 ngày</p><p className="mt-0.5 text-lg font-black text-emerald-800">{totalRevenue.toLocaleString("vi-VN")} đ</p></div>
        </div>
        {hasRevenue ? (
          <div className="relative mt-6 h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}><defs><linearGradient id="sellerRevenueArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.42} /><stop offset="100%" stopColor="#10b981" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 700 }} /><YAxis axisLine={false} tickLine={false} width={55} tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}tr` : value >= 1000 ? `${Math.round(value / 1000)}k` : value} /><Tooltip content={<RevenueTooltip />} cursor={{ stroke: "#94a3b8", strokeDasharray: "4 4" }} /><Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={3} fill="url(#sellerRevenueArea)" activeDot={{ r: 5, fill: "#059669", stroke: "white", strokeWidth: 3 }} /></AreaChart></ResponsiveContainer></div>
        ) : (
          <div className="mt-6 grid h-72 place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center"><div><TrendingUp className="mx-auto text-slate-300" size={38} /><p className="mt-3 font-black text-slate-700">Chưa có doanh thu trong 7 ngày</p><p className="mt-1 text-sm font-semibold text-slate-500">Biểu đồ sẽ cập nhật khi đơn hàng hoàn thành.</p></div></div>
        )}
      </section>

      <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-4 text-white shadow-xl sm:p-6">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10"><CircleGauge size={20} /></span><div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-indigo-300">Vận hành</p><h2 className="mt-0.5 text-lg font-black">Trạng thái đơn hàng</h2><p className="mt-1 text-xs font-semibold text-slate-400">Tổng đơn con của gian hàng</p></div></div>
        <div className="relative mx-auto mt-3 h-56 max-w-sm"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={totalOrders ? orderData : [{ name: "Chưa có đơn", value: 1 }]} dataKey="value" nameKey="name" innerRadius={64} outerRadius={91} paddingAngle={totalOrders ? 3 : 0} stroke="none">{(totalOrders ? orderData : [{ value: 1 }]).map((item, index) => <Cell key={index} fill={totalOrders ? ORDER_COLORS[index] : "#334155"} />)}</Pie><Tooltip formatter={(value, name) => [totalOrders ? `${value} đơn` : "0 đơn", name]} contentStyle={{ borderRadius: 14, border: "none", color: "#0f172a", fontWeight: 700 }} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><p className="text-3xl font-black">{totalOrders}</p><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đơn hàng</p></div></div></div>
        <div className="relative grid grid-cols-2 gap-2">{orderData.map((item, index) => <div key={item.name} className="flex items-center justify-between gap-2 rounded-xl bg-white/6 px-3 py-2"><span className="flex min-w-0 items-center gap-2 text-[11px] font-bold text-slate-300"><i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: ORDER_COLORS[index] }} /><span className="truncate">{item.name}</span></span><strong className="text-sm">{item.value}</strong></div>)}</div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  iconClass,
  title,
  value,
  sub,
  subClass = "text-green-700",
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:min-h-26 sm:gap-4 sm:p-5">
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${iconClass}`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-500">{title}</p>
        <h2 className="mt-1 break-words text-xl font-extrabold text-slate-950 sm:text-2xl">
          {value}
        </h2>
        <p className={`mt-1 break-words text-xs font-extrabold ${subClass}`}>
          {sub}
        </p>
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
      className={`inline-flex min-w-20.5 justify-center rounded-lg px-2.5 py-1.5 text-xs font-extrabold ${
        classMap[statusClass] || classMap.active
      }`}
    >
      {children}
    </span>
  );
}

function SmallListCard({ title, action, onAction, children }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-col gap-2 min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between">
        <h2 className="break-words text-lg font-extrabold">{title}</h2>
        <button
          onClick={onAction}
          className="text-xs font-extrabold text-green-700"
        >
          {action}
        </button>
      </div>

      <div>{children}</div>
    </div>
  );
}

function ProductMiniItem({ image, name, sub, rightText, danger }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 border-b border-slate-100 py-3 last:border-b-0 min-[430px]:flex-row min-[430px]:items-center min-[430px]:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={image || "/placeholder-product.png"}
          alt={name}
          className="h-11 w-11 rounded-lg object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />

        <div className="min-w-0">
          <p className="break-words font-extrabold text-slate-900">{name}</p>
          <p className="break-words text-xs font-semibold text-slate-500">
            {sub}
          </p>
        </div>
      </div>

      <p
        className={`text-sm font-extrabold min-[430px]:text-right ${danger ? "text-red-500" : "text-green-700"}`}
      >
        {rightText}
      </p>
    </div>
  );
}

function EmptyText({ children }) {
  return (
    <p className="py-6 text-center text-sm font-bold text-slate-400">
      {children}
    </p>
  );
}

function SkeletonBox({ className = "", style }) {
  return (
    <div
      style={style}
      className={`animate-pulse rounded-xl bg-slate-100 ${className}`}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="w-full min-w-0 space-y-5 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <SkeletonBox className="h-8 w-full max-w-90" />
          <SkeletonBox className="mt-3 h-4 w-full max-w-70" />
        </div>

        <SkeletonBox className="h-10 w-40" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 min-[460px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex min-h-26 items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
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
      <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.25fr)]">
        {/* Chart skeleton */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <SkeletonBox className="h-6 w-52" />
            <SkeletonBox className="h-9 w-28" />
          </div>

          <div className="flex h-61.25 items-end justify-between gap-3 border-b border-slate-200 px-3 pb-3">
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

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-205 text-sm">
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
      <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,0.58fr)_minmax(0,0.42fr)]">
        <div className="grid min-w-0 gap-5 lg:grid-cols-2">
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
                className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-3 border-b border-slate-100 pb-3 last:border-b-0 sm:grid-cols-[48px_minmax(0,1fr)_auto]"
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
