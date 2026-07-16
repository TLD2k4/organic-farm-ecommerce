import ResponsiveSelect from "@/components/common/ResponsiveSelect";

const orderStatusOptions = [
  { value: "", label: "Tất cả trạng thái đơn" },
  { value: "0", label: "Chờ xử lý" },
  { value: "1", label: "Đang xử lý" },
  { value: "2", label: "Đang giao" },
  { value: "3", label: "Đã giao" },
  { value: "4", label: "Đã hủy" },
];

const subOrderStatusOptions = [
  { value: "", label: "Tất cả trạng thái đơn" },
  { value: "0", label: "Chờ xử lý" },
  { value: "1", label: "Chuẩn bị hàng" },
  { value: "2", label: "Đang giao" },
  { value: "3", label: "Hoàn tất" },
  { value: "4", label: "Đã hủy" },
];

const paymentStatusOptions = [
  { value: "", label: "Tất cả thanh toán" },
  { value: "0", label: "Chờ thanh toán" },
  { value: "1", label: "Đã thanh toán" },
  { value: "2", label: "Thất bại" },
  { value: "3", label: "Đã hoàn tiền" },
];

const paymentMethodOptions = [
  { value: "", label: "Tất cả phương thức" },
  { value: "COD", label: "COD" },
  { value: "MOMO", label: "MoMo" },
];

const deletedOptions = [
  { value: "", label: "Tất cả dữ liệu" },
  { value: "0", label: "Chưa xóa" },
  { value: "1", label: "Đã xóa" },
];

const limitOptions = [10, 20, 30, 50].map((value) => ({
  value,
  label: `${value} / trang`,
}));

export default function AdminOrdersFilter({
  mode,
  params,
  setParams,
  farms = [],
}) {
  const update = (name, value) => {
    setParams((previous) => ({
      ...previous,
      [name]: value,
      page: 1,
    }));
  };

  const reset = () => {
    setParams({
      page: 1,
      per_page: 10,
      keyword: "",
      farm_id: "",
      status: "",
      payment_status: "",
      payment_method: "",
      date_from: "",
      date_to: "",
      deleted: "",
    });
  };

  const farmOptions = [
    { value: "", label: "Tất cả nông trại" },
    ...farms.map((farm) => ({
      value: farm.id,
      label: `${farm.name}${farm.deleted_at ? " (đã xóa)" : ""}`,
    })),
  ];

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
      <input
        type="text"
        value={params.keyword}
        onChange={(event) => update("keyword", event.target.value)}
        placeholder="Mã đơn, khách hàng, SĐT, sản phẩm..."
        className="min-h-12 w-full rounded-xl border border-slate-200 px-4 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
      />

      {mode === "sub_orders" && (
        <ResponsiveSelect
          value={params.farm_id}
          options={farmOptions}
          onChange={(value) => update("farm_id", value)}
        />
      )}

      <ResponsiveSelect
        value={params.status}
        options={
          mode === "orders" ? orderStatusOptions : subOrderStatusOptions
        }
        onChange={(value) => update("status", value)}
      />

      <ResponsiveSelect
        value={params.payment_status}
        options={paymentStatusOptions}
        onChange={(value) => update("payment_status", value)}
      />

      <ResponsiveSelect
        value={params.payment_method}
        options={paymentMethodOptions}
        onChange={(value) => update("payment_method", value)}
      />

      <label className="min-w-0">
        <span className="mb-1 block text-xs font-semibold text-slate-500">
          Từ ngày
        </span>
        <input
          type="date"
          value={params.date_from}
          onChange={(event) => update("date_from", event.target.value)}
          className="min-h-12 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
        />
      </label>

      <label className="min-w-0">
        <span className="mb-1 block text-xs font-semibold text-slate-500">
          Đến ngày
        </span>
        <input
          type="date"
          value={params.date_to}
          onChange={(event) => update("date_to", event.target.value)}
          className="min-h-12 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
        />
      </label>

      <ResponsiveSelect
        value={params.deleted}
        options={deletedOptions}
        onChange={(value) => update("deleted", value)}
      />

      <ResponsiveSelect
        value={params.per_page}
        options={limitOptions}
        onChange={(value) => update("per_page", Number(value))}
      />

      <button
        type="button"
        onClick={reset}
        className="min-h-12 rounded-xl bg-slate-200 px-4 font-semibold text-slate-700 transition hover:bg-slate-300"
      >
        Xóa bộ lọc
      </button>
    </div>
  );
}
