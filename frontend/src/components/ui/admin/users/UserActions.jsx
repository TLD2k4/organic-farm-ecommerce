import { Eye, Lock, Unlock, RotateCcw, Trash2, Skull } from "lucide-react";

import { useState } from "react";

import useUser from "@/hooks/useUser";

import ConfirmButton from "@/components/common/ConfirmButton";

import { handleApi } from "@/utils/api";

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
    try {
      setLoadingId(user.id);

      await handleApi(() => toggleStatus(user.id), reload);
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
            onConfirm={() => handleApi(() => deleteUser(user.id), reload)}
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
            onConfirm={() => handleApi(() => forceDelete(user.id), reload)}
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
