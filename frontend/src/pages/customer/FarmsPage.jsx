// src/pages/customer/FarmsPage.jsx

import { useEffect, useState } from "react";
import { MapPin, Package, Search, Star, Store } from "lucide-react";
import { Link } from "react-router-dom";

import useFarm from "@/hooks/useFarm";
import useDebounce from "@/hooks/useDebounce";

import Pagination from "@/components/common/Pagination";

import { getImageUrl } from "@/utils/image";

function getFarmRating(farm) {
  const average = Number(
    farm?.rating?.average ?? farm?.rating_avg ?? farm?.average_rating ?? 0,
  );

  const total = Number(
    farm?.rating?.total ?? farm?.review_count ?? farm?.reviews_count ?? 0,
  );

  return {
    average: Number.isFinite(average) ? average : 0,
    total: Number.isFinite(total) ? total : 0,
  };
}

export default function FarmsPage() {
  const { publicFarms, publicMeta, publicLoading, getAll } = useFarm();

  const [params, setParams] = useState({
    page: 1,
    limit: 20,
    keyword: "",
  });

  const debouncedKeyword = useDebounce(params.keyword, 500);

  useEffect(() => {
    getAll({
      page: params.page,
      limit: params.limit,
      keyword: debouncedKeyword,
    }).catch(() => {});
  }, [getAll, params.page, params.limit, debouncedKeyword]);

  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <div className="rounded-3xl bg-linear-to-r from-green-700 to-green-500 px-5 py-10 text-white sm:px-8">
        <h1 className="text-3xl font-extrabold sm:text-4xl">
          Nông trại hữu cơ
        </h1>

        <p className="mt-2 max-w-2xl text-green-50">
          Khám phá những nông trại đang hoạt động trên hệ thống GreenFarm.
        </p>

        <div className="relative mt-6 max-w-2xl">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={params.keyword}
            placeholder="Tìm theo tên, địa chỉ hoặc mô tả..."
            onChange={(event) =>
              setParams((previous) => ({
                ...previous,
                keyword: event.target.value,
                page: 1,
              }))
            }
            className="
              min-h-13
              w-full
              rounded-2xl
              border-0
              bg-white
              pl-12
              pr-4
              text-slate-800
              outline-none
              ring-green-200
              focus:ring-4
            "
          />
        </div>
      </div>

      {publicLoading ? (
        <div className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[...Array(10)].map((_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-2xl bg-slate-200 sm:h-80"
            />
          ))}
        </div>
      ) : publicFarms.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <Store size={48} className="mx-auto text-slate-300" />

          <p className="mt-4 font-semibold text-slate-600">
            Không tìm thấy nông trại nào.
          </p>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {publicFarms.map((farm) => {
            const rating = getFarmRating(farm);

            return (
              <Link
                key={farm.id}
                to={`/farms/${farm.slug}`}
                title={`Xem nông trại ${farm.name}`}
                aria-label={`Xem thông tin nông trại ${farm.name}`}
                className="
                  group
                  min-w-0
                  overflow-hidden
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  shadow-sm
                  transition
                  hover:-translate-y-1
                  hover:shadow-lg
                "
              >
                <div className="relative h-32 overflow-hidden bg-[#eef8e8] sm:h-44">
                  {farm.cover_image ? (
                    <img
                      src={getImageUrl(farm.cover_image)}
                      alt={`Ảnh bìa ${farm.name}`}
                      title={`Ảnh bìa ${farm.name}`}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      title={`${farm.name} chưa cập nhật ảnh bìa`}
                      className="grid h-full w-full place-items-center"
                    >
                      <Store
                        size={42}
                        className="text-green-700 sm:h-13 sm:w-13"
                      />
                    </div>
                  )}

                  <div
                    title={`Logo ${farm.name}`}
                    className="absolute bottom-2 left-2 flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white shadow-md sm:bottom-4 sm:left-4 sm:h-16 sm:w-16 sm:rounded-2xl sm:border-4"
                  >
                    {farm.logo ? (
                      <img
                        src={getImageUrl(farm.logo)}
                        alt={`Logo ${farm.name}`}
                        title={`Logo ${farm.name}`}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <Store
                        size={22}
                        className="text-green-600 sm:h-7 sm:w-7"
                      />
                    )}
                  </div>

                  <div
                    title={
                      rating.total > 0
                        ? `${rating.average.toFixed(1)}/5 từ ${rating.total} đánh giá`
                        : "Nông trại chưa có đánh giá"
                    }
                    className="absolute right-2 top-2 inline-flex max-w-[calc(100%-3.75rem)] items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-extrabold text-amber-600 shadow-sm backdrop-blur sm:right-4 sm:top-4 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-sm"
                  >
                    <Star
                      size={13}
                      className="shrink-0 fill-amber-400 text-amber-400 sm:h-4 sm:w-4"
                    />

                    <span className="whitespace-normal wrap-break-word">
                      {rating.total > 0 ? rating.average.toFixed(1) : "Chưa có"}
                    </span>
                  </div>
                </div>

                <div className="min-w-0 p-3 sm:p-5">
                  <h2
                    title={farm.name}
                    className="whitespace-normal wrap-break-word text-sm font-extrabold leading-5 text-slate-900 transition-colors group-hover:text-green-700 sm:text-lg sm:leading-7"
                  >
                    {farm.name}
                  </h2>

                  <div className="mt-2 flex items-start gap-1.5 text-xs text-slate-500 sm:mt-3 sm:gap-2 sm:text-sm">
                    <MapPin
                      size={15}
                      className="mt-0.5 shrink-0 sm:h-4.25 sm:w-4.25"
                    />

                    <span
                      title={farm.address || "Chưa cập nhật địa chỉ"}
                      className="whitespace-normal wrap-break-word"
                    >
                      {farm.address || "Chưa cập nhật địa chỉ"}
                    </span>
                  </div>

                  <div className="mt-3 flex min-w-0 flex-col gap-2 border-t border-slate-100 pt-3 sm:mt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-4">
                    <div className="min-w-0">
                      <p
                        title={`Chủ nông trại: ${farm.seller?.name || "Chưa cập nhật"}`}
                        className="whitespace-normal wrap-break-word text-xs font-semibold text-slate-600 sm:text-sm"
                      >
                        {farm.seller?.name || "Chủ nông trại"}
                      </p>

                      <div
                        title={
                          rating.total > 0
                            ? `${rating.average.toFixed(1)}/5 từ ${rating.total} đánh giá`
                            : "Nông trại chưa có đánh giá"
                        }
                        className="mt-1 flex min-w-0 items-center gap-1 text-[10px] text-slate-500 sm:text-xs"
                      >
                        <Star
                          size={12}
                          className="shrink-0 fill-amber-400 text-amber-400 sm:h-3.5 sm:w-3.5"
                        />

                        {rating.total > 0 ? (
                          <>
                            <span className="shrink-0 font-bold text-slate-700">
                              {rating.average.toFixed(1)}
                            </span>

                            <span className="whitespace-normal wrap-break-word">
                              ({rating.total} đánh giá)
                            </span>
                          </>
                        ) : (
                          <span className="whitespace-normal wrap-break-word">Chưa có đánh giá</span>
                        )}
                      </div>
                    </div>

                    <span
                      title={`${farm.product_count ?? 0} sản phẩm đang bán`}
                      className="flex w-fit shrink-0 items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 sm:px-3 sm:text-sm"
                    >
                      <Package size={14} className="sm:h-3.75 sm:w-3.75" />
                      {farm.product_count ?? 0}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="min-w-0 max-w-full overflow-hidden">
        <Pagination meta={publicMeta} params={params} setParams={setParams} />
      </div>
    </div>
  );
}
