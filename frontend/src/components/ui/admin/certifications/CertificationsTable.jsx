import CertificationActions from "./CertificationActions";

import { highlight } from "@/utils/highlight";

import StatusBadge from "@/components/common/StatusBadge";

const certificationStatusConfig = {
  1: {
    label: "Hiển thị",
    className: "bg-green-100 text-green-700",
  },

  0: {
    label: "Đã ẩn",
    className: "bg-slate-200 text-slate-700",
  },
};

export default function CertificationsTable({
  certifications,
  loading,
  params,
  adminGetAll,
  setSelectedCertificationId,
  setOpenDrawer,
  setEditingCertificationId,
  setOpenForm,
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

  if (!certifications.length) {
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
        Không có chứng chỉ nào.
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
        <table className="w-full min-w-[850px]">
          <thead className="bg-slate-100">
            <tr>
              <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-bold">
                ID
              </th>

              <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-bold">
                Tên chứng chỉ
              </th>

              <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-bold">
                Mô tả
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
            {certifications.map((certification) => (
              <tr
                key={certification.id}
                className="border-t border-slate-100 transition hover:bg-slate-50"
              >
                <td className="whitespace-nowrap px-4 py-4">
                  #{certification.id}
                </td>

                <td className="px-4 py-4 font-semibold">
                  <div className="max-w-[220px]">
                    {highlight(certification.name, params.keyword)}
                  </div>
                </td>

                <td className="px-4 py-4 text-slate-600">
                  <div className="max-w-[380px] wrap-break-word">
                    {highlight(
                      certification.description || "—",
                      params.keyword,
                    )}
                  </div>
                </td>

                <td className="whitespace-nowrap px-4 py-4 text-center">
                  <StatusBadge
                    status={certification.status}
                    deletedAt={certification.deleted_at}
                    config={certificationStatusConfig}
                  />
                </td>

                <td className="px-4 py-4">
                  <CertificationActions
                    certification={certification}
                    params={params}
                    adminGetAll={adminGetAll}
                    setSelectedCertificationId={setSelectedCertificationId}
                    setOpenDrawer={setOpenDrawer}
                    setEditingCertificationId={setEditingCertificationId}
                    setOpenForm={setOpenForm}
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
