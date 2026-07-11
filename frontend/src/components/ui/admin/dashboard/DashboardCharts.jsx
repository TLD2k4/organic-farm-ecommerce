import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

const RevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <p className="mb-2 font-semibold text-slate-800">{label}</p>

      {payload.map((item) => (
        <p key={item.dataKey} className="text-sm text-slate-600">
          {item.name}:{" "}
          <span className="font-semibold">
            {item.dataKey === "revenue"
              ? `${formatCurrency(item.value)} đ`
              : item.value}
          </span>
        </p>
      ))}
    </div>
  );
};

export default function DashboardCharts({ data = [], loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white py-14 text-center text-slate-500">
        Chưa có dữ liệu biểu đồ.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {/* DOANH THU */}
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">Doanh thu</h2>

          <p className="mt-1 text-sm text-slate-500">
            Doanh thu từ các đơn đã thanh toán
          </p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 10,
                right: 15,
                left: 5,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />

              <XAxis dataKey="label" tick={{ fontSize: 12 }} minTickGap={20} />

              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
                width={70}
              />

              <Tooltip content={<RevenueTooltip />} />

              <Legend />

              <Line
                type="monotone"
                dataKey="revenue"
                name="Doanh thu"
                stroke="#16a34a"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ĐƠN HÀNG */}
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">Đơn hàng</h2>

          <p className="mt-1 text-sm text-slate-500">Số đơn theo từng ngày</p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 10,
                right: 15,
                left: 0,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />

              <XAxis dataKey="label" tick={{ fontSize: 12 }} minTickGap={20} />

              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />

              <Tooltip />

              <Legend />

              <Bar
                dataKey="orders"
                name="Tổng đơn"
                fill="#3b82f6"
                radius={[5, 5, 0, 0]}
              />

              <Bar
                dataKey="completed_orders"
                name="Đã hoàn thành"
                fill="#16a34a"
                radius={[5, 5, 0, 0]}
              />

              <Bar
                dataKey="cancelled_orders"
                name="Đã hủy"
                fill="#ef4444"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
