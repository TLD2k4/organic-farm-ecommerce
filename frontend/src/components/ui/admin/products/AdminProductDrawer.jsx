import { useEffect } from "react";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  ExternalLink,
  FileCheck2,
  FileText,
  ImageIcon,
  History,
  LockKeyhole,
  LockKeyholeOpen,
  Package,
  Store,
  User,
  X,
} from "lucide-react";

import useAdminProduct from "@/hooks/useAdminProduct";

import ConfirmButton from "@/components/common/ConfirmButton";
import StatusBadge from "@/components/common/StatusBadge";

import { getImageUrl } from "@/utils/image";
import { formatDate } from "@/utils/date";

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

function formatDateOnly(value) {
  if (!value) return "—";

  return new Date(`${value}T00:00:00`).toLocaleDateString(
    "vi-VN",
  );
}

function getFileUrl(path) {
  if (!path) return null;

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl = String(
    import.meta.env.VITE_API_BASE_URL || "",
  ).replace(/\/$/, "");

  if (path.startsWith("/storage/")) {
    return `${baseUrl}${path}`;
  }

  if (path.startsWith("storage/")) {
    return `${baseUrl}/${path}`;
  }

  return `${baseUrl}/storage/${path.replace(/^\//, "")}`;
}

export default function AdminProductDrawer({
  open,
  productId,
  highlightCertificateId = null,
  actionLoading = false,
  onClose,
  onApproveProduct,
  onRejectProduct,
  onSuspendProduct,
  onReopenProduct,
  onApproveCertificate,
  onRejectCertificate,
}) {
  const { product, detailLoading, getById } =
    useAdminProduct();

  useEffect(() => {
    if (open && productId) {
      getById(productId).catch(() => {});
    }
  }, [open, productId, getById]);

  useEffect(() => {
    if (!open || !product || !highlightCertificateId) {
      return;
    }

    const timer = window.setTimeout(() => {
      document
        .getElementById(`certificate-${highlightCertificateId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [open, product, highlightCertificateId]);

  if (!open) {
    return null;
  }

  const canReviewProduct =
    product &&
    !product.deleted_at &&
    Number(product.status) === 0;

  return (
    <div className="fixed inset-0 z-60">
      <button
        type="button"
        aria-label="Đóng chi tiết sản phẩm"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-3xl overflow-y-auto overscroll-contain bg-white shadow-xl">
        <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200 bg-white p-4 sm:p-5">
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">
              Kiểm duyệt sản phẩm
            </h2>
            <p className="mt-1 truncate text-sm text-slate-500">
              {product?.name || "Đang tải dữ liệu..."}
            </p>
          </div>

          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 transition hover:bg-slate-100"
          >
            <X size={21} />
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {detailLoading || !product ? (
            <div className="animate-pulse space-y-5">
              <div className="h-56 rounded-2xl bg-slate-200" />
              <div className="h-8 w-2/3 rounded bg-slate-200" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="h-28 rounded-xl bg-slate-200" />
                <div className="h-28 rounded-xl bg-slate-200" />
              </div>
              <div className="h-56 rounded-2xl bg-slate-200" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    status={product.status}
                    deletedAt={product.deleted_at}
                    config={productStatusConfig}
                  />

                  {product.is_sellable && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                      <BadgeCheck size={14} />
                      Đủ điều kiện bán
                    </span>
                  )}
                </div>

                {canReviewProduct && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <ConfirmButton
                      title="Duyệt sản phẩm? Nếu sản phẩm chưa có chứng chỉ hợp lệ, hồ sơ chờ duyệt mới nhất cũng sẽ được duyệt."
                      tooltip="Duyệt sản phẩm"
                      type="success"
                      onConfirm={() => onApproveProduct(product)}
                    >
                      <span
                        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700 ${
                          actionLoading
                            ? "pointer-events-none opacity-60"
                            : "cursor-pointer"
                        }`}
                      >
                        <BadgeCheck size={17} />
                        Duyệt sản phẩm
                      </span>
                    </ConfirmButton>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => onRejectProduct(product)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                    >
                      <X size={17} />
                      Từ chối
                    </button>
                  </div>
                )}

                {!canReviewProduct && !product.deleted_at && [1, 3].includes(Number(product.status)) && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {product.admin_locked_at ? (
                      <button type="button" disabled={actionLoading} onClick={() => onReopenProduct(product)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700 disabled:opacity-60">
                        <LockKeyholeOpen size={17} /> Mở lại sản phẩm
                      </button>
                    ) : (
                      <button type="button" disabled={actionLoading} onClick={() => onSuspendProduct(product)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                        <LockKeyhole size={17} /> Đình chỉ sản phẩm
                      </button>
                    )}
                  </div>
                )}
              </div>

              <section>
                <h3 className="mb-3 text-base font-extrabold text-slate-900">
                  Hình ảnh sản phẩm
                </h3>

                {product.images?.length ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {product.images.map((image) => (
                      <a
                        key={image.id}
                        href={getImageUrl(image.image_url)}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                      >
                        <img
                          src={getImageUrl(image.image_url)}
                          alt={product.name}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                        <span className="absolute bottom-2 right-2 rounded-lg bg-black/60 p-1.5 text-white">
                          <ExternalLink size={14} />
                        </span>
                      </a>
                    ))}
                  </div>
                ) : product.thumbnail ? (
                  <a
                    href={getImageUrl(product.thumbnail)}
                    target="_blank"
                    rel="noreferrer"
                    className="block aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                  >
                    <img
                      src={getImageUrl(product.thumbnail)}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </a>
                ) : (
                  <div className="flex h-44 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <ImageIcon size={48} />
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <h3 className="text-base font-extrabold text-slate-900">
                  Thông tin sản phẩm
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoCard
                    icon={Package}
                    label="Mã sản phẩm"
                    value={`${product.code} · #${product.id}`}
                  />
                  <InfoCard
                    icon={Store}
                    label="Nông trại"
                    value={product.farm?.name}
                  />
                  <InfoCard
                    icon={User}
                    label="Chủ nông trại"
                    value={product.farm?.seller?.name}
                    subValue={product.farm?.seller?.email}
                  />
                  <InfoCard
                    icon={Building2}
                    label="Danh mục"
                    value={product.category?.name}
                  />
                  <InfoCard
                    icon={Package}
                    label="Giá bán"
                    value={formatMoney(
                      product.sale_price ?? product.price,
                    )}
                    subValue={
                      product.sale_price !== null
                        ? `Giá gốc: ${formatMoney(product.price)}`
                        : null
                    }
                  />
                  <InfoCard
                    icon={Package}
                    label="Tồn kho"
                    value={`${product.stock_quantity} ${product.unit}`}
                  />
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-500">
                    Mô tả
                  </p>
                  <p className="mt-2 whitespace-pre-wrap wrap-break-word text-slate-800">
                    {product.description || "—"}
                  </p>
                </div>

                {product.rejection_reason && (
                  <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-red-700">
                    <p className="font-bold">Lý do từ chối sản phẩm</p>
                    <p className="mt-1 whitespace-pre-wrap wrap-break-word">
                      {product.rejection_reason}
                    </p>
                  </div>
                )}

                {product.admin_locked_at && (
                  <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-red-700">
                    <p className="font-bold">Sản phẩm bị đình chỉ</p>
                    <p className="mt-1 whitespace-pre-wrap wrap-break-word">{product.admin_lock_reason || "Không có lý do."}</p>
                    <p className="mt-2 text-sm font-semibold">Bởi {product.admin_locker?.name || "Quản trị viên"} · {formatDate(product.admin_locked_at)}</p>
                  </div>
                )}

                <div className="grid gap-3 text-sm sm:grid-cols-3">
                  <DateInfo
                    label="Ngày tạo"
                    value={product.created_at}
                  />
                  <DateInfo
                    label="Cập nhật"
                    value={product.updated_at}
                  />
                  <DateInfo
                    label="Kiểm duyệt"
                    value={product.approved_at}
                  />
                </div>
              </section>

              <section>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                    <History size={19} className="text-sky-600" />
                    Lịch sử kiểm duyệt sản phẩm
                  </h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {product.audit_history?.length || 0} thao tác
                  </span>
                </div>

                {product.audit_history?.length ? (
                  <div className="space-y-3">
                    {product.audit_history.map((entry) => (
                      <article
                        key={entry.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-extrabold text-slate-900">
                              {entry.action_text} sản phẩm
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {entry.from_status_text} → {entry.to_status_text}
                            </p>
                          </div>
                          <p className="shrink-0 text-xs font-semibold text-slate-500">
                            {formatDate(entry.created_at)}
                          </p>
                        </div>

                        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                          <SmallInfo
                            label="Người thao tác"
                            value={entry.actor?.name || "Tài khoản đã xóa"}
                          />
                          <SmallInfo
                            label="Email"
                            value={entry.actor?.email || "—"}
                          />
                        </div>

                        {entry.reason && (
                          <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                            <p className="font-bold">Lý do</p>
                            <p className="mt-1 whitespace-pre-wrap wrap-break-word">
                              {entry.reason}
                            </p>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                    Chưa có thao tác kiểm duyệt nào được ghi nhận.
                  </div>
                )}
              </section>

              <section>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Lịch sử hồ sơ chứng chỉ
                  </h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {product.certificates?.length || 0} hồ sơ
                  </span>
                </div>

                {product.certificates?.length ? (
                  <div className="space-y-4">
                    {product.certificates.map((certificate) => {
                      const canReviewCertificate =
                        !certificate.deleted_at &&
                        Number(certificate.status) === 0;

                      const fileUrl = getFileUrl(
                        certificate.certificate_file,
                      );

                      return (
                        <article
                          id={`certificate-${certificate.id}`}
                          key={certificate.id}
                          className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
                            Number(highlightCertificateId) === Number(certificate.id)
                              ? "border-sky-400 ring-2 ring-sky-100"
                              : "border-slate-200"
                          }`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <FileCheck2
                                  size={20}
                                  className="text-green-600"
                                />
                                <h4 className="font-extrabold text-slate-900">
                                  {certificate.certification_name ||
                                    "Chứng chỉ"}
                                </h4>
                                <StatusBadge
                                  status={certificate.display_status}
                                  deletedAt={certificate.deleted_at}
                                  config={certificateStatusConfig}
                                />
                              </div>

                              <p className="mt-2 wrap-break-word text-sm text-slate-600">
                                Số chứng chỉ: {" "}
                                <strong>
                                  {certificate.certificate_number || "—"}
                                </strong>
                              </p>
                            </div>

                            {canReviewCertificate && (
                              <div className="flex shrink-0 gap-2">
                                <ConfirmButton
                                  title="Duyệt hồ sơ chứng chỉ này? Hồ sơ đã duyệt trước đó sẽ chuyển sang trạng thái Đã thay thế."
                                  tooltip="Duyệt hồ sơ"
                                  type="success"
                                  onConfirm={() =>
                                    onApproveCertificate(
                                      product,
                                      certificate,
                                    )
                                  }
                                >
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 ${
                                      actionLoading
                                        ? "pointer-events-none opacity-60"
                                        : "cursor-pointer"
                                    }`}
                                  >
                                    <BadgeCheck size={16} />
                                    Duyệt
                                  </span>
                                </ConfirmButton>

                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() =>
                                    onRejectCertificate(
                                      product,
                                      certificate,
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                                >
                                  <X size={16} />
                                  Từ chối
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <SmallInfo
                              label="Ngày cấp"
                              value={formatDateOnly(
                                certificate.issued_date,
                              )}
                            />
                            <SmallInfo
                              label="Ngày hết hạn"
                              value={formatDateOnly(
                                certificate.expiry_date,
                              )}
                            />
                            <SmallInfo
                              label="Người duyệt"
                              value={certificate.approver?.name || "—"}
                            />
                            <SmallInfo
                              label="Thời gian duyệt"
                              value={formatDate(
                                certificate.approved_at,
                              )}
                            />
                          </div>

                          {fileUrl && (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-bold text-green-700 transition hover:bg-green-100"
                            >
                              <FileText size={17} />
                              Mở file chứng chỉ
                              <ExternalLink size={14} />
                            </a>
                          )}

                          {certificate.rejection_reason && (
                            <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                              <p className="font-bold">Lý do từ chối</p>
                              <p className="mt-1 whitespace-pre-wrap wrap-break-word">
                                {certificate.rejection_reason}
                              </p>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                    <FileText
                      size={42}
                      className="mx-auto mb-2 text-slate-300"
                    />
                    Sản phẩm chưa có hồ sơ chứng chỉ.
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, subValue }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <Icon size={17} />
        {label}
      </div>
      <p className="mt-2 wrap-break-word font-bold text-slate-900">
        {value ?? "—"}
      </p>
      {subValue && (
        <p className="mt-1 wrap-break-word text-xs text-slate-500">
          {subValue}
        </p>
      )}
    </div>
  );
}

function SmallInfo({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>
      <p className="mt-1 wrap-break-word text-sm font-bold text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
}

function DateInfo({ label, value }) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
      <CalendarDays
        size={16}
        className="mt-0.5 shrink-0 text-slate-400"
      />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-1 font-semibold text-slate-800">
          {formatDate(value)}
        </p>
      </div>
    </div>
  );
}
