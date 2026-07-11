import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import useCertification from "@/hooks/useCertification";
import useDebounce from "@/hooks/useDebounce";

import Pagination from "@/components/common/Pagination";

import CertificationsTable from "@/components/ui/admin/certifications/CertificationsTable";
import CertificationDrawer from "@/components/ui/admin/certifications/CertificationDrawer";
import CertificationFormModal from "@/components/ui/admin/certifications/CertificationFormModal";
import CertificationsFilter from "@/components/ui/admin/certifications/CertificationsFilter";

export default function CertificationsPage() {
  const { certifications, meta, loading, adminGetAll } = useCertification();

  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    keyword: "",
    status: "",
    deleted: "",
  });

  const debouncedKeyword = useDebounce(params.keyword, 500);

  const [selectedCertificationId, setSelectedCertificationId] = useState(null);

  const [openDrawer, setOpenDrawer] = useState(false);
  const [openForm, setOpenForm] = useState(false);

  const [editingCertificationId, setEditingCertificationId] = useState(null);

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
            Quản lý chứng chỉ
          </h1>

          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            Quản lý chứng chỉ sử dụng trong hệ thống
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingCertificationId(null);
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
          Thêm chứng chỉ
        </button>
      </div>

      {/* FILTER */}
      <CertificationsFilter params={params} setParams={setParams} />

      {/* TABLE */}
      <CertificationsTable
        certifications={certifications}
        loading={loading}
        params={params}
        adminGetAll={adminGetAll}
        setSelectedCertificationId={setSelectedCertificationId}
        setOpenDrawer={setOpenDrawer}
        setEditingCertificationId={setEditingCertificationId}
        setOpenForm={setOpenForm}
      />

      {/* PAGINATION */}
      <Pagination meta={meta} params={params} setParams={setParams} />

      {/* DRAWER */}
      <CertificationDrawer
        open={openDrawer}
        certificationId={selectedCertificationId}
        onClose={() => {
          setOpenDrawer(false);
          setSelectedCertificationId(null);
        }}
      />

      {/* FORM */}
      {openForm && (
        <CertificationFormModal
          open={openForm}
          certificationId={editingCertificationId}
          onClose={() => {
            setOpenForm(false);
            setEditingCertificationId(null);
          }}
          onSuccess={reload}
        />
      )}
    </div>
  );
}
