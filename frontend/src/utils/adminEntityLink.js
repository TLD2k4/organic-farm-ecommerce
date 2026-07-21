import { FARM_STATUS } from "@/utils/farm";

function isTrue(value) {
  return value === true || value === 1 || value === "1";
}

export function getAdminProductLink(product) {
  if (!product || product.current_product_exists === false) {
    return null;
  }

  const id = product?.id ?? product?.product_id;
  const slug = product?.slug ?? product?.product_slug;
  const hasCanonicalVisibility = Object.prototype.hasOwnProperty.call(
    product,
    "is_publicly_visible",
  );
  const isPublic = Boolean(
    slug &&
      (hasCanonicalVisibility
        ? isTrue(product.is_publicly_visible)
        : isTrue(product?.is_sellable)),
  );

  if (isPublic) {
    return {
      to: `/products/${slug}`,
      isPublic: true,
      title: "Mở trang sản phẩm công khai",
    };
  }

  if (id) {
    return {
      to: `/admin/products?view=${id}`,
      isPublic: false,
      title:
        product?.public_visibility_reason ||
        "Sản phẩm chưa công khai — mở chi tiết quản trị",
    };
  }

  return null;
}

export function getAdminFarmLink(farm) {
  const id = farm?.id ?? farm?.farm_id;
  const slug = farm?.slug;
  const isPublic = Boolean(
    slug &&
      Number(farm?.status) === FARM_STATUS.ACTIVE &&
      !farm?.deleted_at,
  );

  if (isPublic) {
    return {
      to: `/farms/${slug}`,
      isPublic: true,
      title: "Mở trang nông trại công khai",
    };
  }

  if (id) {
    return {
      to: `/admin/farms?view=${id}`,
      isPublic: false,
      title: "Nông trại chưa công khai — mở chi tiết quản trị",
    };
  }

  return null;
}

export function getAdminCategoryLink(category) {
  if (!category) return null;

  const id = category?.id ?? category?.category_id;
  const slug = category?.slug ?? category?.category_slug;
  const isPublic = Boolean(
    slug && Number(category?.status) === 1 && !category?.deleted_at,
  );

  if (isPublic) {
    return {
      to: `/products?category_slug=${encodeURIComponent(slug)}`,
      isPublic: true,
      title: "Xem các sản phẩm công khai thuộc danh mục",
    };
  }

  if (id) {
    return {
      to: `/admin/categories?view=${id}`,
      isPublic: false,
      title: "Danh mục chưa công khai — mở chi tiết quản trị",
    };
  }

  return null;
}
