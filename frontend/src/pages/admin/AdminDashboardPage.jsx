import { useEffect } from "react";
import { RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";

import useAdminDashboard from "@/hooks/useAdminDashboard";

import ResponsiveSelect from "@/components/common/ResponsiveSelect";

import DashboardStats from "@/components/ui/admin/dashboard/DashboardStats";
import DashboardCharts from "@/components/ui/admin/dashboard/DashboardCharts";
import RecentOrders from "@/components/ui/admin/dashboard/RecentOrders";
import RecentFarms from "@/components/ui/admin/dashboard/RecentFarms";

const dayOptions = [
  {
    value: 7,
    label: "7 ngày gần nhất",
  },
  {
    value: 30,
    label: "30 ngày gần nhất",
  },
  {
    value: 90,
    label: "90 ngày gần nhất",
  },
];

export default function AdminDashboardPage() {
  const { dashboard, loading, error, days, setDays, getDashboard } =
    useAdminDashboard();

  useEffect(() => {
    getDashboard({
      days,
    }).catch(() => {});
  }, [days, getDashboard]);

  const handleRefresh = async () => {
    try {
      await getDashboard({
        days,
      });

      toast.success("Đã cập nhật dữ liệu tổng quan.");
    } catch (err) {
      toast.error(err?.message || "Không thể cập nhật dữ liệu.");
    }
  };

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Tổng quan hệ thống
          </h1>

          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            Theo dõi hoạt động của toàn bộ sàn Organic Farm
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="w-full sm:w-56">
            <ResponsiveSelect
              value={days}
              options={dayOptions}
              onChange={(value) => {
                setDays(Number(value));
              }}
            />
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleRefresh}
            className="
              flex
              min-h-12
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              py-3
              font-semibold
              text-slate-700
              transition
              hover:bg-slate-50
              disabled:cursor-not-allowed
              disabled:opacity-50
              sm:w-auto
            "
          >
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* PERIOD */}
      {dashboard.period?.from_date && dashboard.period?.to_date && (
        <div className="text-sm text-slate-500">
          Dữ liệu từ{" "}
          <span className="font-semibold text-slate-700">
            {dashboard.period.from_date}
          </span>{" "}
          đến{" "}
          <span className="font-semibold text-slate-700">
            {dashboard.period.to_date}
          </span>
        </div>
      )}

      {/* CARDS */}
      <DashboardStats cards={dashboard.cards} loading={loading} />

      {/* CHARTS */}
      <DashboardCharts data={dashboard.chart} loading={loading} />

      {/* RECENT DATA */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
        <RecentOrders orders={dashboard.recent_orders} loading={loading} />

        <RecentFarms farms={dashboard.recent_farms} loading={loading} />
      </div>
    </div>
  );
}
