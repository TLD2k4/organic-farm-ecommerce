//src\pages\admin\FarmsPage.jsx

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Building2 } from "lucide-react";
import toast from "react-hot-toast";

import useFarm from "@/hooks/useFarm";
import useDebounce from "@/hooks/useDebounce";

import FarmsFilter from "@/components/ui/admin/farms/FarmsFilter";
import FarmsTable from "@/components/ui/admin/farms/FarmsTable";
import FarmDrawer from "@/components/ui/admin/farms/FarmDrawer";
import FarmRejectModal from "@/components/ui/admin/farms/FarmRejectModal";
import Pagination from "@/components/common/Pagination";
import { requestReason } from "@/utils/actionDialog";

import { handleApi } from "@/utils/api";

export default function FarmsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    farms,
    meta,
    loading,
    actionLoading,

    adminGetAll,
    approve,
    reject,
    suspend,
    reopen,
    deleteFarm,
    restore,
    forceDelete,
  } = useFarm();

  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    keyword: "",
    status: "",
    deleted: "",
  });

  const [selectedFarmId, setSelectedFarmId] = useState(null);

  const [openDrawer, setOpenDrawer] = useState(false);

  const [rejectingFarm, setRejectingFarm] = useState(null);

  const debouncedKeyword = useDebounce(params.keyword, 500);

  useEffect(() => {
    const requestedId = Number(searchParams.get("view"));

    if (Number.isInteger(requestedId) && requestedId > 0) {
      setSelectedFarmId(requestedId);
      setOpenDrawer(true);
    }
  }, [searchParams]);

  const requestParams = {
    page: params.page,
    limit: params.limit,
    keyword: debouncedKeyword,
    status: params.status,
    deleted: params.deleted,
  };

  const reload = () => adminGetAll(requestParams);

  useEffect(() => {
    reload().catch(() => {});
  }, [
    adminGetAll,
    params.page,
    params.limit,
    params.status,
    params.deleted,
    debouncedKeyword,
  ]);

  const handleView = (farm) => {
    setSelectedFarmId(farm.id);
    setOpenDrawer(true);
  };

  const runAction = async (action) => {
    try {
      await handleApi(action);
      await reload();
    } catch {
      // handleApi đã hiển thị lỗi.
    }
  };

  const handleReject = async (reason) => {
    try {
      const response = await reject(rejectingFarm.id, reason);

      toast.success(response.message || "Từ chối nông trại thành công.");

      await reload();
    } catch (error) {
      toast.error(
        error?.errors?.rejection_reason?.[0] ||
          error?.message ||
          "Không thể từ chối nông trại.",
      );

      throw error;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
          <Building2 size={26} />
        </div>

        <div>
          <h1 className="text-2xl font-extrabold">Quản lý nông trại</h1>

          <p className="text-sm text-slate-500">
            Duyệt và quản lý các nông trại trên hệ thống.
          </p>
        </div>
      </div>

      <FarmsFilter params={params} setParams={setParams} />

      <FarmsTable
        farms={farms}
        loading={loading}
        keyword={params.keyword}
        onView={handleView}
        onReject={setRejectingFarm}
        onApprove={(farm) => runAction(() => approve(farm.id))}
        onSuspend={async (farm) => {
          const reason = await requestReason({ title: `Đình chỉ ${farm.name}`, description: "Người bán sẽ nhìn thấy người thao tác, thời gian và lý do đình chỉ.", placeholder: "Nhập lý do đình chỉ...", confirmLabel: "Đình chỉ" });
          if (reason) runAction(() => suspend(farm.id, reason));
        }}
        onReopen={(farm) => runAction(() => reopen(farm.id))}
        onDelete={async (farm) => {
          const reason = await requestReason({ title: `Xóa ${farm.name}`, description: "Nông trại sẽ được xóa mềm và có thể khôi phục.", placeholder: "Nhập lý do xóa...", confirmLabel: "Xóa nông trại" });
          if (reason) runAction(() => deleteFarm(farm.id, reason));
        }}
        onRestore={(farm) => runAction(() => restore(farm.id))}
        onForceDelete={(farm) => runAction(() => forceDelete(farm.id))}
      />

      <Pagination
        meta={meta}
        params={params}
        setParams={setParams}
        itemLabel="gian hàng"
        loading={loading}
      />

      <FarmDrawer
        open={openDrawer}
        farmId={selectedFarmId}
        onClose={() => {
          setOpenDrawer(false);
          setSelectedFarmId(null);

          if (searchParams.has("view")) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete("view");
            setSearchParams(nextParams, { replace: true });
          }
        }}
      />

      <FarmRejectModal
        open={Boolean(rejectingFarm)}
        farm={rejectingFarm}
        loading={actionLoading}
        onClose={() => setRejectingFarm(null)}
        onConfirm={handleReject}
      />
    </div>
  );
}
