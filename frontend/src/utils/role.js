// src\utils\role.js

export function roleLabel(role) {
  switch (role) {
    case "admin":
      return "Quản trị viên";

    case "seller":
      return "Người bán";

    case "customer":
      return "Khách hàng";

    default:
      return role;
  }
}

export function roleBadgeClass(role) {
  switch (role) {
    case "admin":
      return "bg-red-100 text-red-700";

    case "seller":
      return "bg-green-100 text-green-700";

    case "customer":
      return "bg-blue-100 text-blue-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}