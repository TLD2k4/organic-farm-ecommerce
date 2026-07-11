import { useEffect } from "react";

import {
  Award,
  Building2,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  User,
  X,
} from "lucide-react";

import useFarm from "@/hooks/useFarm";

import StatusBadge from "@/components/common/StatusBadge";

import { formatDate } from "@/utils/date";
import { getImageUrl } from "@/utils/image";
import { farmStatusConfig } from "@/utils/farm";

export default function FarmDrawer({ open, farmId, onClose }) {
  const { farm, detailLoading, adminGetById, clearAdminFarm } = useFarm();

  useEffect(() => {
    if (open && farmId) {
      adminGetById(farmId).catch(() => {});
    }

    return () => {
      if (!open) {
        clearAdminFarm();
      }
    };
  }, [open, farmId, adminGetById, clearAdminFarm]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-60">
      <button
        type="button"
        aria-label="Đóng"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <div className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-5">
          <h2 className="text-xl font-extrabold">Chi tiết nông trại</h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <X size={21} />
          </button>
        </div>

        <div className="p-5">
          {detailLoading || !farm ? (
            <div className="space-y-4">
              <div className="h-52 animate-pulse rounded-2xl bg-slate-200" />
              <div className="h-8 animate-pulse rounded bg-slate-200" />
              <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="overflow-hidden rounded-2xl bg-slate-100">
                <div className="h-48">
                  {farm.cover_image ? (
                    <img
                      src={getImageUrl(farm.cover_image)}
                      alt={farm.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300">
                      <Building2 size={60} />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-18 w-18 items-center justify-center overflow-hidden rounded-2xl bg-green-100 text-green-700">
                  {farm.logo ? (
                    <img
                      src={getImageUrl(farm.logo)}
                      alt={farm.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2 size={30} />
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-extrabold">{farm.name}</h3>

                  <p className="text-sm text-slate-500">
                    #{farm.id} · {farm.slug}
                  </p>
                </div>
              </div>

              <StatusBadge
                status={farm.status}
                deletedAt={farm.deleted_at}
                config={farmStatusConfig}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoItem
                  icon={User}
                  label="Chủ nông trại"
                  value={farm.seller?.name}
                />

                <InfoItem
                  icon={Phone}
                  label="Số điện thoại"
                  value={farm.phone}
                />

                <InfoItem icon={MapPin} label="Địa chỉ" value={farm.address} />

                <InfoItem
                  icon={Award}
                  label="Người duyệt"
                  value={farm.approver?.name}
                />

                <InfoItem
                  icon={Package}
                  label="Sản phẩm"
                  value={farm.product_count ?? 0}
                />

                <InfoItem
                  icon={ShoppingBag}
                  label="Đơn hàng"
                  value={farm.sub_order_count ?? 0}
                />
              </div>

              <div>
                <p className="text-sm text-slate-500">Mô tả</p>

                <p className="mt-1 whitespace-pre-wrap">
                  {farm.description || "—"}
                </p>
              </div>

              {farm.rejection_reason && (
                <div className="rounded-xl bg-red-50 p-4 text-red-700">
                  <p className="font-bold">Lý do từ chối</p>

                  <p className="mt-1 whitespace-pre-wrap">
                    {farm.rejection_reason}
                  </p>
                </div>
              )}

              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <DateItem label="Ngày tạo" value={farm.created_at} />

                <DateItem label="Ngày cập nhật" value={farm.updated_at} />

                <DateItem label="Ngày duyệt" value={farm.approved_at} />

                <DateItem label="Ngày xóa" value={farm.deleted_at} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Icon size={17} />
        {label}
      </div>

      <p className="mt-2 font-bold">{value ?? "—"}</p>
    </div>
  );
}

function DateItem({ label, value }) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p className="mt-1 font-semibold">{formatDate(value)}</p>
    </div>
  );
}
