import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  DollarSign,
  Loader2,
  Package,
  Search,
  ShoppingBag,
  Star,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import sellerRevenueService from "../../services/sellerRevenueService";

const DEFAULT_DATA = {
  farm: null,
  filters: {
    period: "30d",
    from: "",
    to: "",
  },
  summary: {
    total_revenue: 0,
    completed_orders: 0,
    sold_quantity: 0,
    avg_order_value: 0,
    comparison: {
      revenue_percent: 0,
      orders_percent: 0,
      sold_percent: 0,
      avg_order_percent: 0,
    },
  },
  revenue_chart: [],
  top_products: [],
};

const API_BASE_URL = "http://localhost:8000";

function formatCurrency(value = 0) {
  return (
    new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 0,
    }).format(Number(value || 0)) + " ₫"
  );
}

function formatNumber(value = 0) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

function formatCompactCurrency(value = 0) {
  const number = Number(value || 0);

  if (number >= 1_000_000_000) {
    return `${(number / 1_000_000_000).toFixed(1)} tỷ`;
  }

  if (number >= 1_000_000) {
    return `${(number / 1_000_000).toFixed(1)}tr`;
  }

  if (number >= 1_000) {
    return `${Math.round(number / 1_000)}k`;
  }

  return `${number}`;
}

function getImageUrl(path) {
  if (!path) return "";

  if (path.startsWith("http")) return path;

  if (path.startsWith("/storage")) {
    return `${API_BASE_URL}${path}`;
  }

  return `${API_BASE_URL}/storage/${path}`;
}

function getReportData(payload) {
  return payload?.data || payload || DEFAULT_DATA;
}

function getErrorMessage(error, fallback) {
  return (
    error?.message ||
    error?.errors?.farm?.[0] ||
    error?.errors?.period?.[0] ||
    fallback
  );
}

