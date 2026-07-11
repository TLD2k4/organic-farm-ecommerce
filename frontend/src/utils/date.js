// src\utils\date.js

export function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleString("vi-VN");
}