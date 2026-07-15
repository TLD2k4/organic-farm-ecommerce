// src/pages/customer/FarmApplicationPage.jsx

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck2,
  Info,
  PanelRightOpen,
  RefreshCcw,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { Navigate, useNavigate } from "react-router-dom";

import ConfirmButton from "@/components/common/ConfirmButton";
import StatusBadge from "@/components/common/StatusBadge";
import FarmForm from "@/components/farm/FarmForm";

import useFarm from "@/hooks/useFarm";
import { useAuthStore } from "@/store/authStore";

import { getFarmErrorMessage } from "@/utils/farmError";

import {
  canAccessSellerDashboard,
  farmStatusConfig,
  isFarmDeleted,
  isFarmPending,
  isFarmRejected,
} from "@/utils/farm";

export default function FarmApplicationPage() {
  const navigate = useNavigate();

  const authUser = useAuthStore((state) => state.user);

  const {
    myFarm,
    ownerLoading,
    ownerActionLoading,
    getMyFarm,
    registerFarm,
    updateFarm,
    resubmitFarm,
    ownerForceDeleteFarm,
  } = useFarm();

  const [farmLoadError, setFarmLoadError] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getMyFarm()
      .then(() => {
        if (!cancelled) {
          setFarmLoadError(null);
        }
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        console.error("GET MY FARM ERROR:", error);

        setFarmLoadError(error);
      });

    return () => {
      cancelled = true;
    };
  }, [getMyFarm]);

  const handleRetryLoad = async () => {
    try {
      setFarmLoadError(null);

      await getMyFarm();
    } catch (error) {
      console.error("RETRY GET MY FARM ERROR:", error);

      setFarmLoadError(error);
    }
  };

  const currentUser = authUser
    ? {
        ...authUser,
        farm: myFarm ?? authUser.farm ?? null,
      }
    : null;

  if (ownerLoading) {
    return <FarmApplicationSkeleton />;
  }

  if (farmLoadError) {
    return (
      <FarmApplicationError error={farmLoadError} onRetry={handleRetryLoad} />
    );
  }

  /*
   * Khi Farm đã active hoặc suspended, tài khoản seller/admin
   * được chuyển sang khu vực Seller.
   *
   * Thông tin người duyệt và thời gian duyệt được hiển thị
   * tại SellerFarmPage.
   */
  if (myFarm && canAccessSellerDashboard(currentUser)) {
    return <Navigate to="/seller/farm" replace />;
  }

  const handleSubmit = (payload) => {
    if (myFarm?.id) {
      return updateFarm(myFarm.id, payload);
    }

    return registerFarm(payload);
  };

  const handleResubmit = async () => {
    try {
      const response = await resubmitFarm(myFarm.id);

      toast.success(response?.message || "Đã gửi lại hồ sơ để chờ duyệt.");
    } catch (error) {
      toast.error(getFarmErrorMessage(error, "Không thể gửi duyệt lại hồ sơ."));
    }
  };

  const handleDelete = async () => {
    try {
      const response = await ownerForceDeleteFarm(myFarm.id);

      toast.success(response?.message || "Xóa hồ sơ nông trại thành công.");

      navigate("/profile", {
        replace: true,
      });
    } catch (error) {
      toast.error(getFarmErrorMessage(error, "Không thể xóa hồ sơ nông trại."));

      throw error;
    }
  };

  if (myFarm && isFarmDeleted(myFarm)) {
    return <DeletedFarmNotice />;
  }

  const canDeleteApplication =
    Boolean(myFarm) && (isFarmPending(myFarm) || isFarmRejected(myFarm));

  return (
    <div className="farm-application-page mx-auto max-w-6xl space-y-6">
      <FarmApplicationHero hasFarm={Boolean(myFarm)} />

      <div className="flex items-center gap-3 px-1">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
          <FileCheck2 size={21} />
        </div>

        <div className="min-w-0">
          <h2 className="text-xl font-extrabold text-slate-950">
            {myFarm ? "Thông tin hồ sơ" : "Thông tin đăng ký"}
          </h2>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Vui lòng cung cấp thông tin chính xác và đầy đủ.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_104px] items-start gap-2 sm:grid-cols-[minmax(0,1fr)_160px] sm:gap-3 md:grid-cols-[minmax(0,1fr)_240px] md:gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-6">
        <main className="min-w-0">
          <FarmForm
            initialValues={myFarm}
            loading={ownerActionLoading}
            requirePolicyAcceptance={!myFarm}
            submitLabel={myFarm ? "Cập nhật hồ sơ" : "Gửi đăng ký nông trại"}
            onSubmit={handleSubmit}
          />
        </main>

        <aside className="sticky top-20 min-w-0 self-start sm:top-24">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="block w-full rounded-xl text-left md:hidden"
            aria-label="Mở đầy đủ thông tin đăng ký nông trại"
          >
            <MobileSidebarPreview
              farm={myFarm}
              canDelete={canDeleteApplication}
            />
          </button>

          <div className="hidden space-y-4 md:block">
            {myFarm ? (
              <FarmApplicationStatus farm={myFarm} />
            ) : (
              <RegistrationSteps />
            )}

            <ApplicationNotice />

            {myFarm && (
              <ApplicationActions
                farm={myFarm}
                loading={ownerActionLoading}
                canDelete={canDeleteApplication}
                onResubmit={handleResubmit}
                onDelete={handleDelete}
              />
            )}
          </div>
        </aside>
      </div>

      <MobileFarmInfoDrawer
        open={mobileDrawerOpen}
        farm={myFarm}
        loading={ownerActionLoading}
        canDelete={canDeleteApplication}
        onClose={() => setMobileDrawerOpen(false)}
        onResubmit={handleResubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}

