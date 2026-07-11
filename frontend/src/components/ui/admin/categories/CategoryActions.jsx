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

import useCategory from "@/hooks/useCategory";

import ConfirmButton from "@/components/common/ConfirmButton";

import { handleApi } from "@/utils/api";

export default function CategoryActions({
  category,
  params,
  adminGetAll,
  setSelectedCategoryId,
  setOpenDrawer,
  setEditingCategoryId,
  setOpenForm,
}) {
  const { toggleStatus, deleteCategory, restore, forceDelete } = useCategory();

  const [loading, setLoading] = useState(false);

  const reload = () => adminGetAll(params);

  const isDeleted = Boolean(category.deleted_at);

  const handleView = () => {
    setSelectedCategoryId(category.id);
    setOpenDrawer(true);
  };

  const handleEdit = () => {
    setEditingCategoryId(category.id);
    setOpenForm(true);
  };

  const handleToggleStatus = async () => {
    try {
      setLoading(true);

      await handleApi(() => toggleStatus(category.id), reload);
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
            title={category.status ? "Ẩn danh mục" : "Hiển thị danh mục"}
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
                category.status
                  ? "bg-yellow-500 hover:bg-yellow-600"
                  : "bg-green-600 hover:bg-green-700"
              }
            `}
          >
            {category.status ? <Lock size={16} /> : <Unlock size={16} />}
          </button>

          <ConfirmButton
            title="Xóa mềm danh mục?"
            tooltip="Xóa mềm"
            onConfirm={() =>
              handleApi(() => deleteCategory(category.id), reload)
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
            title="Khôi phục danh mục?"
            tooltip="Khôi phục"
            type="success"
            onConfirm={() => handleApi(() => restore(category.id), reload)}
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
            title="Xóa vĩnh viễn danh mục?"
            tooltip="Xóa vĩnh viễn"
            onConfirm={() => handleApi(() => forceDelete(category.id), reload)}
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
