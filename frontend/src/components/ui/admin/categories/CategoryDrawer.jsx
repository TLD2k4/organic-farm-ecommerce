import { useEffect } from "react";
import { ImageIcon, X } from "lucide-react";

import useCategory from "@/hooks/useCategory";

import StatusBadge from "@/components/common/StatusBadge";

import { formatDate } from "@/utils/date";
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

export default function CategoryDrawer({ open, onClose, categoryId }) {
  const { category, detailLoading, adminGetById } = useCategory();

  useEffect(() => {
    if (open && categoryId) {
      adminGetById(categoryId);
    }
  }, [open, categoryId, adminGetById]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-60">
      <button
        type="button"
        aria-label="Đóng chi tiết danh mục"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div
        className="
          absolute
          right-0
          top-0

          h-full
          w-full

          overflow-y-auto
          overscroll-contain

          bg-white

          shadow-xl

          sm:max-w-lg
        "
      >
        <div
          className="
            sticky
            top-0
            z-10

            flex
            items-center
            justify-between

            border-b
            border-slate-200

            bg-white

            p-4

            sm:p-5
          "
        >
          <h2 className="text-lg font-bold sm:text-xl">Chi tiết danh mục</h2>

          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="
              rounded-lg
              p-2
              transition
              hover:bg-slate-100
            "
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {detailLoading || !category ? (
            <div className="animate-pulse space-y-4">
              <div className="h-40 rounded-2xl bg-slate-200 sm:h-52" />
              <div className="h-6 w-1/2 rounded bg-slate-200" />
              <div className="h-5 w-full rounded bg-slate-200" />
              <div className="h-5 w-2/3 rounded bg-slate-200" />
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                {category.image ? (
                  <img
                    src={getImageUrl(category.image)}
                    alt={category.name}
                    className="
                      h-44
                      w-full
                      rounded-2xl
                      border
                      border-slate-200
                      object-cover

                      sm:h-52
                    "
                  />
                ) : (
                  <div
                    className="
                      flex
                      h-44
                      w-full
                      items-center
                      justify-center

                      rounded-2xl

                      bg-slate-100

                      text-slate-400

                      sm:h-52
                    "
                  >
                    <ImageIcon size={48} />
                  </div>
                )}
              </div>

              <DetailItem label="ID" value={`#${category.id}`} />

              <DetailItem label="Tên danh mục" value={category.name} />

              <DetailItem label="Slug" value={category.slug} breakWord />

              <div>
                <p className="mb-2 text-sm text-slate-500">Danh mục cha</p>

                {category.parent ? (
                  <span
                    className={`
                      inline-flex
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
              </div>

              <div>
                <p className="mb-1 text-sm text-slate-500">Mô tả</p>

                <p className="whitespace-pre-wrap wrap-break-word">
                  {category.description || "—"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm text-slate-500">Danh mục con</p>

                {category.children?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {category.children.map((child) => (
                      <span
                        key={child.id}
                        className="
                          rounded-lg

                          bg-green-50

                          px-3
                          py-2

                          text-sm
                          font-semibold
                          text-green-700
                        "
                      >
                        {child.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">Không có danh mục con.</p>
                )}
              </div>

              <div>
                <p className="mb-2 text-sm text-slate-500">Trạng thái</p>

                <StatusBadge
                  status={category.status}
                  deletedAt={category.deleted_at}
                  config={categoryStatusConfig}
                />
              </div>

              <DetailItem
                label="Ngày tạo"
                value={formatDate(category.created_at)}
              />

              <DetailItem
                label="Cập nhật"
                value={formatDate(category.updated_at)}
              />

              {category.deleted_at && (
                <DetailItem
                  label="Thời gian xóa"
                  value={formatDate(category.deleted_at)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, breakWord = false }) {
  return (
    <div>
      <p className="mb-1 text-sm text-slate-500">{label}</p>

      <p
        className={`
          font-semibold

          ${breakWord ? "wrap-break-word" : ""}
        `}
      >
        {value || "—"}
      </p>
    </div>
  );
}
