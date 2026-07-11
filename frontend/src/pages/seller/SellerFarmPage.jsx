import { useEffect } from "react";

import { AlertTriangle, ExternalLink } from "lucide-react";

import { Link } from "react-router-dom";

import useFarm from "@/hooks/useFarm";

import FarmForm from "@/components/farm/FarmForm";
import StatusBadge from "@/components/common/StatusBadge";

import {
  farmStatusConfig,
  isFarmActive,
  isFarmDeleted,
  isFarmSuspended,
} from "@/utils/farm";

export default function SellerFarmPage() {
  const { myFarm, ownerLoading, ownerActionLoading, getMyFarm, updateFarm } =
    useFarm();

  useEffect(() => {
    getMyFarm().catch(() => {});
  }, [getMyFarm]);

  if (ownerLoading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-150 animate-pulse rounded-2xl bg-slate-200" />
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

  const handleUpdate = async (payload) => {
    const response = await updateFarm(myFarm.id, payload);

    await getMyFarm();

    return response;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold">Thông tin nông trại</h1>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm text-slate-500">Trạng thái:</span>

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
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-50 px-4 py-3 font-bold text-green-700 transition hover:bg-green-100"
          >
            <ExternalLink size={18} />
            Xem gian hàng công khai
          </Link>
        )}
      </div>

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
