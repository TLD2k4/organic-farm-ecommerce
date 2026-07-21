import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BadgeCheck,
  FileClock,
  PackageCheck,
  PackageX,
  ShieldCheck,
  TimerOff,
} from "lucide-react";
import toast from "react-hot-toast";

import useAdminProduct from "@/hooks/useAdminProduct";
import useDebounce from "@/hooks/useDebounce";

import Pagination from "@/components/common/Pagination";
import AdminProductsFilter from "@/components/ui/admin/products/AdminProductsFilter";
import AdminProductsTable from "@/components/ui/admin/products/AdminProductsTable";
import AdminProductDrawer from "@/components/ui/admin/products/AdminProductDrawer";
import AdminProductRejectModal from "@/components/ui/admin/products/AdminProductRejectModal";
import { confirmAction, requestReason } from "@/utils/actionDialog";
import { getApiErrorMessage as getErrorMessage } from "@/utils/apiError";

export default function AdminProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    products,
    meta,
    stats,
    options,

    listLoading,
    optionsLoading,
    actionLoading,

    getAll,
    getOptions,
    approveProduct,
    rejectProduct,
    suspendProduct,
    reopenProduct,
    approveCertificate,
    rejectCertificate,
    clearProduct,
  } = useAdminProduct();

  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    keyword: "",
    status: "",
    certificate_status: "",
    farm_id: "",
    category_id: "",
    deleted: "0",
  });

  const [selectedProductId, setSelectedProductId] =
    useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [rejectContext, setRejectContext] = useState(null);

  const debouncedKeyword = useDebounce(params.keyword, 500);
  const highlightedCertificateId = Number(searchParams.get("certificate")) || null;

  useEffect(() => {
    const requestedId = Number(searchParams.get("view"));

    if (Number.isInteger(requestedId) && requestedId > 0) {
      setSelectedProductId(requestedId);
      setOpenDrawer(true);
    }
  }, [searchParams]);

  useEffect(() => {
    getOptions().catch((error) => {
      toast.error(
        getErrorMessage(error) || "Không tải được bộ lọc.",
      );
    });
  }, [getOptions]);

  useEffect(() => {
    getAll({
      ...params,
      keyword: debouncedKeyword,
    }).catch((error) => {
      toast.error(getErrorMessage(error));
    });
  }, [
    params.page,
    params.limit,
    params.status,
    params.certificate_status,
    params.farm_id,
    params.category_id,
    params.deleted,
    debouncedKeyword,
    getAll,
  ]);

  const reload = () =>
    getAll({
      ...params,
      keyword: debouncedKeyword,
    });

  const handleView = (product) => {
    setSelectedProductId(product.id);
    setOpenDrawer(true);
  };

  const closeDrawer = () => {
    setOpenDrawer(false);
    setSelectedProductId(null);
    clearProduct();

    if (searchParams.has("view") || searchParams.has("certificate")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("view");
      nextParams.delete("certificate");
      setSearchParams(nextParams, { replace: true });
    }
  };

  const runAction = async (action) => {
    let response;

    try {
      response = await action();
    } catch (error) {
      toast.error(getErrorMessage(error));
      return null;
    }

    toast.success(
      response?.message || "Thao tác thành công.",
    );

    try {
      await reload();
    } catch (error) {
      toast.error(
        `Thao tác đã thành công nhưng chưa tải lại danh sách: ${getErrorMessage(error)}`,
      );
    }

    return response;
  };

  const handleApproveProduct = (product) => {
    const payload = product.pending_certificate?.id
      ? {
          certificate_id: product.pending_certificate.id,
        }
      : {};

    return runAction(() =>
      approveProduct(product.id, payload),
    );
  };

  const handleApproveCertificate = (
    product,
    certificate,
  ) =>
    runAction(() =>
      approveCertificate(product.id, certificate.id),
    );

  const openRejectProduct = (product) => {
    setRejectContext({
      type: "product",
      productId: product.id,
      productName: product.name,
    });
  };

  const handleSuspendProduct = async (product) => {
    const reason = await requestReason({ title: `Đình chỉ ${product.name}`, description: "Người bán sẽ thấy admin thực hiện, thời gian và lý do.", placeholder: "Nhập lý do đình chỉ sản phẩm...", confirmLabel: "Đình chỉ" });
    if (!reason) return null;
    return runAction(() => suspendProduct(product.id, reason));
  };

  const handleReopenProduct = async (product) => {
    if (!await confirmAction({ title: `Mở lại ${product.name}`, description: "Hệ thống sẽ kiểm tra trạng thái gian hàng và chứng chỉ trước khi mở bán.", confirmLabel: "Mở lại" })) return null;
    return runAction(() => reopenProduct(product.id));
  };

  const openRejectCertificate = (
    product,
    certificate,
  ) => {
    setRejectContext({
      type: "certificate",
      productId: product.id,
      productName: product.name,
      certificateId: certificate.id,
      certificationName: certificate.certification_name,
      certificateNumber: certificate.certificate_number,
    });
  };

  const handleRejectConfirm = async (reason) => {
    if (!rejectContext) {
      return;
    }

    const response =
      rejectContext.type === "certificate"
        ? await rejectCertificate(
            rejectContext.productId,
            rejectContext.certificateId,
            reason,
          )
        : await rejectProduct(
            rejectContext.productId,
            reason,
          );

    toast.success(
      response?.message || "Từ chối thành công.",
    );

    setRejectContext(null);

    try {
      await reload();
    } catch (error) {
      toast.error(
        `Đã từ chối nhưng chưa tải lại danh sách: ${getErrorMessage(error)}`,
      );
    }
  };

  const statCards = [
    {
      label: "Tổng sản phẩm",
      value: stats.total,
      icon: PackageCheck,
      className: "bg-sky-50 text-sky-700",
    },
    {
      label: "Sản phẩm chờ duyệt",
      value: stats.pending_products,
      icon: FileClock,
      className: "bg-amber-50 text-amber-700",
    },
    {
      label: "Hồ sơ chờ duyệt",
      value: stats.pending_certificates,
      icon: ShieldCheck,
      className: "bg-violet-50 text-violet-700",
    },
    {
      label: "Đang bán",
      value: stats.active_products,
      icon: BadgeCheck,
      className: "bg-green-50 text-green-700",
    },
    {
      label: "Bị từ chối",
      value: stats.rejected_products,
      icon: PackageX,
      className: "bg-red-50 text-red-700",
    },
    {
      label: "Hết hạn chứng chỉ",
      value: stats.expired_certificate_products,
      icon: TimerOff,
      className: "bg-orange-50 text-orange-700",
    },
  ];

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Kiểm duyệt sản phẩm
        </h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          Kiểm tra thông tin sản phẩm và hồ sơ chứng chỉ do seller gửi lên.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.className}`}
              >
                <Icon size={22} />
              </div>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">
                {card.value ?? 0}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {card.label}
              </p>
            </div>
          );
        })}
      </div>

      <AdminProductsFilter
        params={params}
        setParams={setParams}
        options={options}
        loading={optionsLoading}
      />

      <AdminProductsTable
        products={products}
        loading={listLoading}
        keyword={params.keyword}
        actionLoading={actionLoading}
        onView={handleView}
        onApproveProduct={handleApproveProduct}
        onRejectProduct={openRejectProduct}
      />

      <Pagination
        meta={meta}
        params={params}
        setParams={setParams}
        itemLabel="sản phẩm"
        loading={listLoading}
      />

      <AdminProductDrawer
        open={openDrawer}
        productId={selectedProductId}
        highlightCertificateId={highlightedCertificateId}
        actionLoading={actionLoading}
        onClose={closeDrawer}
        onApproveProduct={handleApproveProduct}
        onRejectProduct={openRejectProduct}
        onSuspendProduct={handleSuspendProduct}
        onReopenProduct={handleReopenProduct}
        onApproveCertificate={handleApproveCertificate}
        onRejectCertificate={openRejectCertificate}
      />

      {rejectContext && (
        <AdminProductRejectModal
          key={`${rejectContext.type}-${rejectContext.productId}-${rejectContext.certificateId || "product"}`}
          context={rejectContext}
          loading={actionLoading}
          onClose={() => setRejectContext(null)}
          onConfirm={handleRejectConfirm}
        />
      )}
    </div>
  );
}