function FarmApplicationHero({ hasFarm }) {
  return (
    <header className="farm-application-hero relative overflow-hidden rounded-[30px] border border-green-500/20 bg-linear-to-br from-emerald-700 via-green-700 to-teal-700 px-6 py-8 text-white shadow-[0_24px_70px_rgba(21,128,61,0.2)] sm:px-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-lime-300/10 blur-3xl" />

      <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-bold text-green-50 backdrop-blur">
            <ShieldCheck size={16} />
            Đối tác nông trại GreenFarm
          </div>

          <div className="mt-5 flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-inner backdrop-blur">
              <Building2 size={29} />
            </div>

            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                {hasFarm
                  ? "Hồ sơ đăng ký nông trại"
                  : "Trở thành đối tác nông trại"}
              </h1>

              <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-green-50/90 sm:text-base">
                {hasFarm
                  ? "Theo dõi trạng thái xét duyệt, cập nhật thông tin và hoàn thiện hồ sơ nông trại của bạn."
                  : "Hoàn thành hồ sơ để đưa sản phẩm nông nghiệp chất lượng đến gần hơn với khách hàng."}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:w-92">
          <HeroFeature icon={FileCheck2} value="01" label="Điền hồ sơ" />

          <HeroFeature icon={ShieldCheck} value="02" label="Chờ xét duyệt" />

          <HeroFeature icon={CheckCircle2} value="03" label="Bắt đầu bán" />
        </div>
      </div>
    </header>
  );
}

function HeroFeature({ icon: Icon, value, label }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-3 text-center backdrop-blur-sm">
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
        <Icon size={18} />
      </div>

      <p className="mt-2 text-xs font-black text-green-100">BƯỚC {value}</p>

      <p className="mt-1 text-xs font-bold leading-4 text-white sm:text-sm">
        {label}
      </p>
    </div>
  );
}

