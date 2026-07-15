// src/pages/seller/SellerFarmPage.jsx

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  ExternalLink,
  RefreshCcw,
  UserRoundCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

import useFarm from "@/hooks/useFarm";

import FarmForm from "@/components/farm/FarmForm";
import StatusBadge from "@/components/common/StatusBadge";

import { formatDate } from "@/utils/date";
import { getFarmErrorMessage } from "@/utils/farmError";
import {
  farmStatusConfig,
  isFarmActive,
  isFarmDeleted,
  isFarmSuspended,
} from "@/utils/farm";

export default function SellerFarmPage() {
  const { myFarm, ownerLoading, ownerActionLoading, getMyFarm, updateFarm } =
    useFarm();

  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getMyFarm()
      .then(() => {
        if (!cancelled) {
          setLoadError(null);
        }
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        console.error("GET MY FARM ERROR:", error);

        setLoadError(error);
      });

    return () => {
      cancelled = true;
    };
  }, [getMyFarm]);

  const handleRetryLoad = async () => {
    try {
      setLoadError(null);

      await getMyFarm();
    } catch (error) {
      console.error("RETRY GET MY FARM ERROR:", error);

      setLoadError(error);
    }
  };

  const handleUpdate = async (payload) => {
    const response = await updateFarm(myFarm.id, payload);

    await getMyFarm();

    return response;
  };

  if (ownerLoading) {
    return <SellerFarmPageSkeleton />;
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <AlertTriangle size={42} className="text-red-600" />

        <h1 className="mt-4 text-2xl font-extrabold text-red-700">
          Không thể tải thông tin nông trại
        </h1>

        <p className="mt-2 text-slate-600">
          {getFarmErrorMessage(
            loadError,
            "Đã xảy ra lỗi khi tải thông tin nông trại.",
          )}
        </p>

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

  if (!myFarm || isFarmDeleted(myFarm)) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-extrabold text-red-700">
          Không thể quản lý nông trại
        </h1>

        <p className="mt-2 text-red-700">
          Nông trại không tồn tại hoặc đã bị xóa.
        </p>

        <Link
          to="/seller/register"
          className="mt-4 inline-flex rounded-xl bg-red-600 px-4 py-2 font-bold text-white"
        >
          Xem hồ sơ nông trại
        </Link>
      </div>
    );
  }

  const showApprovalInformation =
    isFarmActive(myFarm) || isFarmSuspended(myFarm);

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-950">
              Thông tin nông trại
            </h1>

            <div className="mt-3 flex items-center gap-3">
              <span className="text-sm font-medium text-slate-500">
                Trạng thái:
              </span>

              <StatusBadge
                status={myFarm.status}
                deletedAt={myFarm.deleted_at}
                config={farmStatusConfig}
              />
            </div>
          </div>

          {isFarmActive(myFarm) && (
            <Link
              to={`/farms/${myFarm.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-50 px-4 py-3 font-bold text-green-700 transition hover:bg-green-100"
            >
              <ExternalLink size={18} />
              Xem gian hàng công khai
            </Link>
          )}
        </div>

        {showApprovalInformation && (
          <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl bg-green-50 p-4">
              <UserRoundCheck
                size={20}
                className="mt-0.5 shrink-0 text-green-700"
              />

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-green-700">
                  Người duyệt
                </p>

                <p className="mt-1 wrap-break-word font-semibold text-slate-800">
                  {myFarm.approver?.name ||
                    myFarm.approver?.email ||
                    (myFarm.approved_by
                      ? `Quản trị viên #${myFarm.approved_by}`
                      : "Chưa có thông tin người duyệt")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-green-50 p-4">
              <CalendarClock
                size={20}
                className="mt-0.5 shrink-0 text-green-700"
              />

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-green-700">
                  Thời gian duyệt
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  {myFarm.approved_at
                    ? formatDate(myFarm.approved_at)
                    : "Chưa có thông tin thời gian duyệt"}
                </p>
              </div>
            </div>
          </div>
        )}
      </header>

      {isFarmSuspended(myFarm) && (
        <div className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-5 text-orange-800">
          <AlertTriangle size={22} className="mt-0.5 shrink-0" />

          <div>
            <p className="font-extrabold">Nông trại đang bị đình chỉ</p>

            <p className="mt-1">
              Bạn vẫn có thể xử lý các đơn hàng cũ, nhưng không thể cập nhật
              nông trại hoặc thực hiện nghiệp vụ bán hàng mới.
            </p>
          </div>
        </div>
      )}

      <FarmForm
        key={myFarm.updated_at || myFarm.id}
        initialValues={myFarm}
        loading={ownerActionLoading}
        disabled={isFarmSuspended(myFarm)}
        submitLabel="Cập nhật nông trại"
        onSubmit={handleUpdate}
      />
    </div>
  );
}

function SellerFarmPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
      <div className="h-150 animate-pulse rounded-2xl bg-slate-200" />
    </div>
  );
}
