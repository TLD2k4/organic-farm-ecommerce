import { Building2, Trophy } from "lucide-react";

import { getImageUrl } from "@/utils/image";

const formatNumber = (value) => {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

export default function TopFarmsTable({ farms = [], loading = false }) {
  if (loading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />;
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Building2 size={21} className="text-blue-600" />

          <h2 className="text-lg font-bold text-slate-900">
            Nông trại doanh thu cao
          </h2>
        </div>

        <p className="mt-1 text-sm text-slate-500">
          Xếp hạng doanh thu theo từng nông trại
        </p>
      </div>

      {!farms.length ? (
        <div className="px-4 py-12 text-center text-slate-500">
          Chưa có dữ liệu nông trại.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-bold">
                  Hạng
                </th>

                <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-bold">
                  Nông trại
                </th>

                <th className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold">
                  Đơn con
                </th>

                <th className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold">
                  Tiền sản phẩm
                </th>

                <th className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold">
                  Phí vận chuyển
                </th>

                <th className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold">
                  Tổng doanh thu
                </th>
              </tr>
            </thead>

            <tbody>
              {farms.map((farm, index) => (
                <tr
                  key={`${farm.farm_id}-${index}`}
                  className="border-t border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {index < 3 && (
                        <Trophy
                          size={16}
                          className={
                            index === 0
                              ? "text-amber-500"
                              : index === 1
                                ? "text-slate-500"
                                : "text-orange-500"
                          }
                        />
                      )}

                      <span className="font-bold">#{index + 1}</span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex min-w-[220px] items-center gap-3">
                      {farm.logo ? (
                        <img
                          src={getImageUrl(farm.logo)}
                          alt={farm.farm_name}
                          className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                          <Building2 size={20} />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="max-w-[230px] break-words font-semibold">
                          {farm.farm_name}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          ID: #{farm.farm_id}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-right font-semibold">
                    {formatNumber(farm.sub_order_count)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-right">
                    {formatCurrency(farm.items_revenue)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-right">
                    {formatCurrency(farm.shipping_revenue)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-right font-bold text-green-700">
                    {formatCurrency(farm.total_revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
