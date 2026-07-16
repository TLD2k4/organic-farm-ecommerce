import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
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
  Area,
  AreaChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import sellerRevenueService from "../../services/sellerRevenueService";
import ResponsiveSelect from "../../components/common/ResponsiveSelect";

const DEFAULT_DATA = {
  farm: null,
  filters: {
    period: "30d",
    from: "",
    to: "",
    group_by: "day",
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CHART_METRICS = {
  revenue: {
    key: "revenue",
    label: "Doanh thu",
    totalLabel: "Tổng doanh thu",
    color: "#059669",
    background: "from-emerald-50/80",
    emptyText: "Chưa có doanh thu trong khoảng thời gian này.",
  },
  orders: {
    key: "order_count",
    label: "Số đơn",
    totalLabel: "Tổng đơn hoàn thành",
    color: "#2563eb",
    background: "from-blue-50/80",
    emptyText: "Chưa có đơn hoàn thành trong khoảng thời gian này.",
  },
  sold: {
    key: "sold_quantity",
    label: "Số lượng bán",
    totalLabel: "Tổng số lượng bán",
    color: "#d97706",
    background: "from-amber-50/80",
    emptyText: "Chưa có sản phẩm được bán trong khoảng thời gian này.",
  },
};

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
  const [chartMetric, setChartMetric] = useState("revenue");

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
        item.order_count || item.orders || item.total_orders || 0,
      ),
      sold_quantity: Number(
        item.sold_quantity ||
          item.sold ||
          item.total_quantity ||
          item.quantity ||
          0,
      ),
    }));
  }, [rawChart]);

  const totalChartRevenue = useMemo(() => {
    return chartData.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
  }, [chartData]);

  const totalChartOrders = useMemo(() => {
    return chartData.reduce(
      (sum, item) => sum + Number(item.order_count || 0),
      0,
    );
  }, [chartData]);

  const totalChartSold = useMemo(() => {
    return chartData.reduce(
      (sum, item) => sum + Number(item.sold_quantity || 0),
      0,
    );
  }, [chartData]);

  const selectedMetric = CHART_METRICS[chartMetric];
  const selectedMetricTotal = chartMetric === "revenue"
    ? totalChartRevenue
    : chartMetric === "orders"
      ? totalChartOrders
      : totalChartSold;
  const groupLabel = {
    day: "ngày",
    week: "tuần",
    month: "tháng",
  }[report.filters?.group_by] || "kỳ";

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
        limit: 5,
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
      <div className="min-w-0 overflow-hidden rounded-3xl bg-linear-to-br from-green-800 via-green-700 to-emerald-500 p-4 text-white shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold uppercase tracking-wide">
              Seller Analytics
            </p>

            <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">
              Thống kê doanh thu
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-medium text-green-50">
              Theo dõi doanh thu, đơn hoàn thành và sản phẩm bán chạy của gian
              hàng mình.
            </p>
          </div>

          <Link to="/seller/farm" className="max-w-full break-words rounded-2xl bg-white/15 px-5 py-3 text-sm font-extrabold backdrop-blur hover:bg-white/25 hover:underline">
            {report?.farm?.name || "Gian hàng của tôi"}
          </Link>
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
        className="min-w-0 rounded-3xl bg-white p-4 shadow-sm sm:p-5"
      >
        <div
          className={`grid min-w-0 gap-3 ${
            filters.period === "custom"
              ? "lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)_auto]"
              : "lg:grid-cols-[220px_auto]"
          }`}
        >
          <ResponsiveSelect
            value={filters.period}
            onChange={(value) => updateFilter("period", value)}
            options={[
              { value: "today", label: "Hôm nay" },
              { value: "7d", label: "7 ngày gần đây" },
              { value: "30d", label: "30 ngày gần đây" },
              { value: "month", label: "Tháng này" },
              { value: "year", label: "Năm nay" },
              { value: "custom", label: "Tùy chọn" },
            ]}
          />

          {filters.period === "custom" && (
            <>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => updateFilter("from", e.target.value)}
                className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-green-600"
              />

              <input
                type="date"
                value={filters.to}
                onChange={(e) => updateFilter("to", e.target.value)}
                className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-green-600"
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
        <div className="min-w-0 overflow-hidden rounded-3xl bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-950">
                Xu hướng theo thời gian
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Dữ liệu tự động nhóm theo {groupLabel}; mỗi lần hiển thị một chỉ số.
              </p>
            </div>

            <div className="rounded-2xl bg-green-50 px-4 py-3 text-right">
              <p className="text-xs font-extrabold uppercase tracking-wide text-green-700">
                {selectedMetric.totalLabel}
              </p>

              <p className="mt-1 text-lg font-extrabold text-green-700">
                {chartMetric === "revenue"
                  ? formatCurrency(selectedMetricTotal)
                  : formatNumber(selectedMetricTotal)}
              </p>
            </div>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {Object.entries(CHART_METRICS).map(([key, metric]) => (
              <button
                key={key}
                type="button"
                onClick={() => setChartMetric(key)}
                className={`rounded-xl px-4 py-2.5 text-sm font-extrabold transition ${
                  chartMetric === key
                    ? "bg-slate-950 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {metric.label}
              </button>
            ))}
          </div>

          {chartData.length === 0 || selectedMetricTotal <= 0 ? (
            <EmptyBox
              icon={BarChart3}
              title={`Chưa có ${selectedMetric.label.toLowerCase()}`}
              text={selectedMetric.emptyText}
            />
          ) : (
            <SellerMetricChart
              chartData={chartData}
              metricKey={chartMetric}
            />
          )}
        </div>

        <div className="min-w-0 overflow-hidden rounded-3xl bg-white p-4 shadow-sm sm:p-6">
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
  const hasComparison = percent !== null && percent !== undefined;
  const percentNumber = Number(percent || 0);
  const positive = percentNumber > 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="min-w-0 rounded-2xl bg-white/15 p-4 backdrop-blur">
      <p className="text-sm font-bold text-green-50">{label}</p>

      <p className="mt-2 break-words text-xl font-extrabold text-white sm:text-2xl">
        {value}
      </p>

      <div className="mt-3 inline-flex max-w-full flex-wrap items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold">
        {hasComparison && percentNumber !== 0 && <Icon size={14} />}
        {!hasComparison
          ? "Mới trong kỳ này"
          : percentNumber === 0
            ? "Không đổi so với kỳ trước"
            : `${positive ? "+" : ""}${percentNumber}% so với kỳ trước`}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subText }) {
  return (
    <div className="min-w-0 rounded-3xl bg-white p-4 shadow-sm sm:p-5">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-green-50 text-green-700">
        <Icon size={23} />
      </div>

      <p className="mt-4 text-sm font-bold text-slate-500">{label}</p>

      <p className="mt-2 break-words text-xl font-extrabold text-slate-950 sm:text-2xl">
        {value}
      </p>

      <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">
        {subText}
      </p>
    </div>
  );
}

function SellerMetricChart({ chartData, metricKey }) {
  const metric = CHART_METRICS[metricKey];
  const xInterval =
    chartData.length > 16 ? Math.ceil(chartData.length / 10) : 0;
  const commonXAxis = {
    dataKey: "label",
    interval: xInterval,
    tick: {
      fill: "#64748b",
      fontSize: 12,
      fontWeight: 800,
    },
    axisLine: false,
    tickLine: false,
    minTickGap: 10,
  };
  const commonYAxis = {
    tickFormatter: formatCompactCurrency,
    tick: {
      fill: "#64748b",
      fontSize: 12,
      fontWeight: 800,
    },
    axisLine: false,
    tickLine: false,
    width: 56,
    allowDecimals: metricKey !== "orders",
  };

  return (
    <div className={`h-100 w-full min-w-0 rounded-3xl bg-linear-to-b ${metric.background} to-white p-1 sm:h-107.5 sm:p-4`}>
      <ResponsiveContainer width="100%" height="100%">
        {metricKey === "revenue" ? (
          <AreaChart data={chartData} margin={{ top: 20, right: 4, left: -20, bottom: 10 }}>
            <defs>
              <linearGradient id="sellerRevenueArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={metric.color} stopOpacity={0.42} />
                <stop offset="100%" stopColor={metric.color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="5 5" stroke="#d8eadc" vertical={false} />
            <XAxis {...commonXAxis} />
            <YAxis {...commonYAxis} />
            <Tooltip content={<MetricTooltip metricKey={metricKey} />} />
            <Area type="monotone" dataKey={metric.key} name={metric.label} stroke={metric.color} strokeWidth={3} fill="url(#sellerRevenueArea)" activeDot={{ r: 6, fill: metric.color, stroke: "white", strokeWidth: 3 }} />
          </AreaChart>
        ) : (
          <BarChart data={chartData} margin={{ top: 20, right: 4, left: -20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="5 5" stroke="#dbe4ee" vertical={false} />
            <XAxis {...commonXAxis} />
            <YAxis {...commonYAxis} />
            <Tooltip content={<MetricTooltip metricKey={metricKey} />} cursor={{ fill: "#e2e8f0", opacity: 0.5 }} />
            <Bar dataKey={metric.key} name={metric.label} fill={metric.color} radius={[10, 10, 0, 0]} maxBarSize={38} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function MetricTooltip({ active, payload, label, metricKey }) {
  if (!active || !payload?.length) return null;
  const metric = CHART_METRICS[metricKey];
  const value = payload.find((item) => item.dataKey === metric.key)?.value || 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
      <p className="mb-2 text-sm font-extrabold text-slate-950">{label}</p>
      <p className="flex items-center justify-between gap-6 text-sm font-bold" style={{ color: metric.color }}>
        <span>{metric.label}</span>
        <span>{metricKey === "revenue" ? formatCurrency(value) : formatNumber(value)}</span>
      </p>
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
          <Link
            to={`/seller/products?view=${product.id}`}
            className="break-words font-extrabold text-slate-950 hover:text-green-700 hover:underline"
          >
            {product.name}
          </Link>

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
        <div className="h-130 animate-pulse rounded-3xl bg-white shadow-sm" />
        <div className="h-130 animate-pulse rounded-3xl bg-white shadow-sm" />
      </div>
    </div>
  );
}
