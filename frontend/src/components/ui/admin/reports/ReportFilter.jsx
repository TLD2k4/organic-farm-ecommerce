import { RefreshCcw, Search } from "lucide-react";

import ResponsiveSelect from "@/components/common/ResponsiveSelect";

const groupOptions = [
  {
    value: "day",
    label: "Theo ngày",
  },
  {
    value: "month",
    label: "Theo tháng",
  },
  {
    value: "year",
    label: "Theo năm",
  },
];

const limitOptions = [
  {
    value: 5,
    label: "Top 5",
  },
  {
    value: 10,
    label: "Top 10",
  },
  {
    value: 20,
    label: "Top 20",
  },
  {
    value: 30,
    label: "Top 30",
  },
  {
    value: 50,
    label: "Top 50",
  },
];

const inputClassName = `
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

  disabled:cursor-not-allowed
  disabled:bg-slate-100
`;

export default function ReportFilter({
  value,
  loading,
  onChange,
  onApply,
  onReset,
}) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onApply();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="
        grid
        min-w-0
        grid-cols-1

        gap-4

        rounded-2xl

        border
        border-slate-200

        bg-white

        p-4

        shadow-sm

        sm:grid-cols-2
        sm:p-5

        xl:grid-cols-5
      "
    >
      <div className="min-w-0">
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Từ ngày
        </label>

        <input
          type="date"
          value={value.from_date}
          max={value.to_date || undefined}
          disabled={loading}
          onChange={(event) => onChange("from_date", event.target.value)}
          className={inputClassName}
        />
      </div>

      <div className="min-w-0">
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Đến ngày
        </label>

        <input
          type="date"
          value={value.to_date}
          min={value.from_date || undefined}
          disabled={loading}
          onChange={(event) => onChange("to_date", event.target.value)}
          className={inputClassName}
        />
      </div>

      <div className="min-w-0">
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Nhóm dữ liệu
        </label>

        <ResponsiveSelect
          value={value.group_by}
          options={groupOptions}
          disabled={loading}
          onChange={(selectedValue) => onChange("group_by", selectedValue)}
        />
      </div>

      <div className="min-w-0">
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Số lượng xếp hạng
        </label>

        <ResponsiveSelect
          value={value.limit}
          options={limitOptions}
          disabled={loading}
          onChange={(selectedValue) => onChange("limit", Number(selectedValue))}
        />
      </div>

      <div className="flex min-w-0 flex-col justify-end gap-2 sm:flex-row xl:flex-col">
        <button
          type="submit"
          disabled={loading}
          className="
            flex
            min-h-12
            w-full
            items-center
            justify-center

            gap-2

            rounded-xl

            bg-green-600

            px-4
            py-3

            font-semibold
            text-white

            transition

            hover:bg-green-700

            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          <Search size={18} />
          Áp dụng
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={onReset}
          className="
            flex
            min-h-12
            w-full
            items-center
            justify-center

            gap-2

            rounded-xl

            bg-slate-200

            px-4
            py-3

            font-semibold
            text-slate-700

            transition

            hover:bg-slate-300

            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >
          <RefreshCcw size={18} />
          Đặt lại
        </button>
      </div>
    </form>
  );
}
