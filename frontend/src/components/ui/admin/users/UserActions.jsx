import { Eye, Lock, Unlock, RotateCcw, Trash2, Skull } from "lucide-react";

import { useState } from "react";
import toast from "react-hot-toast";

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
    const isLocking = Boolean(user.status);
    const hasActiveFarm =
      isLocking &&
      user.farm &&
      !user.farm.deleted_at &&
      Number(user.farm.status) === 1;

    if (hasActiveFarm) {
      toast.error(
        "Tài khoản đang có nông trại hoạt động. Hãy đình chỉ nông trại trước rồi mới khóa tài khoản.",
      );
      return;
    }

    const description = isLocking
      ? "Khóa tài khoản sẽ thu hồi toàn bộ phiên đăng nhập. Đơn hàng và dữ liệu lịch sử vẫn được giữ nguyên; hệ thống không tự đổi trạng thái nông trại, sản phẩm hoặc đơn hàng."
      : "Mở khóa chỉ cho phép tài khoản đăng nhập trở lại; hệ thống không tự mở lại nông trại hoặc sản phẩm đã bị đình chỉ.";

    const reason = await requestReason({
      title: isLocking ? `Khóa ${user.name}` : `Mở khóa ${user.name}`,
      description,
      placeholder: isLocking
        ? "Nhập lý do khóa tài khoản..."
        : "Nhập lý do mở khóa...",
      confirmLabel: isLocking ? "Khóa tài khoản" : "Mở khóa",
      danger: isLocking,
    });
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
