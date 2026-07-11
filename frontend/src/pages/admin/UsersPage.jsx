import { useEffect, useState } from "react";

import useUser from "@/hooks/useUser";
import useDebounce from "@/hooks/useDebounce";

import Pagination from "@/components/common/Pagination";

import UsersTable from "@/components/ui/admin/users/UsersTable";
import UsersFilter from "@/components/ui/admin/users/UsersFilter";
import UserDrawer from "@/components/ui/admin/users/UserDrawer";

export default function UsersPage() {
  const { users, meta, loading, getAll } = useUser();

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);

  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    keyword: "",
    status: "",
    deleted: "",
  });

  const debouncedKeyword = useDebounce(params.keyword, 500);

  useEffect(() => {
    getAll({
      ...params,
      keyword: debouncedKeyword,
    });
  }, [
    params.page,
    params.limit,
    params.status,
    params.deleted,
    debouncedKeyword,
    getAll,
  ]);

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* HEADER */}
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Quản lý người dùng
        </h1>

        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          Quản lý tài khoản người dùng trong hệ thống
        </p>
      </div>

      {/* FILTER */}
      <UsersFilter params={params} setParams={setParams} />

      {/* TABLE */}
      <UsersTable
        users={users}
        loading={loading}
        params={params}
        getAll={getAll}
        setSelectedUserId={setSelectedUserId}
        setOpenDrawer={setOpenDrawer}
      />

      {/* PAGINATION */}
      <Pagination meta={meta} params={params} setParams={setParams} />

      {/* DRAWER */}
      <UserDrawer
        open={openDrawer}
        userId={selectedUserId}
        onClose={() => {
          setOpenDrawer(false);
          setSelectedUserId(null);
        }}
      />
    </div>
  );
}
