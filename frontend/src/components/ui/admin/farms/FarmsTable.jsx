import {
  Ban,
  Check,
  Eye,
  RotateCcw,
  Skull,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import ConfirmButton from "@/components/common/ConfirmButton";
import StatusBadge from "@/components/common/StatusBadge";

import { getImageUrl } from "@/utils/image";
import { highlight } from "@/utils/highlight";

import { FARM_STATUS, farmStatusConfig } from "@/utils/farm";

export default function FarmsTable({
  farms,
  loading,
  keyword,
  onView,
  onApprove,
  onReject,
  onSuspend,
  onReopen,
  onDelete,
  onRestore,
  onForceDelete,
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(8)].map((_, index) => (
          <div
            key={index}
            className="h-18 animate-pulse rounded-xl bg-slate-200"
          />
        ))}
      </div>
    );
  }

  if (!farms.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white py-14 text-center text-slate-500">
        Không có nông trại nào.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-290">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-4 text-left">ID</th>

              <th className="px-4 py-4 text-left">Nông trại</th>

              <th className="px-4 py-4 text-left">Chủ sở hữu</th>

              <th className="px-4 py-4 text-left">Địa chỉ</th>

              <th className="px-4 py-4 text-center">Sản phẩm</th>

              <th className="px-4 py-4 text-center">Đơn hàng</th>

              <th className="px-4 py-4 text-center">Trạng thái</th>

              <th className="px-4 py-4 text-center">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {farms.map((farm) => {
              const status = Number(farm.status);

              const isDeleted = Boolean(farm.deleted_at);

              return (
                <tr
                  key={farm.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-4">#{farm.id}</td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-green-100">
                        {farm.logo ? (
                          <img
                            src={getImageUrl(farm.logo)}
                            alt={farm.name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>

                      <div className="min-w-0">
                        {farm.slug && status === FARM_STATUS.ACTIVE && !isDeleted ? (
                          <Link to={`/farms/${farm.slug}`} className="block max-w-55 truncate font-bold entity-name-link entity-name-link-public hover:underline">
                            {highlight(farm.name, keyword)}
                          </Link>
                        ) : (
                          <button type="button" onClick={() => onView(farm)} className="block max-w-55 truncate text-left font-bold entity-name-link entity-name-link-management hover:underline">
                            {highlight(farm.name, keyword)}
                          </button>
                        )}

                        <p className="max-w-55 truncate text-sm text-slate-500">
                          {farm.slug}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-semibold">
                      {highlight(farm.seller?.name, keyword)}
                    </p>

                    <p className="text-sm text-slate-500">
                      {farm.seller?.email}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <p className="max-w-65 line-clamp-2 text-sm">
                      {highlight(farm.address, keyword)}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-center font-bold">
                    {farm.product_count ?? 0}
                  </td>

                  <td className="px-4 py-4 text-center font-bold">
                    {farm.sub_order_count ?? 0}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <StatusBadge
                      status={farm.status}
                      deletedAt={farm.deleted_at}
                      config={farmStatusConfig}
                    />
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex min-w-max items-center justify-center gap-2">
                      <ActionButton
                        title="Xem chi tiết"
                        className="bg-sky-500 hover:bg-sky-600"
                        onClick={() => onView(farm)}
                      >
                        <Eye size={16} />
                      </ActionButton>

                      {!isDeleted && status === FARM_STATUS.PENDING && (
                        <>
                          <ConfirmButton
                            title="Duyệt nông trại này?"
                            tooltip="Duyệt"
                            type="success"
                            onConfirm={() => onApprove(farm)}
                          >
                            <span className="inline-flex cursor-pointer rounded-lg bg-green-600 p-2 text-white hover:bg-green-700">
                              <Check size={16} />
                            </span>
                          </ConfirmButton>

                          <ActionButton
                            title="Từ chối"
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => onReject(farm)}
                          >
                            <X size={16} />
                          </ActionButton>
                        </>
                      )}

                      {!isDeleted && status === FARM_STATUS.ACTIVE && (
                        <ConfirmButton
                          title="Đình chỉ nông trại?"
                          tooltip="Đình chỉ"
                          onConfirm={() => onSuspend(farm)}
                        >
                          <span className="inline-flex cursor-pointer rounded-lg bg-orange-500 p-2 text-white hover:bg-orange-600">
                            <Ban size={16} />
                          </span>
                        </ConfirmButton>
                      )}

                      {!isDeleted && status === FARM_STATUS.SUSPENDED && (
                        <ConfirmButton
                          title="Mở lại nông trại?"
                          tooltip="Mở lại"
                          type="success"
                          onConfirm={() => onReopen(farm)}
                        >
                          <span className="inline-flex cursor-pointer rounded-lg bg-green-600 p-2 text-white hover:bg-green-700">
                            <Undo2 size={16} />
                          </span>
                        </ConfirmButton>
                      )}

                      {!isDeleted && status !== FARM_STATUS.ACTIVE && (
                        <ConfirmButton
                          title="Xóa mềm nông trại?"
                          tooltip="Xóa mềm"
                          onConfirm={() => onDelete(farm)}
                        >
                          <span className="inline-flex cursor-pointer rounded-lg bg-red-600 p-2 text-white hover:bg-red-700">
                            <Trash2 size={16} />
                          </span>
                        </ConfirmButton>
                      )}

                      {isDeleted && (
                        <>
                          <ConfirmButton
                            title="Khôi phục nông trại?"
                            tooltip="Khôi phục"
                            type="success"
                            onConfirm={() => onRestore(farm)}
                          >
                            <span className="inline-flex cursor-pointer rounded-lg bg-blue-500 p-2 text-white hover:bg-blue-600">
                              <RotateCcw size={16} />
                            </span>
                          </ConfirmButton>

                          <ConfirmButton
                            title="Xóa vĩnh viễn nông trại?"
                            tooltip="Xóa vĩnh viễn"
                            onConfirm={() => onForceDelete(farm)}
                          >
                            <span className="inline-flex cursor-pointer rounded-lg bg-black p-2 text-white hover:bg-slate-800">
                              <Skull size={16} />
                            </span>
                          </ConfirmButton>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionButton({ title, className, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`cursor-pointer rounded-lg p-2 text-white transition ${className}`}
    >
      {children}
    </button>
  );
}
