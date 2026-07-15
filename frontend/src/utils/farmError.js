function getFirstErrorMessage(errors) {
  const firstError = Object.values(errors ?? {})[0];

  if (Array.isArray(firstError)) {
    return firstError[0] || null;
  }

  return typeof firstError === "string"
    ? firstError
    : null;
}

export function getFarmErrorMessage(
  error,
  fallback = "Có lỗi xảy ra.",
) {
  const errorData = error?.response?.data ?? error;

  const firstError = getFirstErrorMessage(
    errorData?.errors,
  );

  return (
    firstError ||
    errorData?.message ||
    errorData?.error ||
    fallback
  );
}