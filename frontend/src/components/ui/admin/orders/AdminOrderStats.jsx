import {
  Ban,
  CircleDollarSign,
  Clock3,
  PackageCheck,
  PackageOpen,
  Truck,
} from "lucide-react";

import { formatMoney } from "@/utils/adminOrder";

export default function AdminOrderStats({ stats = {}, mode = "orders" }) {
  const cards = [
    {
      label: mode === "orders" ? "Tổng đơn tổng" : "Tổng đơn nông trại",
      value: stats.total ?? 0,
      icon: PackageOpen,
    },
    {
      label: "Chờ xác nhận",
      value: stats.pending ?? 0,
      icon: Clock3,
    },
    {
      label: mode === "orders" ? "Đang xử lý" : "Đang chuẩn bị",
      value: mode === "orders" ? stats.processing ?? 0 : stats.preparing ?? 0,
      icon: PackageCheck,
    },
    {
      label: "Đang giao",
      value: stats.shipping ?? 0,
      icon: Truck,
    },
    {
      label: "Hoàn thành",
      value: stats.completed ?? 0,
      icon: PackageCheck,
    },
    {
      label: "Đã hủy",
      value: stats.cancelled ?? 0,
      icon: Ban,
    },
    {
      label: "Doanh thu hoàn thành",
      value: formatMoney(stats.completed_revenue ?? 0),
      icon: CircleDollarSign,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      {cards.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <Icon size={19} />
          </div>
          <p className="text-xs font-semibold text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-extrabold text-slate-900">{value}</p>
        </div>
      ))}
    </div>
  );
}
