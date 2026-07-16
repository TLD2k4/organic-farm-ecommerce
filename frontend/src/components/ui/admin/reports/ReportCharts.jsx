import { useState } from "react";
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
import { ChartNoAxesCombined, CircleDollarSign, PackageCheck, Users } from "lucide-react";

const money = (value) => new Intl.NumberFormat("vi-VN").format(Number(value || 0));
const compact = (value) => {
  const number = Number(value || 0);
  if (number >= 1_000_000_000) return `${(number / 1_000_000_000).toFixed(1)} tỷ`;
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(1)} tr`;
  if (number >= 1_000) return `${Math.round(number / 1_000)}k`;
  return String(number);
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-48 rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-2xl backdrop-blur">
      <p className="mb-2 text-sm font-black text-slate-900">{label}</p>
      {payload.map((item) => (
        <div key={item.dataKey} className="flex items-center justify-between gap-5 py-1 text-xs font-semibold">
          <span className="flex items-center gap-2 text-slate-500"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
          <span className="font-black text-slate-800">{item.dataKey === "revenue" ? `${money(item.value)} đ` : money(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

function LegendItem({ color, label, invert = false }) {
  return <span className={`inline-flex items-center gap-2 text-xs font-bold ${invert ? "text-slate-300" : "text-slate-500"}`}><i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />{label}</span>;
}

function ChartCard({ icon: Icon, eyebrow, title, description, legends, children, accent }) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6">
      <div className={`pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full blur-3xl ${accent}`} />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg"><Icon size={20} /></span><div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p><h2 className="mt-0.5 text-lg font-black text-slate-950">{title}</h2><p className="mt-1 text-xs font-semibold text-slate-500">{description}</p></div></div>
        <div className="flex flex-wrap gap-3">{legends}</div>
      </div>
      <div className="relative mt-6 h-80 w-full">{children}</div>
    </section>
  );
}

function ViewButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-xs font-black transition ${
        active
          ? "bg-slate-950 text-white shadow-sm"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

export default function ReportCharts({ data = [], loading = false }) {
  const [orderView, setOrderView] = useState("volume");

  if (loading) return <div className="grid gap-5 xl:grid-cols-2"><div className="h-112 animate-pulse rounded-3xl bg-slate-200" /><div className="h-112 animate-pulse rounded-3xl bg-slate-200" /></div>;
  if (!data.length) return <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-16 text-center"><ChartNoAxesCombined className="mx-auto text-slate-300" size={44} /><p className="mt-3 font-bold text-slate-500">Chưa có dữ liệu trong khoảng thời gian này.</p></div>;

  const chartData = data.map((item) => ({
    ...item,
    revenue: Number(item.revenue || 0),
    orders: Number(item.orders || 0),
    sub_orders: Number(item.sub_orders || 0),
    completed_orders: Number(item.completed_orders || 0),
    cancelled_orders: Number(item.cancelled_orders || 0),
    processing_sub_orders: Number(item.processing_sub_orders || 0),
    completed_sub_orders: Number(item.completed_sub_orders || 0),
    cancelled_sub_orders: Number(item.cancelled_sub_orders || 0),
  }));

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-2">
      <ChartCard icon={CircleDollarSign} eyebrow="Dòng tiền" title="Xu hướng doanh thu" description="Một đơn vị duy nhất: doanh thu đã thanh toán thành công" accent="bg-emerald-200/50" legends={<LegendItem color="#10b981" label="Doanh thu" />}>
        <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}><defs><linearGradient id="reportRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.38} /><stop offset="100%" stopColor="#10b981" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 700 }} minTickGap={20} /><YAxis axisLine={false} tickLine={false} width={58} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={compact} /><Tooltip content={<ChartTooltip />} cursor={{ stroke: "#94a3b8", strokeDasharray: "4 4" }} /><Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#10b981" strokeWidth={3} fill="url(#reportRevenue)" activeDot={{ r: 5, strokeWidth: 3, stroke: "white" }} /></AreaChart></ResponsiveContainer>
      </ChartCard>

      <ChartCard icon={PackageCheck} eyebrow="Vận hành" title="Đơn hàng theo thời gian" description={orderView === "volume" ? "So sánh lượt checkout và khối lượng đơn giao cho gian hàng" : "Cơ cấu trạng thái đơn con của từng gian hàng trong kỳ"} accent="bg-sky-200/50" legends={<div className="space-y-2"><div className="flex flex-wrap justify-end gap-2"><ViewButton active={orderView === "volume"} onClick={() => setOrderView("volume")}>Khối lượng</ViewButton><ViewButton active={orderView === "status"} onClick={() => setOrderView("status")}>Trạng thái</ViewButton></div><div className="flex flex-wrap justify-end gap-3">{orderView === "volume" ? <><LegendItem color="#2563eb" label="Đơn tổng" /><LegendItem color="#8b5cf6" label="Đơn theo gian hàng" /></> : <><LegendItem color="#f59e0b" label="Đang xử lý" /><LegendItem color="#10b981" label="Hoàn thành" /><LegendItem color="#f43f5e" label="Đã hủy" /></>}</div></div>}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={4}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 6" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 700 }} minTickGap={20} />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f1f5f9", opacity: 0.7 }} />
            {orderView === "volume" ? (
              <>
                <Bar dataKey="orders" name="Đơn tổng" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={24} />
                <Bar dataKey="sub_orders" name="Đơn theo gian hàng" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={24} />
              </>
            ) : (
              <>
                <Bar stackId="status" dataKey="processing_sub_orders" name="Đang xử lý" fill="#f59e0b" maxBarSize={34} />
                <Bar stackId="status" dataKey="completed_sub_orders" name="Hoàn thành" fill="#10b981" maxBarSize={34} />
                <Bar stackId="status" dataKey="cancelled_sub_orders" name="Đã hủy" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={34} />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <section className="xl:col-span-2 overflow-hidden rounded-3xl bg-slate-950 p-5 text-white shadow-xl sm:p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10"><Users size={20} /></span><div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-indigo-300">Tăng trưởng</p><h2 className="text-lg font-black">Người dùng mới theo từng kỳ</h2></div></div><LegendItem color="#a78bfa" label="Tài khoản mới" invert /></div><div className="mt-5 h-52"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="reportUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa" stopOpacity={0.5} /><stop offset="100%" stopColor="#a78bfa" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#334155" strokeDasharray="4 6" vertical={false} /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} minTickGap={20} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} /><Tooltip content={<ChartTooltip />} /><Area type="monotone" dataKey="new_users" name="Người dùng mới" stroke="#a78bfa" strokeWidth={3} fill="url(#reportUsers)" /></AreaChart></ResponsiveContainer></div></section>
    </div>
  );
}
