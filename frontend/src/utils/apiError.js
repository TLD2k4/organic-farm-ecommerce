const TECHNICAL_ERROR_PATTERNS = [
  /SQLSTATE/i,
  /PDOException/i,
  /Unknown column/i,
  /Stack trace/i,
  /Illuminate\\/i,
  /select\s+.+\s+from/i,
];

function isTechnicalMessage(message) {
  return TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

export function getApiErrorMessage(
  error,
  fallback = "Đã xảy ra lỗi. Vui lòng thử lại.",
) {
  const data = error?.response?.data ?? error;
  const firstValidationError = Object.values(data?.errors || {})[0];
  const validationMessage = Array.isArray(firstValidationError)
    ? firstValidationError[0]
    : typeof firstValidationError === "string"
      ? firstValidationError
      : null;
  const candidate =
    validationMessage || data?.message || data?.error || error?.message;

  if (typeof candidate !== "string" || !candidate.trim()) {
    return fallback;
  }

  return isTechnicalMessage(candidate) ? fallback : candidate.trim();
}

