import { Boxes, ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { getImageUrl } from "@/utils/image";
import { getAdminFarmLink, getAdminProductLink } from "@/utils/adminEntityLink";
import { getRankBadgeClass } from "@/utils/rank";

const formatNumber = (value, maximumFractionDigits = 2) =>
  new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits,
  }).format(Number(value || 0));

export default function TopStockProductsTable({
  products = [],
  loading = false,
}) {
  if (loading) {
    return <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />;
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Boxes size={21} className="text-sky-600" />
          <h2 className="text-lg font-bold text-slate-900">
            Sản phẩm còn tồn kho nhiều nhất
          </h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Xếp hạng trực tiếp theo tồn kho hiện tại của sản phẩm đang bán; không
          lưu thêm bảng hay cột thống kê.
        </p>
      </div>

      {!products.length ? (
        <div className="px-4 py-12 text-center text-slate-500">
          Chưa có sản phẩm đang bán còn tồn kho.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-170">
            <thead className="bg-slate-50">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-bold">
                  Hạng
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-bold">
                  Sản phẩm
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-bold">
                  Nông trại
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold">
                  Số lượng còn lại
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => {
                const productLink = getAdminProductLink(product);
                const farmLink = getAdminFarmLink({
                  id: product.farm_id,
                  name: product.farm_name,
                  slug: product.farm_slug,
                  status: 1,
                  deleted_at: null,
                });
                const rank = index + 1;

                return (
                  <tr
                    key={`${product.product_id}-${index}`}
                    className="border-t border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-black ${getRankBadgeClass(rank)}`}
                      >
                        {rank}
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
                              className={`block max-w-65 wrap-break-word font-semibold text-slate-900 hover:underline ${
                                productLink.isPublic
                                  ? "entity-name-link entity-name-link-public"
                                  : "entity-name-link entity-name-link-management"
                              }`}
                            >
                              {product.product_name}
                            </Link>
                          ) : (
                            <p className="max-w-65 wrap-break-word font-semibold text-slate-900">
                              {product.product_name}
                            </p>
                          )}
                          <p className="mt-0.5 text-xs text-slate-500">
                            SP{String(product.product_id).padStart(6, "0")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-700">
                      {farmLink ? (
                        <Link
                          to={farmLink.to}
                          title={farmLink.title}
                          className={`hover:underline ${
                            farmLink.isPublic
                              ? "entity-name-link entity-name-link-public"
                              : "entity-name-link entity-name-link-management"
                          }`}
                        >
                          {product.farm_name || "—"}
                        </Link>
                      ) : (
                        product.farm_name || "—"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right font-bold text-sky-700">
                      {formatNumber(product.stock_quantity)} {product.unit}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
