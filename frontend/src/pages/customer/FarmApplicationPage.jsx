// src/pages/customer/FarmApplicationPage.jsx

import { useEffect, useState } from "react";

import {
  AlertTriangle,
  Building2,
  Clock3,
  RefreshCcw,
  Trash2,
} from "lucide-react";

import toast from "react-hot-toast";

import { Navigate, useNavigate } from "react-router-dom";

import useFarm from "@/hooks/useFarm";

import { useAuthStore } from "@/store/authStore";

import FarmForm from "@/components/farm/FarmForm";
import ConfirmButton from "@/components/common/ConfirmButton";
import StatusBadge from "@/components/common/StatusBadge";

import {
  canAccessSellerDashboard,
  FARM_STATUS,
  farmStatusConfig,
  isFarmDeleted,
  isFarmRejected,
} from "@/utils/farm";

function getErrorMessage(error) {
  const errors = error?.errors ?? {};

  const firstError = Object.values(errors)[0];

  if (Array.isArray(firstError)) {
    return firstError[0] || error?.message || "Có lỗi xảy ra.";
  }

  if (typeof firstError === "string") {
    return firstError;
  }

  return error?.message || "Có lỗi xảy ra.";
}

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

  useEffect(() => {
    let cancelled = false;

    getMyFarm().catch((error) => {
      console.error("GET MY FARM ERROR:", error);

      if (!cancelled) {
        setFarmLoadError(error);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [getMyFarm]);

  const handleRetryLoad = async () => {
    setFarmLoadError(null);

    try {
      await getMyFarm();
    } catch (error) {
      console.error("GET MY FARM ERROR:", error);

      setFarmLoadError(error);
    }
  };

  /*
   * Role lấy từ authStore.
   * Farm đầy đủ lấy từ /farms/my.
   */
  const currentUser = authUser
    ? {
        ...authUser,

        farm: myFarm ?? authUser.farm ?? null,
      }
    : null;

  if (ownerLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />

        <div className="h-150 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (farmLoadError) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <AlertTriangle size={42} className="text-red-600" />

        <h1 className="mt-4 text-2xl font-extrabold text-red-700">
          Không thể tải hồ sơ nông trại
        </h1>

        <p className="mt-2 text-slate-600">{getErrorMessage(farmLoadError)}</p>

        <button
          type="button"
          onClick={handleRetryLoad}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white transition hover:bg-green-700"
        >
          <RefreshCcw size={18} />
          Tải lại
        </button>
      </div>
    );
  }

  /*
   * Chỉ chuyển sang Seller khi:
   * - role seller hoặc admin;
   * - Farm active hoặc suspended;
   * - Farm chưa bị xóa mềm.
   */
  if (myFarm && canAccessSellerDashboard(currentUser)) {
    return <Navigate to="/seller/farm" replace />;
  }

  const handleSubmit = async (payload) => {
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
      toast.error(getErrorMessage(error));
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
      toast.error(getErrorMessage(error));

      throw error;
    }
  };

  if (myFarm && isFarmDeleted(myFarm)) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6">
        <AlertTriangle size={42} className="text-red-600" />

        <h1 className="mt-4 text-2xl font-extrabold text-red-700">
          Nông trại đã bị xóa mềm
        </h1>

        <p className="mt-2 text-red-700">
          Tài khoản vẫn được ghi nhận là đã sở hữu nông trại. Vui lòng liên hệ
          quản trị viên để khôi phục hoặc xóa vĩnh viễn.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">
            <Building2 size={25} />
          </div>

          <div>
            <h1 className="text-2xl font-extrabold">
              {myFarm ? "Hồ sơ đăng ký nông trại" : "Đăng ký nông trại"}
            </h1>

            <p className="mt-1 text-slate-500">
              {myFarm
                ? "Theo dõi trạng thái và cập nhật hồ sơ."
                : "Hoàn thành thông tin để gửi hồ sơ cho quản trị viên."}
            </p>
          </div>
        </div>

        {myFarm && (
          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold">Trạng thái:</span>

              <StatusBadge
                status={myFarm.status}
                deletedAt={myFarm.deleted_at}
                config={farmStatusConfig}
              />
            </div>

            {Number(myFarm.status) === FARM_STATUS.PENDING && (
              <div className="mt-4 flex items-start gap-3 rounded-xl bg-yellow-50 p-4 text-yellow-800">
                <Clock3 size={20} className="mt-0.5 shrink-0" />

                <p>
                  Hồ sơ đang chờ quản trị viên xét duyệt. Bạn vẫn có thể cập
                  nhật thông tin trong thời gian chờ.
                </p>
              </div>
            )}

            {isFarmRejected(myFarm) && (
              <div className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="mt-0.5 shrink-0" />

                  <div>
                    <p className="font-bold">Hồ sơ đã bị từ chối</p>

                    <p className="mt-1 whitespace-pre-wrap">
                      {myFarm.rejection_reason || "Không có lý do cụ thể."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <FarmForm
        key={myFarm?.updated_at || "new-farm"}
        initialValues={myFarm}
        loading={ownerActionLoading}
        submitLabel={myFarm ? "Cập nhật hồ sơ" : "Gửi đăng ký nông trại"}
        onSubmit={handleSubmit}
      />

      {myFarm && (
        <div className="flex flex-wrap justify-end gap-3">
          {isFarmRejected(myFarm) && (
            <button
              type="button"
              disabled={ownerActionLoading}
              onClick={handleResubmit}
              className="rounded-xl bg-green-600 px-5 py-3 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Gửi duyệt lại
            </button>
          )}

          {[FARM_STATUS.PENDING, FARM_STATUS.REJECTED].includes(
            Number(myFarm.status),
          ) && (
            <ConfirmButton
              title="Xóa vĩnh viễn hồ sơ nông trại?"
              tooltip="Xóa hồ sơ"
              onConfirm={handleDelete}
            >
              <span className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700">
                <Trash2 size={18} />
                Xóa hồ sơ
              </span>
            </ConfirmButton>
          )}
        </div>
      )}
    </div>
  );
}
