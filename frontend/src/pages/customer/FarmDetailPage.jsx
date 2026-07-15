// src\pages\customer\FarmDetailPage.jsx

import { useEffect, useState } from "react";

import {
  Award,
  Leaf,
  MapPin,
  Phone,
  ShoppingCart,
  Star,
  User,
  Store,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import useFarm from "@/hooks/useFarm";

import Pagination from "@/components/common/Pagination";

import { getImageUrl } from "@/utils/image";
import useAddToCart from "@/hooks/useAddToCart";

function formatMoney(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return Number(value).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
}

function getProductImage(product) {
  return (
    product?.thumbnail_url ||
    product?.thumbnail ||
    product?.image_url ||
    product?.image ||
    product?.cover_image ||
    ""
  );
}

function getProductRating(product) {
  const rawAverage =
    typeof product?.rating === "object"
      ? product?.rating?.average
      : (product?.rating ?? product?.rating_avg ?? product?.average_rating);

  const rawTotal =
    typeof product?.rating === "object"
      ? product?.rating?.total
      : (product?.review_count ?? product?.reviews_count);

  const average = Number(rawAverage ?? 0);

  const total = Number(rawTotal ?? 0);

  return {
    average: Number.isFinite(average) ? average : 0,

    total: Number.isFinite(total) ? total : 0,
  };
}

function getDiscountPercent(product) {
  const existingPercent = Number(product?.discount_percent ?? 0);

  if (existingPercent > 0) {
    return Math.round(existingPercent);
  }

  const price = Number(product?.price ?? 0);

  const salePrice = Number(product?.sale_price ?? 0);

  if (price <= 0 || salePrice <= 0 || salePrice >= price) {
    return 0;
  }

  return Math.round(((price - salePrice) / price) * 100);
}

function formatSoldQuantity(product) {
  const quantity = Number(product?.sold_quantity ?? product?.sold_count ?? 0);

  const unit = product?.unit || "";

  if (!quantity) {
    return "Chưa bán";
  }

  const displayQuantity = Number.isInteger(quantity)
    ? quantity
    : quantity.toFixed(1).replace(".0", "");

  return `Đã bán ${displayQuantity}${unit ? ` ${unit}` : ""}`;
}

export default function FarmDetailPage() {
  const { slug } = useParams();

  const {
    publicFarm,
    publicDetailLoading,

    publicFarmProducts,
    publicFarmProductsMeta,
    publicFarmProductsLoading,

    getBySlug,
    clearPublicFarm,
  } = useFarm();

  const [productParams, setProductParams] = useState({
    page: 1,
    per_page: 12,
  });

  useEffect(() => {
    setProductParams({
      page: 1,
      per_page: 12,
    });

    return () => {
      clearPublicFarm();
    };
  }, [slug, clearPublicFarm]);

  useEffect(() => {
    if (!slug) {
      return;
    }

    getBySlug(slug, {
      page: productParams.page,
      per_page: productParams.per_page,
    }).catch(() => {});
  }, [slug, productParams.page, productParams.per_page, getBySlug]);

  if (publicDetailLoading) {
    return (
      <div className="min-w-0 space-y-5">
        <div className="h-80 animate-pulse rounded-3xl bg-slate-200" />

        <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (!publicFarm) {
    return (
      <div className="rounded-2xl bg-white py-16 text-center shadow-sm">
        Không tìm thấy nông trại.
      </div>
    );
  }

  const farm = publicFarm;

  const products = Array.isArray(publicFarmProducts) ? publicFarmProducts : [];

  const certifications = Array.isArray(farm.certifications)
    ? farm.certifications
    : [];

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <div className="relative overflow-hidden rounded-3xl bg-green-100">
        <div className="h-64 sm:h-80">
          {farm.cover_image ? (
            <img
              src={getImageUrl(farm.cover_image)}
              alt={`Ảnh bìa ${farm.name}`}
              title={`Ảnh bìa ${farm.name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              role="img"
              aria-label={`${farm.name} chưa có ảnh bìa`}
              title={`${farm.name} chưa có ảnh bìa`}
              className="flex h-full items-center justify-center text-green-300"
            >
              <Store size={80} />
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 flex min-w-0 flex-col items-start gap-3 p-4 text-white sm:flex-row sm:items-end sm:gap-4 sm:p-8">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white text-green-600 sm:h-24 sm:w-24">
            {farm.logo ? (
              <img
                src={getImageUrl(farm.logo)}
                alt={`Logo ${farm.name}`}
                title={`Logo ${farm.name}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <Store size={38} />
            )}
          </div>

          <div className="min-w-0 max-w-full">
            <h1 className="whitespace-normal wrap-break-word text-2xl font-extrabold sm:text-4xl">{farm.name}</h1>

            <p className="mt-1 flex min-w-0 items-start gap-2 text-sm text-slate-100">
              <MapPin size={16} />

              <span className="whitespace-normal wrap-break-word">{farm.address}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-extrabold">Giới thiệu nông trại</h2>

            <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">
              {farm.description || "Nông trại chưa cập nhật mô tả."}
            </p>
          </section>

          <section className="min-w-0 rounded-2xl border border-green-100 bg-white p-3 shadow-sm sm:p-5">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
                <Leaf size={21} className="text-green-700" />
                Sản phẩm
              </h2>

              <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-700">
                {farm.product_count ?? products.length} sản phẩm
              </span>
            </div>

            {publicFarmProductsLoading ? (
              <div className="mt-5 grid min-w-0 grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-3 xl:gap-4">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className="h-80 animate-pulse rounded-2xl bg-slate-200"
                  />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                Nông trại chưa có sản phẩm đang bán.
              </div>
            ) : (
              <>
                <div className="mt-5 grid min-w-0 grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-3 xl:gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {publicFarmProductsMeta && (
                  <div className="min-w-0 max-w-full overflow-hidden">
                  <Pagination
                    meta={publicFarmProductsMeta}
                    params={productParams}
                    setParams={setProductParams}
                  />
                </div>
                )}
              </>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-extrabold">Thông tin liên hệ</h2>

            <div className="mt-4 space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <User size={18} className="text-green-600" />

                <span>{farm.seller?.name || "—"}</span>
              </div>

              <div className="flex items-center gap-3">
                <Phone size={18} className="text-green-600" />

                <span>{farm.phone || "—"}</span>
              </div>

              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-green-600" />

                <span>{farm.address || "—"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-extrabold">
              <Star size={19} className="text-yellow-500" fill="currentColor" />
              Đánh giá
            </h2>

            <div className="mt-4">
              <span className="text-3xl font-extrabold">
                {farm.rating?.average ?? 0}
              </span>

              <span className="ml-2 text-sm text-slate-500">
                / 5 ({farm.rating?.total ?? 0} đánh giá)
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-extrabold">
              <Award size={19} className="text-green-600" />
              Chứng nhận
            </h2>

            {certifications.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                Chưa có chứng nhận còn hiệu lực.
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {certifications.map((name) => (
                  <span
                    key={name}
                    className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ProductCard({ product }) {
  const { addToCart, adding } = useAddToCart();
  const image = getProductImage(product);

  const rating = getProductRating(product);

  const discountPercent = getDiscountPercent(product);

  const finalPrice = product.final_price ?? product.sale_price ?? product.price;

  const finalPriceText =
    product.final_price_text ||
    product.sale_price_text ||
    formatMoney(finalPrice);

  const hasSalePrice =
    product.sale_price !== null &&
    product.sale_price !== undefined &&
    Number(product.sale_price) > 0 &&
    Number(product.sale_price) < Number(product.price);

  const oldPriceText = hasSalePrice
    ? product.price_text || formatMoney(product.price)
    : null;

  const productUrl = product.slug ? `/products/${product.slug}` : "/products";

  const productTitle = `Xem chi tiết sản phẩm ${product.name}`;

  return (
    <article
      title={product.name}
      className="group min-w-0 overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <Link
        to={productUrl}
        title={productTitle}
        aria-label={productTitle}
        className="block"
      >
        <div className="relative h-32 bg-[#f4faef] sm:h-44">
          {image ? (
            <img
              src={getImageUrl(image)}
              alt={`Ảnh sản phẩm ${product.name}`}
              title={`Ảnh sản phẩm ${product.name}`}
              className="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              role="img"
              aria-label={`Sản phẩm ${product.name} chưa có hình ảnh`}
              title={`Sản phẩm ${product.name} chưa có hình ảnh`}
              className="grid h-full w-full place-items-center text-green-700"
            >
              <Leaf size={44} />
            </div>
          )}

          <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1.5">
            {discountPercent > 0 && (
              <span
                title={`Giảm ${discountPercent}%`}
                className="rounded-md bg-red-500 px-2 py-1 text-xs font-black text-white shadow-sm"
              >
                -{discountPercent}%
              </span>
            )}

            {product.is_hot && (
              <span
                title="Sản phẩm nổi bật"
                className="rounded-md bg-orange-500 px-2 py-1 text-xs font-black text-white shadow-sm"
              >
                HOT
              </span>
            )}

            {product.is_best_seller && (
              <span
                title="Bán từ 20 sản phẩm trong 30 ngày gần nhất"
                className="rounded-md bg-violet-600 px-2 py-1 text-xs font-black text-white shadow-sm"
              >
                Bán chạy
              </span>
            )}

            {product.is_new && (
              <span
                title="Sản phẩm mới trong 7 ngày gần nhất"
                className="rounded-md bg-green-700 px-2 py-1 text-xs font-black text-white shadow-sm"
              >
                Mới
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="min-w-0 p-3">
        <Link to={productUrl} title={productTitle} aria-label={productTitle}>
          <h3 className="whitespace-normal wrap-break-word text-sm font-black leading-5 text-slate-900 hover:text-green-700 sm:text-base">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1 text-[10px] sm:text-xs">
          {rating.total > 0 ? (
            <>
              <Star
                size={14}
                aria-hidden="true"
                className="fill-amber-400 text-amber-400"
              />

              <span className="font-black text-slate-700">
                {rating.average.toFixed(1)}
              </span>

              <span className="whitespace-normal wrap-break-word text-slate-400">({rating.total} đánh giá)</span>
            </>
          ) : (
            <span className="font-bold text-slate-400">Chưa có đánh giá</span>
          )}
        </div>

        <p
          title={formatSoldQuantity(product)}
          className="mt-1 text-xs font-bold text-slate-400"
        >
          {formatSoldQuantity(product)}
        </p>

        <div className="mt-2 flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="whitespace-normal wrap-break-word text-base font-black text-green-700 sm:text-lg">
              {finalPriceText}
            </p>

            {oldPriceText && (
              <p className="text-xs font-semibold text-slate-400 line-through">
                {oldPriceText}
              </p>
            )}
          </div>

          <button
            type="button"
            title={`Thêm ${product.name} vào giỏ hàng`}
            aria-label={`Thêm ${product.name} vào giỏ hàng`}
            disabled={adding}
            onClick={() => addToCart(product)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-green-200 text-green-700 transition hover:bg-green-700 hover:text-white disabled:cursor-wait disabled:opacity-60"
          >
            <ShoppingCart size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
