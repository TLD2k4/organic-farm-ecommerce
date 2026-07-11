import {
  Building2,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  EyeOff,
  PackageCheck,
  ShoppingBag,
  Star,
  Users,
} from "lucide-react";

const formatNumber = (value) => {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

export default function DashboardStats({ cards = {}, loading = false }) {
  const stats = [
    {
      label: "Tổng người dùng",
      value: formatNumber(cards.total_users),
      icon: Users,
      iconClass: "bg-blue-100 text-blue-700",
    },
    {
      label: "Tổng nông trại",
      value: formatNumber(cards.total_farms),
      icon: Building2,
      iconClass: "bg-green-100 text-green-700",
    },
    {
      label: "Nông trại chờ duyệt",
      value: formatNumber(cards.pending_farms),
      icon: Clock3,
      iconClass: "bg-yellow-100 text-yellow-700",
    },
    {
      label: "Tổng sản phẩm",
      value: formatNumber(cards.total_products),
      icon: ShoppingBag,
      iconClass: "bg-violet-100 text-violet-700",
    },
    {
      label: "Sản phẩm đang bán",
      value: formatNumber(cards.active_products),
      icon: PackageCheck,
      iconClass: "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Sản phẩm tạm ẩn",
      value: formatNumber(cards.hidden_products),
      icon: EyeOff,
      iconClass: "bg-slate-200 text-slate-700",
    },
    {
      label: "Tổng đơn hàng",
      value: formatNumber(cards.total_orders),
      icon: ClipboardList,
      iconClass: "bg-orange-100 text-orange-700",
    },
    {
      label: "Đơn hàng hôm nay",
      value: formatNumber(cards.today_orders),
      icon: ClipboardList,
      iconClass: "bg-cyan-100 text-cyan-700",
    },
    {
      label: "Tổng doanh thu",
      value: formatCurrency(cards.total_revenue),
      icon: CircleDollarSign,
      iconClass: "bg-red-100 text-red-700",
      wide: true,
    },
    {
      label: "Tổng đánh giá",
      value: formatNumber(cards.total_reviews),
      icon: Star,
      iconClass: "bg-amber-100 text-amber-700",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(8)].map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl bg-slate-200"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className={`
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-5
              shadow-sm
              transition
              hover:-translate-y-0.5
              hover:shadow-md

              ${item.wide ? "sm:col-span-2 xl:col-span-1" : ""}
            `}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">
                  {item.label}
                </p>

                <p className="mt-3 wrap-break-word text-2xl font-bold text-slate-900">
                  {item.value}
                </p>
              </div>

              <div
                className={`
                  flex
                  h-12
                  w-12
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl

                  ${item.iconClass}
                `}
              >
                <Icon size={23} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
