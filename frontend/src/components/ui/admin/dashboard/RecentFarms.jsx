import dayjs from "dayjs";

import { Building2 } from "lucide-react";
import { Link } from "react-router-dom";

import { getImageUrl } from "@/utils/image";
import { getAdminFarmLink } from "@/utils/adminEntityLink";

const farmStatusConfig = {
  0: {
    label: "Chờ duyệt",
    className: "bg-yellow-100 text-yellow-700",
  },
  1: {
    label: "Đã duyệt",
    className: "bg-green-100 text-green-700",
  },
  2: {
    label: "Từ chối",
    className: "bg-red-100 text-red-700",
  },
  3: {
    label: "Đình chỉ",
    className: "bg-slate-200 text-slate-700",
  },
};

const formatDate = (value) => {
  return value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "—";
};

export default function RecentFarms({ farms = [], loading = false }) {
  if (loading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4 sm:p-5">
        <h2 className="text-lg font-bold text-slate-900">Nông trại mới nhất</h2>

        <p className="mt-1 text-sm text-slate-500">
          5 nông trại đăng ký gần đây
        </p>
      </div>

      {!farms.length ? (
        <div className="px-4 py-12 text-center text-slate-500">
          Chưa có nông trại.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {farms.map((farm) => {
            const status = farmStatusConfig[farm.status] || farmStatusConfig[0];
            const farmLink = getAdminFarmLink(farm);

            return (
              <div
                key={farm.id}
                className="flex items-start gap-3 p-4 transition hover:bg-slate-50 sm:p-5"
              >
                {farm.logo ? (
                  <img
                    src={getImageUrl(farm.logo)}
                    alt={farm.name}
                    className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                    <Building2 size={22} />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      {farmLink ? (
                        <Link to={farmLink.to} title={farmLink.title} className={`block truncate font-semibold hover:underline ${farmLink.isPublic ? "text-slate-900 entity-name-link entity-name-link-public" : "text-slate-900 entity-name-link entity-name-link-management"}`}>
                          {farm.name}
                        </Link>
                      ) : (
                        <p className="truncate font-semibold text-slate-900">
                          {farm.name}
                        </p>
                      )}

                      <p className="mt-0.5 truncate text-sm text-slate-500">
                        {farm.seller?.name || "Không xác định"}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {farm.seller?.email || "—"}
                      </p>
                    </div>

                    <span
                      className={`
                        inline-flex
                        w-fit
                        shrink-0
                        rounded-full
                        px-3
                        py-1
                        text-xs
                        font-semibold

                        ${status.className}
                      `}
                    >
                      {status.label}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Đăng ký: {formatDate(farm.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
