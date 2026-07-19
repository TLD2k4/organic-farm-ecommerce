export const MIN_CART_QUANTITY = 0.1;
export const CART_QUANTITY_STEP = 0.1;
export const QUANTITY_DECIMAL_PLACES = 2;

export function formatQuantity(value) {
  const quantity = Number(value || 0);

  if (!Number.isFinite(quantity)) return "0";

  return quantity.toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: QUANTITY_DECIMAL_PLACES,
  });
}

export function formatKg(value) {
  return `${formatQuantity(value)} kg`;
}

export function sumItemQuantity(items = []) {
  return items.reduce((total, item) => {
    return total + Number(item?.quantity || 0);
  }, 0);
}

export function parseQuantityInput(value) {
  if (typeof value === "number") return value;

  const normalized = String(value ?? "")
    .trim()
    .replace(",", ".");

  if (!normalized) return Number.NaN;

  return Number(normalized);
}

export function roundQuantity(value) {
  const quantity = Number(value);
  const factor = 10 ** QUANTITY_DECIMAL_PLACES;

  if (!Number.isFinite(quantity)) return Number.NaN;

  return Math.round((quantity + Number.EPSILON) * factor) / factor;
}

export function isQuantityDraft(value) {
  return /^\d*(?:[.,]\d{0,2})?$/.test(String(value ?? ""));
}

export function stepQuantity(value, direction, maxQuantity = Number.POSITIVE_INFINITY) {
  const current = Number(value || MIN_CART_QUANTITY);
  const delta = direction >= 0 ? CART_QUANTITY_STEP : -CART_QUANTITY_STEP;
  const stepped = Math.max(MIN_CART_QUANTITY, roundQuantity(current + delta));

  if (!Number.isFinite(Number(maxQuantity))) return stepped;

  return Math.min(stepped, roundQuantity(maxQuantity));
}
