import { Tags, Trophy } from "lucide-react";

const formatNumber = (value, maximumFractionDigits = 0) => {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits,
  }).format(Number(value || 0));
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

export default function TopCategoriesTable({
  categories = [],
  loading = false,
}) {
  if (loading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />;
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Tags size={21} className="text-green-600" />

          <h2 className="text-lg font-bold text-slate-900">
            Danh mục bán chạy
          </h2>
        </div>

        <p className="mt-1 text-sm text-slate-500">
          Xếp hạng danh mục theo doanh thu
        </p>
      </div>

      {!categories.length ? (
        <div className="px-4 py-12 text-center text-slate-500">
          Chưa có dữ liệu danh mục.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-slate-50">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-bold">
                  Hạng
                </th>

                <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-bold">
                  Danh mục
                </th>

                <th className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold">
                  Số lượng bán
                </th>

                <th className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold">
                  Số đơn
                </th>

                <th className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold">
                  Doanh thu
                </th>
              </tr>
            </thead>

            <tbody>
              {categories.map((category, index) => (
                <tr
                  key={`${category.category_id}-${index}`}
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
                    <p className="max-w-[220px] break-words font-semibold">
                      {category.category_name}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-right font-semibold">
                    {formatNumber(category.quantity_sold, 2)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-right">
                    {formatNumber(category.order_count)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-right font-bold text-green-700">
                    {formatCurrency(category.revenue)}
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