function MobileSidebarPreview({ farm, canDelete }) {
  const pending = Boolean(farm) && isFarmPending(farm);
  const rejected = Boolean(farm) && isFarmRejected(farm);

  return (
    <div className="space-y-2">
      <section className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              rejected
                ? "bg-red-100 text-red-700"
                : pending
                  ? "bg-amber-100 text-amber-700"
                  : "bg-green-100 text-green-700"
            }`}
          >
            {rejected ? (
              <AlertTriangle size={18} />
            ) : pending ? (
              <Clock3 size={18} />
            ) : (
              <PanelRightOpen size={18} />
            )}
          </div>

          <p className="mt-2 wrap-break-word text-center text-[10px] font-extrabold leading-4 text-slate-900 sm:text-xs">
            {farm
              ? rejected
                ? "Bị từ chối"
                : pending
                  ? "Chờ duyệt"
                  : "Hồ sơ"
              : "Quy trình đăng ký"}
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-blue-100 bg-blue-50/70 p-2 text-center shadow-sm">
        <Info size={17} className="mx-auto text-blue-700" />

        <p className="mt-1 wrap-break-word text-[10px] font-extrabold leading-4 text-blue-800 sm:text-xs">
          Lưu ý đăng ký
        </p>
      </section>

      {farm && (rejected || canDelete) && (
        <section className="rounded-xl border border-red-100 bg-red-50 p-2 text-center shadow-sm">
          <RefreshCcw size={16} className="mx-auto text-red-600" />

          <p className="mt-1 wrap-break-word text-[10px] font-extrabold leading-4 text-red-700 sm:text-xs">
            Thao tác hồ sơ
          </p>
        </section>
      )}

      <div className="flex items-center justify-center gap-1 rounded-xl bg-green-600 px-1.5 py-2 text-[10px] font-extrabold text-white shadow-sm sm:text-xs">
        Xem đầy đủ
        <ChevronRight size={14} />
      </div>
    </div>
  );
}

function MobileFarmInfoDrawer({
  open,
  farm,
  loading,
  canDelete,
  onClose,
  onResubmit,
  onDelete,
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-9999 md:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-farm-drawer-title"
    >
      <button
        type="button"
        aria-label="Đóng bảng thông tin"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
      />

      <section className="absolute inset-y-0 right-0 z-10 flex w-[min(92vw,390px)] flex-col bg-slate-50 shadow-[-18px_0_50px_rgba(15,23,42,0.24)]">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-green-700">
              Thông tin hồ sơ
            </p>

            <h2
              id="mobile-farm-drawer-title"
              className="mt-1 text-lg font-black text-slate-950"
            >
              {farm ? "Chi tiết hồ sơ nông trại" : "Hướng dẫn đăng ký"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-950"
          >
            <X size={20} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          <div className="space-y-4">
            {farm ? (
              <FarmApplicationStatus farm={farm} />
            ) : (
              <RegistrationSteps />
            )}

            <ApplicationNotice />

            {farm && (
              <ApplicationActions
                farm={farm}
                loading={loading}
                canDelete={canDelete}
                onResubmit={onResubmit}
                onDelete={onDelete}
              />
            )}
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}

function FarmApplicationStatus({ farm }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">
          Trạng thái hồ sơ
        </p>

        <div className="mt-3">
          <StatusBadge
            status={farm.status}
            deletedAt={farm.deleted_at}
            config={farmStatusConfig}
          />
        </div>
      </div>

      <div className="p-5">
        {isFarmPending(farm) && (
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock3 size={20} />
            </div>

            <div>
              <p className="font-extrabold text-amber-800">
                Đang chờ xét duyệt
              </p>

              <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                Quản trị viên đang kiểm tra hồ sơ. Bạn vẫn có thể cập nhật thông
                tin trong thời gian chờ.
              </p>
            </div>
          </div>
        )}

        {isFarmRejected(farm) && (
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
              <AlertTriangle size={20} />
            </div>

            <div className="min-w-0">
              <p className="font-extrabold text-red-700">
                Hồ sơ chưa được chấp thuận
              </p>

              <p className="mt-1 text-sm font-medium text-slate-500">
                Lý do từ chối:
              </p>

              <div className="mt-2 rounded-xl border border-red-100 bg-red-50 p-3">
                <p className="whitespace-pre-wrap wrap-break-word text-sm font-semibold leading-6 text-red-700">
                  {farm.rejection_reason || "Không có lý do cụ thể."}
                </p>
              </div>

              <p className="mt-3 text-xs font-semibold text-slate-500">
                Người từ chối: {farm.approver?.name || "Quản trị viên hệ thống"}
                {farm.approved_at
                  ? ` · ${new Date(farm.approved_at).toLocaleString("vi-VN")}`
                  : ""}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function RegistrationSteps() {
  const steps = [
    {
      number: "01",
      title: "Cung cấp thông tin",
      description: "Nhập tên, địa chỉ, số điện thoại và hình ảnh nông trại.",
    },
    {
      number: "02",
      title: "Gửi hồ sơ",
      description: "Hệ thống tiếp nhận và chuyển hồ sơ đến quản trị viên.",
    },
    {
      number: "03",
      title: "Chờ phê duyệt",
      description: "Sau khi được duyệt, bạn có thể bắt đầu quản lý gian hàng.",
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
          <Send size={19} />
        </div>

        <div>
          <h2 className="font-extrabold text-slate-900">Quy trình đăng ký</h2>

          <p className="text-sm text-slate-500">Chỉ gồm 3 bước đơn giản</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {steps.map((step, index) => (
          <div key={step.number} className="relative flex gap-3">
            {index < steps.length - 1 && (
              <div className="absolute left-4 top-9 h-[calc(100%+8px)] w-px bg-green-100" />
            )}

            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-black text-white">
              {step.number}
            </div>

            <div className="pb-1">
              <p className="font-bold text-slate-800">{step.title}</p>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ApplicationNotice() {
  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
          <Info size={18} />
        </div>

        <div>
          <p className="font-extrabold text-blue-800">Lưu ý khi đăng ký</p>

          <p className="mt-1 text-sm font-medium leading-6 text-blue-700/80">
            Hãy sử dụng thông tin và hình ảnh thật của nông trại để quá trình
            xét duyệt diễn ra thuận lợi hơn.
          </p>
        </div>
      </div>
    </section>
  );
}

function ApplicationActions({
  farm,
  loading,
  canDelete,
  onResubmit,
  onDelete,
}) {
  if (!isFarmRejected(farm) && !canDelete) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-400">
        Thao tác hồ sơ
      </p>

      <div className="mt-4 space-y-3">
        {isFarmRejected(farm) && (
          <button
            type="button"
            disabled={loading}
            onClick={onResubmit}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            Gửi duyệt lại
          </button>
        )}

        {canDelete && (
          <ConfirmButton
            title="Xóa vĩnh viễn hồ sơ nông trại?"
            tooltip="Xóa hồ sơ"
            onConfirm={onDelete}
          >
            <span className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 font-bold text-red-700 transition hover:border-red-300 hover:bg-red-100">
              <Trash2 size={18} />
              Xóa hồ sơ
            </span>
          </ConfirmButton>
        )}
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-400">
        Hồ sơ đã xóa vĩnh viễn sẽ không thể khôi phục.
      </p>
    </section>
  );
}

function FarmApplicationError({ error, onRetry }) {
  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-[28px] border border-red-100 bg-white shadow-[0_24px_70px_rgba(220,38,38,0.1)]">
      <div className="h-2 bg-linear-to-r from-red-500 via-orange-500 to-red-500" />

      <div className="p-7 text-center sm:p-10">
        <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-3xl bg-red-100 text-red-600">
          <AlertTriangle size={34} />
        </div>

        <h1 className="mt-5 text-2xl font-black text-slate-950">
          Không thể tải hồ sơ nông trại
        </h1>

        <p className="mx-auto mt-3 max-w-lg text-sm font-medium leading-6 text-slate-500">
          {getFarmErrorMessage(error, "Đã xảy ra lỗi khi tải hồ sơ nông trại.")}
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-green-700"
        >
          <RefreshCcw size={18} />
          Tải lại dữ liệu
        </button>
      </div>
    </div>
  );
}

function DeletedFarmNotice() {
  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-[28px] border border-red-100 bg-white shadow-[0_24px_70px_rgba(220,38,38,0.1)]">
      <div className="h-2 bg-linear-to-r from-red-500 to-orange-500" />

      <div className="p-7 text-center sm:p-10">
        <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-3xl bg-red-100 text-red-600">
          <Trash2 size={34} />
        </div>

        <h1 className="mt-5 text-2xl font-black text-slate-950">
          Nông trại đã bị xóa mềm
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-6 text-slate-500">
          Tài khoản vẫn được ghi nhận là đã sở hữu nông trại. Vui lòng liên hệ
          quản trị viên để khôi phục hoặc xóa vĩnh viễn trước khi đăng ký hồ sơ
          mới.
        </p>
      </div>
    </div>
  );
}

function FarmApplicationSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="h-58 animate-pulse rounded-[30px] bg-slate-200" />

      <div className="grid grid-cols-[minmax(0,1fr)_104px] gap-2 sm:grid-cols-[minmax(0,1fr)_160px] sm:gap-3 md:grid-cols-[minmax(0,1fr)_240px] md:gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-6">
        <div className="h-180 animate-pulse rounded-2xl bg-slate-200" />

        <div className="space-y-4">
          <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-36 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
