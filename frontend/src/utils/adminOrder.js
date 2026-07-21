export const orderStatusConfig = {
  0: { label: "Chờ xác nhận", className: "bg-amber-100 text-amber-700" },
  1: { label: "Đang xử lý", className: "bg-blue-100 text-blue-700" },
  2: { label: "Đang giao", className: "bg-indigo-100 text-indigo-700" },
  3: { label: "Hoàn thành", className: "bg-green-100 text-green-700" },
  4: { label: "Đã hủy", className: "bg-red-100 text-red-700" },
};

export const subOrderStatusConfig = {
  0: { label: "Chờ xác nhận", className: "bg-amber-100 text-amber-700" },
  1: { label: "Đang chuẩn bị", className: "bg-blue-100 text-blue-700" },
  2: { label: "Đang giao", className: "bg-indigo-100 text-indigo-700" },
  3: { label: "Hoàn thành", className: "bg-green-100 text-green-700" },
  4: { label: "Đã hủy", className: "bg-red-100 text-red-700" },
};

export const paymentStatusConfig = {
  0: { label: "Chờ thanh toán", className: "bg-amber-100 text-amber-700" },
  1: { label: "Đã thanh toán", className: "bg-green-100 text-green-700" },
  2: { label: "Thất bại", className: "bg-red-100 text-red-700" },
  3: { label: "Đã hoàn tiền", className: "bg-violet-100 text-violet-700" },
};

export function formatMoney(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function paymentMethodLabel(method) {
  if (method === "MOMO") return "MoMo";
  if (method === "COD") return "COD";
  return method || "—";
}
