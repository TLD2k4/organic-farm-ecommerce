// src/components/ui/admin/users/UsersFilter.jsx

import ResponsiveSelect from "@/components/common/ResponsiveSelect";

const statusOptions = [
  {
    value: "",
    label: "Tất cả trạng thái",
  },
  {
    value: "1",
    label: "Hoạt động",
  },
  {
    value: "0",
    label: "Đã khóa",
  },
];

const deletedOptions = [
  {
    value: "",
    label: "Tất cả",
  },
  {
    value: "0",
    label: "Chưa xóa",
  },
  {
    value: "1",
    label: "Đã xóa",
  },
];

const limitOptions = [
  {
    value: 10,
    label: "10 / trang",
  },
  {
    value: 20,
    label: "20 / trang",
  },
  {
    value: 30,
    label: "30 / trang",
  },
  {
    value: 50,
    label: "50 / trang",
  },
];

export default function UsersFilter({ params, setParams }) {
  const clearFilter = () => {
    setParams({
      page: 1,
      limit: 10,
      keyword: "",
      status: "",
      deleted: "",
    });
  };

  return (
    <div
      className="
        grid
        min-w-0
        max-w-full
        grid-cols-1

        gap-3

        rounded-2xl

        border
        border-slate-200

        bg-white

        p-4

        shadow-sm

        sm:grid-cols-2
        sm:gap-4
        sm:p-5

        xl:grid-cols-5
      "
    >
      <input
        type="text"
        placeholder="Tìm tên hoặc email..."
        value={params.keyword}
        onChange={(event) =>
          setParams((previous) => ({
            ...previous,
            keyword: event.target.value,
            page: 1,
          }))
        }
        className="
          min-h-12
          min-w-0
          w-full

          rounded-xl

          border
          border-slate-200

          bg-white

          px-4
          py-3

          text-sm
          text-slate-700

          outline-none

          transition

          focus:border-green-500
          focus:ring-2
          focus:ring-green-100

          sm:text-base
        "
      />

      <ResponsiveSelect
        value={params.status}
        options={statusOptions}
        onChange={(value) =>
          setParams((previous) => ({
            ...previous,
            status: value,
            page: 1,
          }))
        }
      />

      <ResponsiveSelect
        value={params.deleted}
        options={deletedOptions}
        onChange={(value) =>
          setParams((previous) => ({
            ...previous,
            deleted: value,
            page: 1,
          }))
        }
      />

      <ResponsiveSelect
        value={params.limit}
        options={limitOptions}
        onChange={(value) =>
          setParams((previous) => ({
            ...previous,
            limit: Number(value),
            page: 1,
          }))
        }
      />

      <button
        type="button"
        onClick={clearFilter}
        className="
          min-h-12
          w-full

          rounded-xl

          bg-slate-200

          px-4
          py-3

          font-medium
          text-slate-700

          transition

          hover:bg-slate-300
        "
      >
        Xóa bộ lọc
      </button>
    </div>
  );
}
