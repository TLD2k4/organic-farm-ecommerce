import {
  BadgeDollarSign,
  Ban,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  PackageCheck,
  Percent,
  ReceiptText,
  ShoppingCart,
  Boxes,
  UserPlus,
} from "lucide-react";

const formatNumber = (value, maximumFractionDigits = 0) => {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits,
  }).format(Number(value || 0));
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

const formatPercent = (value) => {
  return `${formatNumber(value, 2)}%`;
};

export default function ReportSummary({ summary = {}, loading = false }) {
  const items = [
    {
      label: "Tổng doanh thu",
      value: formatCurrency(summary.revenue),
      icon: CircleDollarSign,
      iconClass: "bg-green-100 text-green-700",
    },
    {
      label: "Đơn hàng cha",
      value: formatNumber(summary.total_orders),
      icon: ShoppingCart,
      iconClass: "bg-blue-100 text-blue-700",
    },
    {
      label: "Đơn con theo gian hàng",
      value: formatNumber(summary.total_sub_orders),
      icon: Boxes,
      iconClass: "bg-fuchsia-100 text-fuchsia-700",
    },
    {
      label: "Đơn con ghi nhận doanh thu",
      value: formatNumber(summary.paid_orders),
      icon: ReceiptText,
      iconClass: "bg-cyan-100 text-cyan-700",
    },
    {
      label: "Đơn tổng hoàn thành",
      value: formatNumber(summary.completed_orders),
      icon: CheckCircle2,
      iconClass: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Đơn tổng đã hủy",
      value: formatNumber(summary.cancelled_orders),
      icon: Ban,
      iconClass: "bg-red-100 text-red-700",
    },
    {
      label: "Giá trị đơn trung bình",
      value: formatCurrency(summary.average_order_value),
      icon: BadgeDollarSign,
      iconClass: "bg-violet-100 text-violet-700",
    },
    {
      label: "Tỷ lệ hoàn thành đơn tổng",
      value: formatPercent(summary.completion_rate),
      icon: ClipboardCheck,
      iconClass: "bg-teal-100 text-teal-700",
    },
    {
      label: "Tỷ lệ hủy đơn tổng",
      value: formatPercent(summary.cancellation_rate),
      icon: Percent,
      iconClass: "bg-orange-100 text-orange-700",
    },
    {
      label: "Người dùng mới",
      value: formatNumber(summary.new_users),
      icon: UserPlus,
      iconClass: "bg-indigo-100 text-indigo-700",
    },
    {
      label: "Số lượng sản phẩm bán",
      value: formatNumber(summary.total_items_sold, 2),
      icon: PackageCheck,
      iconClass: "bg-amber-100 text-amber-700",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
        {[...Array(11)].map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl bg-slate-200"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">
                  {item.label}
                </p>

                <p className="mt-3 wrap-break-word text-2xl font-bold text-slate-900">
                  {item.value}
                </p>
              </div>

              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-100/70 transition group-hover:scale-125" />
              <div
                className={`
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center

                  relative rounded-2xl shadow-sm

                  ${item.iconClass}
                `}
              >
                <Icon size={21} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
