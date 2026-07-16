import UserActions from "./UserActions";

import { roleLabel, roleBadgeClass } from "@/utils/role";
import { getImageUrl } from "@/utils/image";
import { highlight } from "@/utils/highlight";

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

export default function UsersTable({
  users,
  loading,
  params,
  getAll,
  setSelectedUserId,
  setOpenDrawer,
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

  if (!users.length) {
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
        Không có người dùng nào.
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
        <table className="w-full min-w-237.5">
          <thead className="bg-slate-100">
            <tr>
              <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-bold">
                ID
              </th>

              <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-bold">
                Người dùng
              </th>

              <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-bold">
                Email
              </th>

              <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-bold">
                Vai trò
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
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-t border-slate-100 transition hover:bg-slate-50"
              >
                <td className="whitespace-nowrap px-4 py-4">#{user.id}</td>

                <td className="px-4 py-4">
                  <div className="flex min-w-45 items-center gap-3">
                    {user.avatar ? (
                      <img
                        src={getImageUrl(user.avatar)}
                        alt={user.name}
                        className="
                          h-10
                          w-10
                          shrink-0
                          rounded-full
                          object-cover
                        "
                      />
                    ) : (
                      <div
                        className="
                          flex
                          h-10
                          w-10
                          shrink-0
                          items-center
                          justify-center

                          rounded-full

                          bg-green-100

                          font-bold
                          text-green-700
                        "
                      >
                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="max-w-55 truncate font-semibold">
                        {highlight(user.name, params.keyword)}
                      </p>

                      <p className="text-xs text-slate-500">#{user.id}</p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="max-w-65 truncate">
                    {highlight(user.email, params.keyword)}
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="flex min-w-32.5 flex-wrap gap-1">
                    {user.roles?.length ? (
                      user.roles.map((role) => (
                        <span
                          key={role}
                          className={`
                            rounded-full
                            px-2.5
                            py-1
                            text-xs
                            font-medium

                            ${roleBadgeClass(role)}
                          `}
                        >
                          {roleLabel(role)}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">
                        Chưa có vai trò
                      </span>
                    )}
                  </div>
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-center">
                  <StatusBadge
                    status={user.status}
                    deletedAt={user.deleted_at}
                    config={userStatusConfig}
                  />
                </td>

                <td className="px-4 py-4">
                  <UserActions
                    user={user}
                    params={params}
                    getAll={getAll}
                    setSelectedUserId={setSelectedUserId}
                    setOpenDrawer={setOpenDrawer}
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
