import { useEffect } from "react";
import { X } from "lucide-react";

import useCertification from "@/hooks/useCertification";

import { formatDate } from "@/utils/date";

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

export default function CertificationDrawer({
  open,
  onClose,
  certificationId,
}) {
  const { certification, loading, adminGetById } = useCertification();

  useEffect(() => {
    if (open && certificationId) {
      adminGetById(certificationId);
    }
  }, [open, certificationId, adminGetById]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-60">
      <button
        type="button"
        aria-label="Đóng chi tiết chứng chỉ"
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
          <h2 className="text-lg font-bold sm:text-xl">Chi tiết chứng chỉ</h2>

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
          {loading || !certification ? (
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-1/2 rounded bg-slate-200" />
              <div className="h-5 w-full rounded bg-slate-200" />
              <div className="h-5 w-2/3 rounded bg-slate-200" />
              <div className="h-5 w-1/3 rounded bg-slate-200" />
            </div>
          ) : (
            <div className="space-y-5">
              <DetailItem label="ID" value={`#${certification.id}`} />

              <DetailItem label="Tên chứng chỉ" value={certification.name} />

              <div>
                <p className="mb-1 text-sm text-slate-500">Mô tả</p>

                <p className="whitespace-pre-wrap wrap-break-word">
                  {certification.description || "—"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm text-slate-500">Trạng thái</p>

                <StatusBadge
                  status={certification.status}
                  deletedAt={certification.deleted_at}
                  config={certificationStatusConfig}
                />
              </div>

              <DetailItem
                label="Ngày tạo"
                value={formatDate(certification.created_at)}
              />

              <DetailItem
                label="Cập nhật"
                value={formatDate(certification.updated_at)}
              />

              {certification.deleted_at && (
                <DetailItem
                  label="Thời gian xóa"
                  value={formatDate(certification.deleted_at)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="mb-1 text-sm text-slate-500">{label}</p>

      <p className="font-semibold wrap-break-word">{value || "—"}</p>
    </div>
  );
}
