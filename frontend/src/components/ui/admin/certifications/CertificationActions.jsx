import { useState } from "react";

import {
  Eye,
  Pencil,
  Lock,
  Unlock,
  RotateCcw,
  Trash2,
  Skull,
} from "lucide-react";

import useCertification from "@/hooks/useCertification";

import ConfirmButton from "@/components/common/ConfirmButton";

import { handleApi } from "@/utils/api";

export default function CertificationActions({
  certification,
  params,
  adminGetAll,
  setSelectedCertificationId,
  setOpenDrawer,
  setEditingCertificationId,
  setOpenForm,
}) {
  const { toggleStatus, deleteCert, restore, forceDelete } = useCertification();

  const [loading, setLoading] = useState(false);

  const reload = () => adminGetAll(params);

  const isDeleted = Boolean(certification.deleted_at);

  const handleView = () => {
    setSelectedCertificationId(certification.id);
    setOpenDrawer(true);
  };

  const handleEdit = () => {
    setEditingCertificationId(certification.id);
    setOpenForm(true);
  };

  const handleToggleStatus = async () => {
    try {
      setLoading(true);

      await handleApi(() => toggleStatus(certification.id), reload);
    } finally {
      setLoading(false);
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
            title="Chỉnh sửa"
            onClick={handleEdit}
            className="
              cursor-pointer
              rounded-lg
              bg-indigo-500
              p-2
              text-white
              transition
              hover:bg-indigo-600
            "
          >
            <Pencil size={16} />
          </button>

          <button
            type="button"
            disabled={loading}
            title={certification.status ? "Ẩn chứng chỉ" : "Hiển thị chứng chỉ"}
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
                certification.status
                  ? "bg-yellow-500 hover:bg-yellow-600"
                  : "bg-green-600 hover:bg-green-700"
              }
            `}
          >
            {certification.status ? <Lock size={16} /> : <Unlock size={16} />}
          </button>

          <ConfirmButton
            title="Xóa mềm chứng chỉ?"
            tooltip="Xóa mềm"
            onConfirm={() =>
              handleApi(() => deleteCert(certification.id), reload)
            }
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
            title="Khôi phục chứng chỉ?"
            tooltip="Khôi phục"
            type="success"
            onConfirm={() => handleApi(() => restore(certification.id), reload)}
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
            title="Xóa vĩnh viễn chứng chỉ?"
            tooltip="Xóa vĩnh viễn"
            onConfirm={() =>
              handleApi(() => forceDelete(certification.id), reload)
            }
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
