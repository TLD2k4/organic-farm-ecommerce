import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import useCategory from "@/hooks/useCategory";
import useDebounce from "@/hooks/useDebounce";

import Pagination from "@/components/common/Pagination";

import CategoriesFilter from "@/components/ui/admin/categories/CategoriesFilter";
import CategoriesTable from "@/components/ui/admin/categories/CategoriesTable";
import CategoryDrawer from "@/components/ui/admin/categories/CategoryDrawer";
import CategoryFormModal from "@/components/ui/admin/categories/CategoryFormModal";

export default function CategoriesPage() {
  const { categories, meta, loading, adminGetAll } = useCategory();

  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    keyword: "",
    status: "",
    deleted: "",
  });

  const debouncedKeyword = useDebounce(params.keyword, 500);

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const [openDrawer, setOpenDrawer] = useState(false);
  const [openForm, setOpenForm] = useState(false);

  useEffect(() => {
    adminGetAll({
      ...params,
      keyword: debouncedKeyword,
    });
  }, [
    params.page,
    params.limit,
    params.status,
    params.deleted,
    debouncedKeyword,
    adminGetAll,
  ]);

  const reload = () => {
    return adminGetAll({
      ...params,
      keyword: debouncedKeyword,
    });
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* HEADER */}
      <div
        className="
          flex
          flex-col

          gap-4

          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Quản lý danh mục
          </h1>

          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            Quản lý danh mục sản phẩm và danh mục con
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingCategoryId(null);
            setOpenForm(true);
          }}
          className="
            flex
            w-full
            shrink-0
            items-center
            justify-center

            gap-2

            rounded-xl

            bg-green-600

            px-5
            py-3

            font-semibold
            text-white

            transition

            hover:bg-green-700

            sm:w-auto
          "
        >
          <Plus size={18} />
          Thêm danh mục
        </button>
      </div>

      {/* FILTER */}
      <CategoriesFilter params={params} setParams={setParams} />

      {/* TABLE */}
      <CategoriesTable
        categories={categories}
        loading={loading}
        params={params}
        adminGetAll={adminGetAll}
        setSelectedCategoryId={setSelectedCategoryId}
        setOpenDrawer={setOpenDrawer}
        setEditingCategoryId={setEditingCategoryId}
        setOpenForm={setOpenForm}
      />

      {/* PAGINATION */}
      <Pagination meta={meta} params={params} setParams={setParams} />

      {/* DRAWER */}
      <CategoryDrawer
        open={openDrawer}
        categoryId={selectedCategoryId}
        onClose={() => {
          setOpenDrawer(false);
          setSelectedCategoryId(null);
        }}
      />

      {/* FORM */}
      {openForm && (
        <CategoryFormModal
          open={openForm}
          categoryId={editingCategoryId}
          onClose={() => {
            setOpenForm(false);
            setEditingCategoryId(null);
          }}
          onSuccess={reload}
        />
      )}
    </div>
  );
}
