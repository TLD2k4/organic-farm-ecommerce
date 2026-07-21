import { useEffect, useState } from "react";

import dayjs from "dayjs";
import toast from "react-hot-toast";

import useAdminReport from "@/hooks/useAdminReport";

import { ADMIN_REPORT_DEFAULT_FILTERS } from "@/store/adminReportStore";

import ReportFilter from "@/components/ui/admin/reports/ReportFilter";
import ReportSummary from "@/components/ui/admin/reports/ReportSummary";
import ReportCharts from "@/components/ui/admin/reports/ReportCharts";
import TopProductsTable from "@/components/ui/admin/reports/TopProductsTable";
import TopStockProductsTable from "@/components/ui/admin/reports/TopStockProductsTable";
import TopCategoriesTable from "@/components/ui/admin/reports/TopCategoriesTable";
import TopFarmsTable from "@/components/ui/admin/reports/TopFarmsTable";

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  return dayjs(value).format("DD/MM/YYYY");
};

export default function ReportsPage() {
  const { report, filters, loading, error, getReport } = useAdminReport();

  const [draftFilters, setDraftFilters] = useState({
    ...filters,
  });

  useEffect(() => {
    getReport().catch(() => {});
  }, [getReport]);

  const handleFilterChange = (field, value) => {
    setDraftFilters((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const validateFilters = () => {
    if (!draftFilters.from_date || !draftFilters.to_date) {
      toast.error("Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.");

      return false;
    }

    const fromDate = dayjs(draftFilters.from_date);

    const toDate = dayjs(draftFilters.to_date);

    if (!fromDate.isValid() || !toDate.isValid()) {
      toast.error("Khoảng thời gian không hợp lệ.");

      return false;
    }

    if (toDate.isBefore(fromDate, "day")) {
      toast.error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");

      return false;
    }

    return true;
  };

  const handleApply = async () => {
    if (!validateFilters()) {
      return;
    }

    const normalizedFilters = {
      ...draftFilters,
      limit: Number(draftFilters.limit || 10),
    };

    try {
      await getReport(normalizedFilters);

      toast.success("Đã cập nhật báo cáo.");
    } catch (requestError) {
      toast.error(requestError?.message || "Không thể tải báo cáo.");
    }
  };

  const handleReset = async () => {
    const defaultFilters = {
      ...ADMIN_REPORT_DEFAULT_FILTERS,
    };

    setDraftFilters(defaultFilters);

    try {
      await getReport(defaultFilters);

      toast.success("Đã đặt lại bộ lọc.");
    } catch (requestError) {
      toast.error(requestError?.message || "Không thể tải báo cáo.");
    }
  };

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      {/* HEADER */}
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Báo cáo và thống kê
        </h1>

        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          Theo dõi doanh thu, đơn hàng, sản phẩm và nông trại
        </p>
      </div>

      {/* FILTER */}
      <ReportFilter
        value={draftFilters}
        loading={loading}
        onChange={handleFilterChange}
        onApply={handleApply}
        onReset={handleReset}
      />

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* PERIOD */}
      {report.filters?.from_date && report.filters?.to_date && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Báo cáo từ{" "}
          <span className="font-bold text-slate-900">
            {formatDate(report.filters.from_date)}
          </span>{" "}
          đến{" "}
          <span className="font-bold text-slate-900">
            {formatDate(report.filters.to_date)}
          </span>
          <span className="mx-2 text-slate-300">|</span>
          Nhóm theo:{" "}
          <span className="font-bold text-slate-900">
            {{
              day: "Ngày",
              week: "Tuần",
              month: "Tháng",
              year: "Năm",
            }[report.filters.group_by] || "Tự động"}
          </span>
        </div>
      )}

      {/* SUMMARY */}
      <ReportSummary summary={report.summary} loading={loading} />

      {/* CHART */}
      <ReportCharts data={report.chart} loading={loading} />

      {/* TOP PRODUCTS */}
      <TopProductsTable products={report.top_products} loading={loading} />

      {/* TOP STOCK */}
      <TopStockProductsTable
        products={report.top_stock_products}
        loading={loading}
      />

      {/* TOP CATEGORY + FARM */}
      <div className="grid min-w-0 grid-cols-1 gap-5">
        <TopCategoriesTable
          categories={report.top_categories}
          loading={loading}
        />

        <TopFarmsTable farms={report.top_farms} loading={loading} />
      </div>
    </div>
  );
}
