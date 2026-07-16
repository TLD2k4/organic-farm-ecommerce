import { ImageIcon } from "lucide-react";

import CategoryActions from "./CategoryActions";

import StatusBadge from "@/components/common/StatusBadge";

import { highlight } from "@/utils/highlight";
import { getImageUrl } from "@/utils/image";
import { getParentBadgeColor } from "@/utils/categoryBadge";

const categoryStatusConfig = {
  1: {
    label: "Hiển thị",
    className: "bg-green-100 text-green-700",
  },

  0: {
    label: "Đã ẩn",
    className: "bg-slate-200 text-slate-700",
  },
};

export default function CategoriesTable({
  categories,
  loading,
  params,
  adminGetAll,
  setSelectedCategoryId,
  setOpenDrawer,
  setEditingCategoryId,
  setOpenForm,
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(8)].map((_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded-xl bg-slate-200"
          />
        ))}
      </div>
    );
  }

  if (!categories.length) {
    return (
      <div
        className="
          rounded-2xl

          border
          border-slate-200

          bg-white

          px-4
          py-12

          text-center
          text-sm
          text-slate-500

          sm:text-base
        "
      >
        Không có danh mục nào.
      </div>
    );
  }

  return (
    <div
      className="
        max-w-full
        overflow-hidden

        rounded-2xl

        border
        border-slate-200

        bg-white

        shadow-sm
      "
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-270">
          <thead className="bg-slate-100">
            <tr>
              <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-bold">
                ID
              </th>

              <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-bold">
                Ảnh
              </th>

              <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-bold">
                Tên danh mục
              </th>

              <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-bold">
                Slug
              </th>

              <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-bold">
                Danh mục cha
              </th>

              <th className="whitespace-nowrap px-4 py-4 text-center text-sm font-bold">
                Trạng thái
              </th>

              <th className="whitespace-nowrap px-4 py-4 text-center text-sm font-bold">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody>
            {categories.map((category) => (
              <tr
                key={category.id}
                className="border-t border-slate-100 transition hover:bg-slate-50"
              >
                <td className="whitespace-nowrap px-4 py-4">#{category.id}</td>

                <td className="px-4 py-4">
                  {category.image ? (
                    <img
                      src={getImageUrl(category.image)}
                      alt={category.name}
                      className="
                        h-12
                        w-12
                        rounded-xl
                        border
                        border-slate-200
                        object-cover
                      "
                    />
                  ) : (
                    <div
                      className="
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center

                        rounded-xl

                        bg-slate-100

                        text-slate-400
                      "
                    >
                      <ImageIcon size={20} />
                    </div>
                  )}
                </td>

                <td className="px-4 py-4 font-semibold">
                  <div className="max-w-55">
                    {highlight(category.name, params.keyword)}
                  </div>
                </td>

                <td className="px-4 py-4 text-sm text-slate-500">
                  <div className="max-w-57.5 wrap-break-word">
                    {highlight(category.slug, params.keyword)}
                  </div>
                </td>

                <td className="px-4 py-4">
                  {category.parent ? (
                    <span
                      className={`
                        inline-flex
                        whitespace-nowrap
                        rounded-full
                        px-3
                        py-1
                        text-sm
                        font-semibold

                        ${getParentBadgeColor(category.parent.id)}
                      `}
                    >
                      {category.parent.name}
                    </span>
                  ) : (
                    <span
                      className="
                        inline-flex
                        whitespace-nowrap
                        rounded-full
                        bg-slate-800
                        px-3
                        py-1
                        text-sm
                        font-semibold
                        text-white
                      "
                    >
                      Danh mục gốc
                    </span>
                  )}
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-center">
                  <StatusBadge
                    status={category.status}
                    deletedAt={category.deleted_at}
                    config={categoryStatusConfig}
                  />
                </td>

                <td className="px-4 py-4">
                  <CategoryActions
                    category={category}
                    params={params}
                    adminGetAll={adminGetAll}
                    setSelectedCategoryId={setSelectedCategoryId}
                    setOpenDrawer={setOpenDrawer}
                    setEditingCategoryId={setEditingCategoryId}
                    setOpenForm={setOpenForm}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
