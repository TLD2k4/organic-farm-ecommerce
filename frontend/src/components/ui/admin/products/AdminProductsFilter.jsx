import ResponsiveSelect from "@/components/common/ResponsiveSelect";

const productStatusOptions = [
  { value: "", label: "Tất cả trạng thái sản phẩm" },
  { value: "0", label: "Chờ duyệt" },
  { value: "1", label: "Đang bán" },
  { value: "2", label: "Bị từ chối" },
  { value: "3", label: "Tạm ẩn" },
];

const certificateStatusOptions = [
  { value: "", label: "Tất cả hồ sơ chứng chỉ" },
  { value: "pending", label: "Chứng chỉ chờ duyệt" },
  { value: "approved", label: "Chứng chỉ đã duyệt" },
  { value: "rejected", label: "Chứng chỉ bị từ chối" },
  { value: "expired", label: "Chứng chỉ hết hạn" },
  { value: "replaced", label: "Chứng chỉ đã thay thế" },
];

const deletedOptions = [
  { value: "", label: "Tất cả dữ liệu" },
  { value: "0", label: "Chưa xóa" },
  { value: "1", label: "Đã xóa" },
];

const limitOptions = [
  { value: 10, label: "10 / trang" },
  { value: 20, label: "20 / trang" },
  { value: 30, label: "30 / trang" },
  { value: 50, label: "50 / trang" },
];

export default function AdminProductsFilter({
  params,
  setParams,
  options,
  loading = false,
}) {
  const farmOptions = [
    { value: "", label: "Tất cả nông trại" },
    ...(options?.farms ?? []).map((farm) => ({
      value: farm.id,
      label: `${farm.name}${farm.deleted_at ? " — Đã xóa" : ""}`,
    })),
  ];

  const categoryOptions = [
    { value: "", label: "Tất cả danh mục" },
    ...(options?.categories ?? []).map((category) => ({
      value: category.id,
      label: `${category.name}${category.deleted_at ? " — Đã xóa" : ""}`,
    })),
  ];

  const updateParam = (field, value) => {
    setParams((previous) => ({
      ...previous,
      [field]: value,
      page: 1,
    }));
  };

  const clearFilter = () => {
    setParams({
      page: 1,
      limit: 10,
      keyword: "",
      status: "",
      certificate_status: "",
      farm_id: "",
      category_id: "",
      deleted: "0",
    });
  };

  return (
    <div className="grid min-w-0 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-9">
      <input
        type="search"
        value={params.keyword}
        disabled={loading}
        maxLength={100}
        placeholder="Tìm sản phẩm, farm, seller, số chứng chỉ..."
        onChange={(event) =>
          updateParam("keyword", event.target.value)
        }
        className="min-h-12 min-w-0 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:bg-slate-100 sm:col-span-2 2xl:col-span-2"
      />

      <ResponsiveSelect
        value={params.status}
        options={productStatusOptions}
        disabled={loading}
        onChange={(value) => updateParam("status", value)}
      />

      <ResponsiveSelect
        value={params.certificate_status}
        options={certificateStatusOptions}
        disabled={loading}
        onChange={(value) =>
          updateParam("certificate_status", value)
        }
      />

      <ResponsiveSelect
        value={params.farm_id}
        options={farmOptions}
        disabled={loading}
        onChange={(value) => updateParam("farm_id", value)}
      />

      <ResponsiveSelect
        value={params.category_id}
        options={categoryOptions}
        disabled={loading}
        onChange={(value) => updateParam("category_id", value)}
      />

      <ResponsiveSelect
        value={params.deleted}
        options={deletedOptions}
        disabled={loading}
        onChange={(value) => updateParam("deleted", value)}
      />

      <div className="grid grid-cols-2 gap-3 sm:col-span-2 xl:col-span-2 2xl:col-span-2">
        <ResponsiveSelect
          value={params.limit}
          options={limitOptions}
          disabled={loading}
          onChange={(value) =>
            updateParam("limit", Number(value))
          }
        />

        <button
          type="button"
          disabled={loading}
          onClick={clearFilter}
          className="min-h-12 rounded-xl bg-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Xóa lọc
        </button>
      </div>
    </div>
  );
}
