import { useEffect } from "react";
import { X } from "lucide-react";

import useUser from "@/hooks/useUser";

import { getImageUrl } from "@/utils/image";
import { formatDate } from "@/utils/date";
import { roleBadgeClass, roleLabel } from "@/utils/role";

import StatusBadge from "@/components/common/StatusBadge";

const userStatusConfig = {
  1: {
    label: "Hoạt động",
    className: "bg-green-100 text-green-700",
  },

  0: {
    label: "Đã khóa",
    className: "bg-yellow-100 text-yellow-700",
  },
};

export default function UserDrawer({ open, onClose, userId }) {
  const { getById, user, loading } = useUser();

  useEffect(() => {
    if (open && userId) {
      getById(userId);
    }
  }, [open, userId, getById]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-60">
      <button
        type="button"
        aria-label="Đóng chi tiết người dùng"
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
          <h2 className="text-lg font-bold sm:text-xl">Chi tiết người dùng</h2>

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
          {loading || !user ? (
            <div className="animate-pulse space-y-4">
              <div className="mx-auto h-24 w-24 rounded-full bg-slate-200" />
              <div className="h-6 w-1/2 rounded bg-slate-200" />
              <div className="h-5 w-full rounded bg-slate-200" />
              <div className="h-5 w-2/3 rounded bg-slate-200" />
              <div className="h-5 w-1/3 rounded bg-slate-200" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex justify-center">
                {user.avatar ? (
                  <img
                    src={getImageUrl(user.avatar)}
                    alt={user.name}
                    className="
                      h-24
                      w-24
                      rounded-full
                      border
                      border-slate-200
                      object-cover
                    "
                  />
                ) : (
                  <div
                    className="
                      flex
                      h-24
                      w-24
                      items-center
                      justify-center

                      rounded-full

                      bg-green-100

                      text-3xl
                      font-bold
                      text-green-700
                    "
                  >
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </div>

              <DetailItem label="ID" value={`#${user.id}`} />

              <DetailItem label="Họ và tên" value={user.name} />

              <DetailItem label="Email" value={user.email} breakWord />

              <DetailItem
                label="Số điện thoại"
                value={user.phone || "Chưa cập nhật"}
              />

              <div>
                <p className="mb-2 text-sm text-slate-500">Vai trò</p>

                <div className="flex flex-wrap gap-2">
                  {user.roles?.length ? (
                    user.roles.map((role) => (
                      <span
                        key={role}
                        className={`
                          rounded-full
                          px-3
                          py-1
                          text-xs
                          font-semibold

                          ${roleBadgeClass(role)}
                        `}
                      >
                        {roleLabel(role)}
                      </span>
                    ))
                  ) : (
                    <p className="text-slate-500">Chưa có vai trò.</p>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm text-slate-500">Trạng thái</p>

                <StatusBadge
                  status={user.status}
                  deletedAt={user.deleted_at}
                  config={userStatusConfig}
                />
              </div>

              {user.farm && (
                <div
                  className="
                    space-y-3

                    rounded-xl

                    border
                    border-green-100

                    bg-green-50

                    p-4
                  "
                >
                  <h3 className="font-semibold text-green-700">
                    Thông tin nông trại
                  </h3>

                  <DetailItem label="ID" value={`#${user.farm.id}`} />

                  <DetailItem label="Tên nông trại" value={user.farm.name} />

                  <DetailItem label="Slug" value={user.farm.slug} breakWord />

                  <DetailItem
                    label="Trạng thái"
                    value={getFarmStatusLabel(user.farm.status)}
                  />

                  <DetailItem
                    label="Ngày tạo"
                    value={formatDate(user.farm.created_at)}
                  />

                  <DetailItem
                    label="Cập nhật"
                    value={formatDate(user.farm.updated_at)}
                  />

                  {user.farm.deleted_at && (
                    <DetailItem
                      label="Đã xóa lúc"
                      value={formatDate(user.farm.deleted_at)}
                    />
                  )}
                </div>
              )}

              <DetailItem
                label="Ngày tạo"
                value={formatDate(user.created_at)}
              />

              <DetailItem
                label="Cập nhật"
                value={formatDate(user.updated_at)}
              />

              {user.deleted_at && (
                <DetailItem
                  label="Thời gian xóa"
                  value={formatDate(user.deleted_at)}
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
          text-slate-800

          ${breakWord ? "wrap-break-word" : ""}
        `}
      >
        {value || "—"}
      </p>
    </div>
  );
}

function getFarmStatusLabel(status) {
  const labels = {
    0: "Chờ duyệt",
    1: "Đã duyệt",
    2: "Từ chối",
    3: "Đình chỉ",
  };

  return labels[Number(status)] || "Không xác định";
}