export default function SellerRevenue() {
  const [report, setReport] = useState(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [filters, setFilters] = useState({
    period: "30d",
    from: "",
    to: "",
  });

  const summary = report.summary || DEFAULT_DATA.summary;
  const comparison = summary.comparison || DEFAULT_DATA.summary.comparison;
  const rawChart = report.revenue_chart || [];
  const topProducts = report.top_products || [];

  const chartData = useMemo(() => {
    return rawChart.map((item) => ({
      label: item.label || item.date || item.raw_date || "",
      raw_date: item.raw_date || item.date || "",
      revenue: Number(item.revenue || item.total_revenue || 0),
      order_count: Number(
        item.order_count || item.orders || item.total_orders || 0
      ),
      sold_quantity: Number(
        item.sold_quantity ||
          item.sold ||
          item.total_quantity ||
          item.quantity ||
          0
      ),
    }));
  }, [rawChart]);

  const totalChartRevenue = useMemo(() => {
    return chartData.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
  }, [chartData]);

  const totalChartOrders = useMemo(() => {
    return chartData.reduce(
      (sum, item) => sum + Number(item.order_count || 0),
      0
    );
  }, [chartData]);

  const hasSoldLine = useMemo(() => {
    return chartData.some((item) => Number(item.sold_quantity || 0) > 0);
  }, [chartData]);

  const loadReport = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setSubmitting(true);
      } else {
        setLoading(true);
      }

      const payload = await sellerRevenueService.getReport({
        period: filters.period,
        from: filters.from,
        to: filters.to,
        limit: 10,
      });

      setReport(getReportData(payload));
    } catch (error) {
      console.log("LOAD SELLER REVENUE ERROR:", error);
      toast.error(getErrorMessage(error, "Không thể tải thống kê doanh thu"));
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const updateFilter = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmitFilter = (e) => {
    e.preventDefault();
    loadReport({ silent: true });
  };

  if (loading) {
    return <SellerRevenueSkeleton />;
  }

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-green-800 via-green-700 to-emerald-500 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wide">
              Seller Analytics
            </p>

            <h1 className="mt-4 text-3xl font-extrabold">
              Thống kê doanh thu
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-medium text-green-50">
              Theo dõi doanh thu, đơn hoàn thành và sản phẩm bán chạy của gian
              hàng mình.
            </p>
          </div>

          <div className="rounded-2xl bg-white/15 px-5 py-3 text-sm font-extrabold backdrop-blur">
            {report?.farm?.name || "Gian hàng của tôi"}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <HeroMetric
            label="Doanh thu kỳ này"
            value={formatCurrency(summary.total_revenue)}
            percent={comparison.revenue_percent}
          />

          <HeroMetric
            label="Đơn hoàn thành"
            value={formatNumber(summary.completed_orders)}
            percent={comparison.orders_percent}
          />

          <HeroMetric
            label="Sản phẩm đã bán"
            value={formatNumber(summary.sold_quantity)}
            percent={comparison.sold_percent}
          />

          <HeroMetric
            label="Giá trị TB / đơn"
            value={formatCurrency(summary.avg_order_value)}
            percent={comparison.avg_order_percent}
          />
        </div>
      </div>

      <form
        onSubmit={handleSubmitFilter}
        className="rounded-3xl bg-white p-5 shadow-sm"
      >
        <div
          className={`grid min-w-0 gap-3 ${
            filters.period === "custom"
              ? "lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)_auto]"
              : "lg:grid-cols-[220px_auto]"
          }`}
        >
          <div className="relative">
            <CalendarDays
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              value={filters.period}
              onChange={(e) => updateFilter("period", e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-4 text-sm font-bold outline-none focus:border-green-600"
            >
              <option value="today">Hôm nay</option>
              <option value="7d">7 ngày gần đây</option>
              <option value="30d">30 ngày gần đây</option>
              <option value="month">Tháng này</option>
              <option value="year">Năm nay</option>
              <option value="custom">Tùy chọn</option>
            </select>
          </div>

          {filters.period === "custom" && (
            <>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => updateFilter("from", e.target.value)}
                className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-green-600"
              />

              <input
                type="date"
                value={filters.to}
                onChange={(e) => updateFilter("to", e.target.value)}
                className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-green-600"
              />
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-green-700 px-5 text-sm font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Search size={18} />
            )}
            Xem báo cáo
          </button>
        </div>
      </form>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Tổng doanh thu"
          value={formatCurrency(summary.total_revenue)}
          subText="Doanh thu sản phẩm, không gồm phí vận chuyển"
        />

        <StatCard
          icon={ShoppingBag}
          label="Đơn hoàn thành"
          value={formatNumber(summary.completed_orders)}
          subText="Tính theo đơn gian hàng đã hoàn tất"
        />

        <StatCard
          icon={Package}
          label="Sản phẩm đã bán"
          value={formatNumber(summary.sold_quantity)}
          subText="Tổng số lượng sản phẩm bán ra"
        />

        <StatCard
          icon={TrendingUp}
          label="Giá trị TB / đơn"
          value={formatCurrency(summary.avg_order_value)}
          subText="Tổng doanh thu / đơn hoàn thành"
        />
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <div className="min-w-0 overflow-hidden rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-950">
                Biểu đồ doanh thu
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Doanh thu, số đơn và số lượng bán theo thời gian.
              </p>
            </div>

            <div className="rounded-2xl bg-green-50 px-4 py-3 text-right">
              <p className="text-xs font-extrabold uppercase tracking-wide text-green-700">
                Tổng trong kỳ
              </p>

              <p className="text-lg font-extrabold text-green-700">
                {formatCurrency(totalChartRevenue)}
              </p>

              <p className="mt-1 text-xs font-bold text-slate-500">
                {formatNumber(totalChartOrders)} đơn hoàn thành
              </p>
            </div>
          </div>

          {chartData.length === 0 || totalChartRevenue <= 0 ? (
            <EmptyBox
              icon={BarChart3}
              title="Chưa có doanh thu"
              text="Chưa có đơn hàng hoàn thành trong khoảng thời gian này."
            />
          ) : (
            <RevenueComposedChart
              chartData={chartData}
              hasSoldLine={hasSoldLine}
            />
          )}
        </div>

        <div className="min-w-0 overflow-hidden rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-950">
                Sản phẩm bán chạy
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Xếp hạng theo doanh thu và số lượng bán.
              </p>
            </div>

            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-500">
              <Star size={23} />
            </div>
          </div>

          {topProducts.length === 0 ? (
            <EmptyBox
              icon={Package}
              title="Chưa có sản phẩm bán chạy"
              text="Sản phẩm sẽ hiển thị khi có đơn hàng hoàn thành."
            />
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <TopProductItem
                  key={product.id}
                  product={product}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HeroMetric({ label, value, percent }) {
  const percentNumber = Number(percent || 0);
  const positive = percentNumber >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
      <p className="text-sm font-bold text-green-50">{label}</p>

      <p className="mt-2 text-2xl font-extrabold text-white">{value}</p>

      <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold">
        <Icon size={14} />
        {positive ? "+" : ""}
        {percentNumber}% so với kỳ trước
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subText }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-green-50 text-green-700">
        <Icon size={23} />
      </div>

      <p className="mt-4 text-sm font-bold text-slate-500">{label}</p>

      <p className="mt-2 text-2xl font-extrabold text-slate-950">{value}</p>

      <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">
        {subText}
      </p>
    </div>
  );
}

function RevenueComposedChart({ chartData, hasSoldLine }) {
  const xInterval = chartData.length > 16 ? Math.ceil(chartData.length / 10) : 0;

  return (
    <div className="h-[430px] w-full rounded-3xl bg-gradient-to-b from-green-50/80 to-white p-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{
            top: 20,
            right: 20,
            left: 10,
            bottom: 10,
          }}
        >
          <defs>
            <linearGradient id="revenueBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#86efac" stopOpacity={0.85} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="5 5"
            stroke="#d8eadc"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            interval={xInterval}
            tick={{
              fill: "#64748b",
              fontSize: 12,
              fontWeight: 800,
            }}
            axisLine={false}
            tickLine={false}
            minTickGap={10}
          />

          <YAxis
            yAxisId="money"
            tickFormatter={formatCompactCurrency}
            tick={{
              fill: "#64748b",
              fontSize: 12,
              fontWeight: 800,
            }}
            axisLine={false}
            tickLine={false}
            width={64}
          />

          <YAxis
            yAxisId="count"
            orientation="right"
            allowDecimals={false}
            tick={{
              fill: "#94a3b8",
              fontSize: 12,
              fontWeight: 800,
            }}
            axisLine={false}
            tickLine={false}
            width={42}
          />

          <Tooltip content={<RevenueTooltip hasSoldLine={hasSoldLine} />} />

          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{
              paddingBottom: 16,
              fontWeight: 800,
              fontSize: 13,
            }}
          />

          <Bar
            yAxisId="money"
            dataKey="revenue"
            name="Doanh thu"
            fill="url(#revenueBar)"
            radius={[12, 12, 0, 0]}
            maxBarSize={36}
          />

          <Line
            yAxisId="count"
            type="monotone"
            dataKey="order_count"
            name="Số đơn"
            stroke="#0f766e"
            strokeWidth={3}
            dot={{
              r: 4,
              fill: "#0f766e",
              strokeWidth: 2,
              stroke: "#ffffff",
            }}
            activeDot={{
              r: 7,
            }}
          />

          {hasSoldLine && (
            <Line
              yAxisId="count"
              type="monotone"
              dataKey="sold_quantity"
              name="SL bán"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{
                r: 4,
                fill: "#f59e0b",
                strokeWidth: 2,
                stroke: "#ffffff",
              }}
              activeDot={{
                r: 7,
              }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function RevenueTooltip({ active, payload, label, hasSoldLine }) {
  if (!active || !payload?.length) return null;

  const revenue = payload.find((item) => item.dataKey === "revenue")?.value || 0;
  const orders =
    payload.find((item) => item.dataKey === "order_count")?.value || 0;
  const sold =
    payload.find((item) => item.dataKey === "sold_quantity")?.value || 0;

  return (
    <div className="rounded-2xl border border-green-100 bg-white px-4 py-3 shadow-xl">
      <p className="mb-2 text-sm font-extrabold text-slate-950">{label}</p>

      <div className="space-y-1 text-sm font-bold">
        <p className="flex items-center justify-between gap-6 text-green-700">
          <span>Doanh thu</span>
          <span>{formatCurrency(revenue)}</span>
        </p>

        <p className="flex items-center justify-between gap-6 text-teal-700">
          <span>Số đơn</span>
          <span>{formatNumber(orders)} đơn</span>
        </p>

        {hasSoldLine && (
          <p className="flex items-center justify-between gap-6 text-amber-600">
            <span>SL bán</span>
            <span>{formatNumber(sold)} sp</span>
          </p>
        )}
      </div>
    </div>
  );
}

function TopProductItem({ product, index }) {
  const image = getImageUrl(product.thumbnail_url || product.thumbnail);
  const share = Number(product.revenue_share || 0);

  return (
    <div className="min-w-0 rounded-3xl border border-green-100 p-4 transition hover:bg-green-50/40">
      <div className="flex min-w-0 items-center gap-4">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-green-50 text-sm font-extrabold text-green-700">
          {index + 1}
        </div>

        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-green-50">
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <Package size={24} className="text-green-700" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-extrabold text-slate-950">
            {product.name}
          </h3>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            Đã bán: {formatNumber(product.sold_quantity)} {product.unit || ""}
          </p>

          <p className="mt-1 text-sm font-extrabold text-green-700">
            {formatCurrency(product.revenue)}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs font-bold text-slate-400">
          <span>Đóng góp doanh thu</span>
          <span>{share}%</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            style={{ width: `${Math.min(share, 100)}%` }}
            className="h-full rounded-full bg-green-600"
          />
        </div>
      </div>
    </div>
  );
}

function EmptyBox({ icon: Icon, title, text }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-green-200 bg-green-50 p-8 text-center">
      <div>
        <Icon size={42} className="mx-auto text-green-700" />
        <p className="mt-3 font-extrabold text-slate-950">{title}</p>
        <p className="mt-1 text-sm font-medium text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function SellerRevenueSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-64 animate-pulse rounded-3xl bg-green-100" />

      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="h-12 w-12 animate-pulse rounded-2xl bg-green-100" />
            <div className="mt-4 h-4 w-28 animate-pulse rounded-lg bg-slate-200" />
            <div className="mt-3 h-7 w-36 animate-pulse rounded-lg bg-slate-200" />
            <div className="mt-2 h-3 w-32 animate-pulse rounded-lg bg-slate-200" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <div className="h-[520px] animate-pulse rounded-3xl bg-white shadow-sm" />
        <div className="h-[520px] animate-pulse rounded-3xl bg-white shadow-sm" />
      </div>
    </div>
  );
}