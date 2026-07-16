import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight, CircleDollarSign, ShoppingBag } from "lucide-react";

const money = (value) => `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))} đ`;

const compact = (value) => {
  const number = Number(value || 0);
  if (number >= 1_000_000_000) return `${(number / 1_000_000_000).toFixed(1)} tỷ`;
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(1)}tr`;
  if (number >= 1_000) return `${Math.round(number / 1_000)}k`;
  return String(number);
};

function ChartTooltip({ active, payload, label, currency = false }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-48 rounded-2xl border border-white/70 bg-white/95 p-3.5 shadow-2xl shadow-slate-900/15 backdrop-blur-xl">
      <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
      <div className="space-y-1.5">
        {payload.filter((item) => item.value !== undefined).map((item) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-5 text-sm">
            <span className="inline-flex items-center gap-2 font-semibold text-slate-600">
              <i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-black text-slate-900">{currency ? money(item.value) : Number(item.value || 0).toLocaleString("vi-VN")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LegendPill({ color, label }) {
  return <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600"><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />{label}</span>;
}

function prepareChartData(data) {
  const normalized = data.map((item) => ({
    ...item,
    revenue: Number(item.revenue || 0),
    orders: Number(item.orders || 0),
    completed_orders: Number(item.completed_orders || 0),
    cancelled_orders: Number(item.cancelled_orders || 0),
    sub_orders: Number(item.sub_orders || 0),
    processing_sub_orders: Number(item.processing_sub_orders || 0),
    completed_sub_orders: Number(item.completed_sub_orders || 0),
    cancelled_sub_orders: Number(item.cancelled_sub_orders || 0),
  }));

  const groups = normalized.length > 45
    ? Array.from(
        { length: Math.ceil(normalized.length / 7) },
        (_, index) => normalized.slice(index * 7, index * 7 + 7),
      )
    : normalized.map((item) => [item]);

  return groups.filter(Boolean).map((group) => {
    const first = group[0];
    const last = group[group.length - 1];
    const totals = group.reduce(
      (sum, item) => ({
        revenue: sum.revenue + item.revenue,
        orders: sum.orders + item.orders,
        completed_orders: sum.completed_orders + item.completed_orders,
        cancelled_orders: sum.cancelled_orders + item.cancelled_orders,
        sub_orders: sum.sub_orders + item.sub_orders,
        processing_sub_orders:
          sum.processing_sub_orders + item.processing_sub_orders,
        completed_sub_orders:
          sum.completed_sub_orders + item.completed_sub_orders,
        cancelled_sub_orders:
          sum.cancelled_sub_orders + item.cancelled_sub_orders,
      }),
      {
        revenue: 0,
        orders: 0,
        completed_orders: 0,
        cancelled_orders: 0,
        sub_orders: 0,
        processing_sub_orders: 0,
        completed_sub_orders: 0,
        cancelled_sub_orders: 0,
      },
    );

    return {
      ...totals,
      label: first.label === last.label
        ? first.label
        : `${first.label}–${last.label}`,
    };
  });
}

export default function DashboardCharts({ data = [], loading = false }) {
  if (loading) {
    return <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">{[0, 1].map((item) => <div key={item} className="h-105 animate-pulse rounded-3xl bg-slate-200/80" />)}</div>;
  }

  if (!data.length) {
    return <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-4 py-16 text-center font-semibold text-slate-500">Chưa có dữ liệu biểu đồ trong khoảng thời gian này.</div>;
  }

  const chartData = prepareChartData(data);
  const groupedByWeek = data.length > 45;
  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = chartData.reduce((sum, item) => sum + item.orders, 0);
  const completedOrders = chartData.reduce((sum, item) => sum + item.completed_orders, 0);
  const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
  const totalSubOrders = chartData.reduce((sum, item) => sum + item.sub_orders, 0);
  const completedSubOrders = chartData.reduce(
    (sum, item) => sum + item.completed_sub_orders,
    0,
  );
  const subOrderCompletionRate = totalSubOrders > 0
    ? Math.round((completedSubOrders / totalSubOrders) * 100)
    : 0;

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="relative min-w-0 overflow-hidden rounded-3xl border border-emerald-100 bg-white p-4 shadow-[0_18px_50px_-28px_rgba(16,185,129,0.45)] sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-100/70 blur-3xl" />
        <header className="relative mb-5 flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Hiệu suất bán hàng</p><h2 className="mt-2 text-xl font-black text-slate-950">Xu hướng doanh thu</h2><p className="mt-1 text-sm font-medium text-slate-500">Doanh thu ghi nhận từ đơn hoàn thành</p></div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-right"><p className="text-xs font-bold text-emerald-700">Tổng kỳ này</p><p className="mt-1 text-xl font-black text-emerald-800">{money(totalRevenue)}</p></div>
        </header>
        <div className="relative h-75 w-full sm:h-82">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 12, right: 8, left: -10, bottom: 0 }}>
              <defs><linearGradient id="adminRevenueGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.38} /><stop offset="65%" stopColor="#34d399" stopOpacity={0.09} /><stop offset="100%" stopColor="#ffffff" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 7" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={24} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }} dy={8} />
              <YAxis axisLine={false} tickLine={false} width={58} tickFormatter={compact} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }} />
              <Tooltip content={<ChartTooltip currency />} cursor={{ stroke: "#10b981", strokeWidth: 1, strokeDasharray: "4 4" }} />
              <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#059669" strokeWidth={3.5} fill="url(#adminRevenueGradient)" activeDot={{ r: 6, fill: "#059669", stroke: "#fff", strokeWidth: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3"><Metric icon={CircleDollarSign} label="Trung bình/ngày" value={money(totalRevenue / Math.max(data.length, 1))} /><Metric icon={ShoppingBag} label="Tổng đơn" value={totalOrders.toLocaleString("vi-VN")} /><Metric icon={ArrowUpRight} label="Hoàn thành" value={`${completionRate}%`} className="col-span-2 sm:col-span-1" /></div>
      </section>

      <section className="min-w-0 overflow-hidden rounded-3xl border border-indigo-100 bg-white p-4 shadow-[0_18px_50px_-28px_rgba(79,70,229,0.4)] sm:p-6">
        <header className="mb-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Vận hành đơn hàng</p><h2 className="mt-2 text-xl font-black text-slate-950">Trạng thái đơn theo gian hàng</h2><p className="mt-1 text-xs font-semibold text-slate-500">{groupedByWeek ? "90 ngày được tự động gộp theo từng nhóm 7 ngày." : "Tính theo đơn con để phản ánh đúng từng gian hàng."}</p></div><div className="rounded-2xl bg-indigo-50 px-3 py-2 text-right"><p className="text-[10px] font-black uppercase tracking-wide text-indigo-500">Hoàn thành</p><p className="text-lg font-black text-indigo-800">{subOrderCompletionRate}%</p></div></div><div className="mt-3 flex flex-wrap gap-2"><LegendPill color="#6366f1" label="Đang xử lý" /><LegendPill color="#10b981" label="Hoàn thành" /><LegendPill color="#fb7185" label="Đã hủy" /></div></header>
        <div className="h-85 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 14, right: 6, left: -22, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 7" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={24} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }} dy={8} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 700 }} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f1f5f9", opacity: 0.7 }} />
              <Bar stackId="order-status" dataKey="processing_sub_orders" name="Đang xử lý" fill="#6366f1" maxBarSize={32} />
              <Bar stackId="order-status" dataKey="completed_sub_orders" name="Hoàn thành" fill="#10b981" maxBarSize={32} />
              <Bar stackId="order-status" dataKey="cancelled_sub_orders" name="Đã hủy" fill="#fb7185" radius={[7, 7, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, className = "" }) {
  return <div className={`flex min-w-0 items-center gap-3 rounded-2xl bg-slate-50 p-3 ${className}`}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm"><Icon size={17} /></span><div className="min-w-0"><p className="truncate text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-0.5 truncate text-sm font-black text-slate-800">{value}</p></div></div>;
}
