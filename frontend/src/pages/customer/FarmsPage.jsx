import { useEffect, useState } from "react";

import { Building2, MapPin, Package, Search } from "lucide-react";

import { Link } from "react-router-dom";

import useFarm from "@/hooks/useFarm";
import useDebounce from "@/hooks/useDebounce";

import Pagination from "@/components/common/Pagination";

import { getImageUrl } from "@/utils/image";

export default function FarmsPage() {
  const { publicFarms, publicMeta, publicLoading, getAll } = useFarm();

  const [params, setParams] = useState({
    page: 1,
    limit: 12,
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
    <div className="space-y-6">
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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="h-80 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      ) : publicFarms.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <Building2 size={48} className="mx-auto text-slate-300" />

          <p className="mt-4 font-semibold text-slate-600">
            Không tìm thấy nông trại nào.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {publicFarms.map((farm) => (
            <Link
              key={farm.id}
              to={`/farms/${farm.slug}`}
              className="
                group
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
              <div className="relative h-44 overflow-hidden bg-green-50">
                {farm.cover_image ? (
                  <img
                    src={getImageUrl(farm.cover_image)}
                    alt={farm.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-green-300">
                    <Building2 size={52} />
                  </div>
                )}

                <div className="absolute -bottom-7 left-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-green-100">
                  {farm.logo ? (
                    <img
                      src={getImageUrl(farm.logo)}
                      alt={farm.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2 size={28} className="text-green-600" />
                  )}
                </div>
              </div>

              <div className="px-5 pb-5 pt-10">
                <h2 className="line-clamp-1 text-lg font-extrabold text-slate-900">
                  {farm.name}
                </h2>

                <div className="mt-3 flex items-start gap-2 text-sm text-slate-500">
                  <MapPin size={17} className="mt-0.5 shrink-0" />

                  <span className="line-clamp-2">
                    {farm.address || "Chưa cập nhật địa chỉ"}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm text-slate-500">
                    {farm.seller?.name || "Chủ nông trại"}
                  </span>

                  <span className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-700">
                    <Package size={15} />
                    {farm.product_count ?? 0}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination meta={publicMeta} params={params} setParams={setParams} />
    </div>
  );
}
