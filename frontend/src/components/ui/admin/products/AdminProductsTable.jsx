import {
  BadgeCheck,
  Eye,
  FileClock,
  PackageCheck,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import ConfirmButton from "@/components/common/ConfirmButton";
import StatusBadge from "@/components/common/StatusBadge";

import { getImageUrl } from "@/utils/image";
import { highlight } from "@/utils/highlight";
import {
  getAdminFarmLink,
  getAdminProductLink,
} from "@/utils/adminEntityLink";

const productStatusConfig = {
  0: {
    label: "Chờ duyệt",
    className: "bg-amber-100 text-amber-700",
  },
  1: {
    label: "Đang bán",
    className: "bg-green-100 text-green-700",
  },
  2: {
    label: "Bị từ chối",
    className: "bg-red-100 text-red-700",
  },
  3: {
    label: "Tạm ẩn",
    className: "bg-slate-200 text-slate-700",
  },
};

const certificateStatusConfig = {
  0: {
    label: "Chờ duyệt",
    className: "bg-amber-100 text-amber-700",
  },
  1: {
    label: "Đã duyệt",
    className: "bg-green-100 text-green-700",
  },
  2: {
    label: "Bị từ chối",
    className: "bg-red-100 text-red-700",
  },
  3: {
    label: "Hết hạn",
    className: "bg-orange-100 text-orange-700",
  },
  4: {
    label: "Đã thay thế",
    className: "bg-slate-200 text-slate-700",
  },
};

function formatMoney(value) {
  return Number(value ?? 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
}

export default function AdminProductsTable({
  products,
  loading,
  keyword,
  actionLoading,
  onView,
  onApproveProduct,
  onRejectProduct,
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-xl bg-slate-200"
          />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-14 text-center text-slate-500">
        <PackageCheck
          size={48}
          className="mx-auto mb-3 text-slate-300"
        />
        Không có sản phẩm phù hợp với bộ lọc.
      </div>
    );
  }

  return (
    <div className="max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px]">
          <thead className="bg-slate-100">
            <tr>
              <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-bold">
                Sản phẩm
              </th>
              <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-bold">
                Nông trại / Seller
              </th>
              <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-bold">
                Danh mục
              </th>
              <th className="whitespace-nowrap px-4 py-4 text-right text-sm font-bold">
                Giá
              </th>
              <th className="whitespace-nowrap px-4 py-4 text-center text-sm font-bold">
                Sản phẩm
              </th>
              <th className="whitespace-nowrap px-4 py-4 text-center text-sm font-bold">
                Hồ sơ gần nhất
              </th>
              <th className="whitespace-nowrap px-4 py-4 text-center text-sm font-bold">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => {
              const latestCertificate = product.latest_certificate;
              const productLink = getAdminProductLink(product);
              const farmLink = getAdminFarmLink(product.farm);
              const canReviewProduct =
                !product.deleted_at && Number(product.status) === 0;

              return (
                <tr
                  key={product.id}
                  className="border-t border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="px-4 py-4">
                    <div className="flex min-w-64 items-center gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-green-50">
                        {product.thumbnail ? (
                          <img
                            src={getImageUrl(product.thumbnail)}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-green-600">
                            <PackageCheck size={24} />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        {productLink?.isPublic ? (
                          <Link to={productLink.to} title={productLink.title} className="block max-w-64 truncate font-bold text-slate-900 hover:text-green-700 hover:underline">
                            {highlight(product.name, keyword)}
                          </Link>
                        ) : (
                          <button type="button" title={productLink?.title} onClick={() => onView(product)} className="block max-w-64 truncate text-left font-bold text-slate-900 hover:text-sky-600 hover:underline">
                            {highlight(product.name, keyword)}
                          </button>
                        )}
                        <p className="mt-1 text-xs text-slate-500">
                          {product.code} · #{product.id}
                        </p>
                        {product.is_hot && (
                          <span className="mt-1 inline-flex rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-600">
                            Nổi bật
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="max-w-64">
                      {farmLink ? (
                        <Link to={farmLink.to} title={farmLink.title} className={`block truncate font-semibold hover:underline ${farmLink.isPublic ? "text-slate-800 hover:text-green-700" : "text-slate-800 hover:text-sky-600"}`}>
                          {highlight(product.farm?.name || "—", keyword)}
                        </Link>
                      ) : (
                        <p className="truncate font-semibold text-slate-800">
                          {highlight(product.farm?.name || "—", keyword)}
                        </p>
                      )}
                      <p className="mt-1 truncate text-sm text-slate-500">
                        {highlight(
                          product.farm?.seller?.name || "Chưa có seller",
                          keyword,
                        )}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {product.farm?.seller?.email || "—"}
                      </p>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                      {product.category?.name || "—"}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-right">
                    <p className="font-bold text-green-700">
                      {formatMoney(
                        product.sale_price ?? product.price,
                      )}
                    </p>
                    {product.sale_price !== null && (
                      <p className="text-xs text-slate-400 line-through">
                        {formatMoney(product.price)}
                      </p>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-center">
                    <StatusBadge
                      status={product.status}
                      deletedAt={product.deleted_at}
                      config={productStatusConfig}
                    />
                    {product.is_sellable && (
                      <p className="mt-1 text-xs font-semibold text-green-600">
                        Đủ điều kiện bán
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-4 text-center">
                    {latestCertificate ? (
                      <div className="flex flex-col items-center gap-1">
                        <StatusBadge
                          status={latestCertificate.display_status}
                          deletedAt={latestCertificate.deleted_at}
                          config={certificateStatusConfig}
                        />
                        <p className="max-w-44 truncate text-xs text-slate-500">
                          {latestCertificate.certification_name ||
                            "Không rõ loại"}
                        </p>
                        {product.pending_certificate_count > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                            <FileClock size={13} />
                            {product.pending_certificate_count} hồ sơ chờ
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">
                        Chưa có hồ sơ
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex min-w-max items-center justify-center gap-2">
                      <button
                        type="button"
                        title="Xem chi tiết"
                        onClick={() => onView(product)}
                        className="rounded-lg bg-sky-500 p-2 text-white transition hover:bg-sky-600"
                      >
                        <Eye size={16} />
                      </button>

                      {canReviewProduct && (
                        <>
                          <ConfirmButton
                            title="Duyệt sản phẩm này? Nếu chưa có chứng chỉ hợp lệ, hồ sơ chờ duyệt mới nhất cũng sẽ được duyệt."
                            tooltip="Duyệt sản phẩm"
                            type="success"
                            onConfirm={() =>
                              onApproveProduct(product)
                            }
                          >
                            <span
                              className={`inline-flex rounded-lg bg-green-600 p-2 text-white transition hover:bg-green-700 ${
                                actionLoading
                                  ? "pointer-events-none opacity-60"
                                  : "cursor-pointer"
                              }`}
                            >
                              <BadgeCheck size={16} />
                            </span>
                          </ConfirmButton>

                          <button
                            type="button"
                            title="Từ chối sản phẩm"
                            disabled={actionLoading}
                            onClick={() => onRejectProduct(product)}
                            className="rounded-lg bg-red-500 p-2 text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
