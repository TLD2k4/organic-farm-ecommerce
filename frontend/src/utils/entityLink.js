function isTrue(value) {
  return value === true || value === 1 || value === "1";
}

export function getPublicProductPath(product) {
  if (!product || product.current_product_exists === false) return null;

  const slug = product.slug ?? product.product_slug;
  if (!slug) return null;

  if (
    Object.prototype.hasOwnProperty.call(product, "is_publicly_visible") &&
    !isTrue(product.is_publicly_visible)
  ) {
    return null;
  }

  return `/products/${slug}`;
}

export function getPublicFarmPath(farm) {
  if (!farm) return null;

  const slug = farm.slug ?? farm.farm_slug;
  if (!slug || farm.deleted_at) return null;

  if (
    Object.prototype.hasOwnProperty.call(farm, "is_publicly_visible") &&
    !isTrue(farm.is_publicly_visible)
  ) {
    return null;
  }

  if (farm.status !== undefined && Number(farm.status) !== 1) return null;

  return `/farms/${slug}`;
}

export function getSellerProductPath(product) {
  const id = product?.id ?? product?.product_id;
  return id ? `/seller/products?view=${id}` : null;
}
