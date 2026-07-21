import { ImageIcon, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

import { getImageUrl } from "@/utils/image";
import { getAdminProductLink } from "@/utils/adminEntityLink";
import { getRankBadgeClass } from "@/utils/rank";

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

export default function TopProductsTable({ products = [], loading = false }) {
  if (loading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />;
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Trophy size={21} className="text-amber-500" />

          <h2 className="text-lg font-bold text-slate-900">
            Sản phẩm bán chạy
          </h2>
        </div>

        <p className="mt-1 text-sm text-slate-500">
          Xếp hạng theo số lượng sản phẩm đã bán
        </p>
      </div>

      {!products.length ? (
        <div className="px-4 py-12 text-center text-slate-500">
          Chưa có sản phẩm phát sinh doanh thu.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-212.5">
            <thead className="bg-slate-50">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-bold">
                  Hạng
                </th>

                <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-bold">
                  Sản phẩm
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
              {products.map((product, index) => {
                const productLink = getAdminProductLink(product);

                return <tr
                  key={`${product.product_id}-${index}`}
                  className="border-t border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-black ${getRankBadgeClass(index + 1)}`}
                    >
                      {index + 1}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex min-w-57.5 items-center gap-3">
                      {product.product_image ? (
                        <img
                          src={getImageUrl(product.product_image)}
                          alt={product.product_name}
                          className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                          <ImageIcon size={20} />
                        </div>
                      )}

                      <div className="min-w-0">
                        {productLink ? (
                          <Link
                            to={productLink.to}
                            title={productLink.title}
                            className={`block max-w-65 wrap-break-word font-semibold hover:underline ${productLink.isPublic ? "text-slate-900 entity-name-link entity-name-link-public" : "text-slate-900 entity-name-link entity-name-link-management"}`}
                          >
                            {product.product_name}
                          </Link>
                        ) : (
                          <p className="max-w-65 wrap-break-word font-semibold text-slate-900">
                            {product.product_name}
                          </p>
                        )}

                        <p className="mt-0.5 text-xs text-slate-500">
                          ID: #{product.product_id}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-right font-semibold">
                    {formatNumber(product.quantity_sold, 2)} {product.unit}
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-right">
                    {formatNumber(product.order_count)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-right font-bold text-green-700">
                    {formatCurrency(product.revenue)}
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
