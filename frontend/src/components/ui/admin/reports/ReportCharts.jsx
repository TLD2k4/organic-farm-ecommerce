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

const formatCompactCurrency = (value) => {
  const numberValue = Number(value || 0);

  if (numberValue >= 1_000_000_000) {
    return `${(numberValue / 1_000_000_000).toFixed(1)} tỷ`;
  }

  if (numberValue >= 1_000_000) {
    return `${(numberValue / 1_000_000).toFixed(1)} tr`;
  }

  if (numberValue >= 1_000) {
    return `${(numberValue / 1_000).toFixed(0)}k`;
  }

  return String(numberValue);
};

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const value = payload[0]?.value || 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
      <p className="font-semibold text-slate-900">{label}</p>

      <p className="mt-1 text-sm text-slate-600">
        Doanh thu:{" "}
        <span className="font-bold text-green-700">
          {formatCurrency(value)} đ
        </span>
      </p>
    </div>
  );
}

function OrderTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
      <p className="mb-2 font-semibold text-slate-900">{label}</p>

      <div className="space-y-1">
        {payload.map((item) => (
          <p key={item.dataKey} className="text-sm text-slate-600">
            {item.name}: <span className="font-semibold">{item.value}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

export default function ReportCharts({ data = [], loading = false }) {
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
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-14 text-center text-slate-500">
        Chưa có dữ liệu biểu đồ trong khoảng thời gian này.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {/* REVENUE */}
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            Biểu đồ doanh thu
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Doanh thu từ các giao dịch đã thanh toán
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

              <XAxis
                dataKey="label"
                tick={{
                  fontSize: 11,
                }}
                minTickGap={18}
              />

              <YAxis
                width={65}
                tick={{
                  fontSize: 11,
                }}
                tickFormatter={formatCompactCurrency}
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
                activeDot={{
                  r: 5,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ORDERS */}
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">
            Đơn hàng và người dùng
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Số đơn hàng và tài khoản mới theo từng kỳ
          </p>
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

              <XAxis
                dataKey="label"
                tick={{
                  fontSize: 11,
                }}
                minTickGap={18}
              />

              <YAxis
                allowDecimals={false}
                tick={{
                  fontSize: 11,
                }}
              />

              <Tooltip content={<OrderTooltip />} />

              <Legend />

              <Bar
                dataKey="orders"
                name="Tổng đơn"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />

              <Bar
                dataKey="completed_orders"
                name="Hoàn thành"
                fill="#16a34a"
                radius={[4, 4, 0, 0]}
              />

              <Bar
                dataKey="cancelled_orders"
                name="Đã hủy"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />

              <Bar
                dataKey="new_users"
                name="Người dùng mới"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
