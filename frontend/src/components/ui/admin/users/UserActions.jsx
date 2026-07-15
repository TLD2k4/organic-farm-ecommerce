import { Eye, Lock, Unlock, RotateCcw, Trash2, Skull } from "lucide-react";

import { useState } from "react";

import useUser from "@/hooks/useUser";

import ConfirmButton from "@/components/common/ConfirmButton";

import { handleApi } from "@/utils/api";
import { requestReason } from "@/utils/actionDialog";

export default function UserActions({
  user,
  params,
  getAll,
  setSelectedUserId,
  setOpenDrawer,
}) {
  const { toggleStatus, deleteUser, restore, forceDelete } = useUser();

  const [loadingId, setLoadingId] = useState(null);

  const reload = () => getAll(params);

  const isDeleted = Boolean(user.deleted_at);
  const isLoading = loadingId === user.id;

  const handleView = () => {
    setSelectedUserId(user.id);
    setOpenDrawer(true);
  };

  const handleToggleStatus = async () => {
    const reason = await requestReason({ title: user.status ? `Khóa ${user.name}` : `Mở khóa ${user.name}`, description: "Người dùng sẽ thấy người thao tác, thời gian và lý do thay đổi trạng thái.", placeholder: user.status ? "Nhập lý do khóa tài khoản..." : "Nhập lý do mở khóa...", confirmLabel: user.status ? "Khóa tài khoản" : "Mở khóa", danger: Boolean(user.status) });
    if (!reason) return;

    try {
      setLoadingId(user.id);

      await handleApi(() => toggleStatus(user.id, reason), reload);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="flex min-w-max items-center justify-center gap-2">
      <button
        type="button"
        title="Xem chi tiết"
        onClick={handleView}
        className="
          cursor-pointer
          rounded-lg
          bg-sky-500
          p-2
          text-white
          transition
          hover:bg-sky-600
        "
      >
        <Eye size={16} />
      </button>

      {!isDeleted && (
        <>
          <button
            type="button"
            disabled={isLoading}
            title={user.status ? "Khóa tài khoản" : "Mở khóa"}
            onClick={handleToggleStatus}
            className={`
              cursor-pointer

              rounded-lg

              p-2

              text-white

              transition

              disabled:cursor-not-allowed
              disabled:opacity-50

              ${
                user.status
                  ? "bg-yellow-500 hover:bg-yellow-600"
                  : "bg-green-600 hover:bg-green-700"
              }
            `}
          >
            {user.status ? <Lock size={16} /> : <Unlock size={16} />}
          </button>

          <ConfirmButton
            title="Xóa mềm người dùng?"
            tooltip="Xóa mềm"
            onConfirm={async () => {
              const reason = await requestReason({ title: `Xóa ${user.name}`, description: "Tài khoản được xóa mềm và có thể khôi phục.", placeholder: "Nhập lý do xóa tài khoản...", confirmLabel: "Xóa tài khoản" });
              if (reason) {
                return handleApi(
                  () => deleteUser(user.id, reason),
                  reload,
                );
              }
              return undefined;
            }}
          >
            <span
              className="
                inline-flex
                cursor-pointer
                rounded-lg
                bg-red-500
                p-2
                text-white
                transition
                hover:bg-red-600
              "
            >
              <Trash2 size={16} />
            </span>
          </ConfirmButton>
        </>
      )}

      {isDeleted && (
        <>
          <ConfirmButton
            title="Khôi phục người dùng?"
            tooltip="Khôi phục"
            type="success"
            onConfirm={() => handleApi(() => restore(user.id), reload)}
          >
            <span
              className="
                inline-flex
                cursor-pointer
                rounded-lg
                bg-blue-500
                p-2
                text-white
                transition
                hover:bg-blue-600
              "
            >
              <RotateCcw size={16} />
            </span>
          </ConfirmButton>

          <ConfirmButton
            title="Xóa vĩnh viễn người dùng?"
            tooltip="Xóa vĩnh viễn"
            onConfirm={async () => {
              const reason = await requestReason({ title: `Xóa vĩnh viễn ${user.name}`, description: "Dữ liệu tài khoản sẽ không thể khôi phục.", placeholder: "Nhập lý do xóa vĩnh viễn...", confirmLabel: "Xóa vĩnh viễn" });
              if (reason) {
                return handleApi(
                  () => forceDelete(user.id, reason),
                  reload,
                );
              }
              return undefined;
            }}
          >
            <span
              className="
                inline-flex
                cursor-pointer
                rounded-lg
                bg-black
                p-2
                text-white
                transition
                hover:bg-slate-800
              "
            >
              <Skull size={16} />
            </span>
          </ConfirmButton>
        </>
      )}
    </div>
  );
}
