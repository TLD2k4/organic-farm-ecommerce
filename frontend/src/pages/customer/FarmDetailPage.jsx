import { useEffect } from "react";

import {
  Award,
  Building2,
  MapPin,
  Package,
  Phone,
  Star,
  User,
} from "lucide-react";

import { useParams } from "react-router-dom";

import useFarm from "@/hooks/useFarm";

import { getImageUrl } from "@/utils/image";

function formatMoney(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return Number(value).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
}

export default function FarmDetailPage() {
  const { slug } = useParams();

  const { publicFarm, publicDetailLoading, getBySlug, clearPublicFarm } =
    useFarm();

  useEffect(() => {
    if (slug) {
      getBySlug(slug).catch(() => {});
    }

    return () => {
      clearPublicFarm();
    };
  }, [slug, getBySlug, clearPublicFarm]);

  if (publicDetailLoading) {
    return (
      <div className="space-y-5">
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

  const products = Array.isArray(farm.products) ? farm.products : [];

  const certifications = Array.isArray(farm.certifications)
    ? farm.certifications
    : [];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-green-100">
        <div className="h-64 sm:h-80">
          {farm.cover_image ? (
            <img
              src={getImageUrl(farm.cover_image)}
              alt={farm.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-green-300">
              <Building2 size={80} />
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 flex items-end gap-4 p-5 text-white sm:p-8">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white text-green-600 sm:h-24 sm:w-24">
            {farm.logo ? (
              <img
                src={getImageUrl(farm.logo)}
                alt={farm.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 size={38} />
            )}
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold sm:text-4xl">{farm.name}</h1>

            <p className="mt-1 flex items-center gap-2 text-sm text-slate-100">
              <MapPin size={16} />
              {farm.address}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-extrabold">Giới thiệu nông trại</h2>

            <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">
              {farm.description || "Nông trại chưa cập nhật mô tả."}
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold">Sản phẩm</h2>

              <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-700">
                {farm.product_count ?? products.length} sản phẩm
              </span>
            </div>

            {products.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                Nông trại chưa có sản phẩm đang bán.
              </div>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => {
                  const productImage =
                    product.thumbnail || product.image || product.cover_image;

                  const displayPrice = product.sale_price ?? product.price;

                  return (
                    <div
                      key={product.id}
                      className="overflow-hidden rounded-2xl border border-slate-200"
                    >
                      <div className="h-40 bg-slate-100">
                        {productImage ? (
                          <img
                            src={getImageUrl(productImage)}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-slate-300">
                            <Package size={42} />
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="line-clamp-2 font-bold">
                          {product.name}
                        </h3>

                        {formatMoney(displayPrice) && (
                          <p className="mt-2 font-extrabold text-green-700">
                            {formatMoney(displayPrice)}
                          </p>
                        )}

                        <div className="mt-3 flex items-center gap-1 text-sm text-yellow-600">
                          <Star size={16} fill="currentColor" />

                          <span>{product.rating?.average ?? 0}</span>

                          <span className="text-slate-400">
                            ({product.rating?.total ?? 0})
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5">
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
