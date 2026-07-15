// src/components/ui/customer/profile/AddressSection.jsx

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Edit,
  Loader2,
  MapPin,
  Phone,
  Plus,
  Star,
  Trash2,
  User,
  X,
} from "lucide-react";
import addressService from "../../../../services/addressService";
import { confirmAction } from "../../../../utils/actionDialog";

const EMPTY_FORM = {
  receiver_name: "",
  phone: "",
  address_line: "",
  ward: "",
  district: "",
  province: "",
  is_default: false,
};  

function getAddressesFromPayload(payload) {
  return payload?.data?.addresses || payload?.addresses || payload?.data || [];
}

function getFullAddress(address) {
  return [
    address.address_line,
    address.ward,
    address.district,
    address.province,
  ]
    .filter(Boolean)
    .join(", ");
}

export default function AddressSection() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const loadAddresses = async () => {
    try {
      setLoading(true);

      const payload = await addressService.getMyAddresses();

      setAddresses(getAddressesFromPayload(payload));
    } catch (error) {
      console.log("LOAD ADDRESSES ERROR:", error);
      toast.error("Không thể tải địa chỉ giao hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const openCreateModal = () => {
    setEditingAddress(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (address) => {
    setEditingAddress(address);

    setForm({
      receiver_name: address.receiver_name || "",
      phone: address.phone || "",
      address_line: address.address_line || "",
      ward: address.ward || "",
      district: address.district || "",
      province: address.province || "",
      is_default: Boolean(address.is_default),
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;

    setModalOpen(false);
    setEditingAddress(null);
    setForm(EMPTY_FORM);
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  const submitData = {
    ...form,
    district: "",
  };

  try {
    setSubmitting(true);

    if (editingAddress) {
      const payload = await addressService.updateAddress(
        editingAddress.id,
        submitData
      );

      toast.success(payload?.message || "Cập nhật địa chỉ thành công");
    } else {
      const payload = await addressService.createAddress(submitData);

      toast.success(payload?.message || "Thêm địa chỉ thành công");
    }

    closeModal();
    loadAddresses();
  } catch (error) {
    console.log("SAVE ADDRESS ERROR:", error);

    const errors = error?.response?.data?.errors;

    if (errors) {
      const firstError = Object.values(errors)?.[0]?.[0];
      toast.error(firstError || "Dữ liệu địa chỉ không hợp lệ");
    } else {
      toast.error(error?.response?.data?.message || "Không thể lưu địa chỉ");
    }
  } finally {
    setSubmitting(false);
  }
};

const handleDelete = async (address) => {
  if (!await confirmAction({ title: "Xóa địa chỉ", description: "Địa chỉ sẽ bị xóa khỏi sổ địa chỉ của bạn.", confirmLabel: "Xóa địa chỉ", danger: true })) return;

  try {
    setActionLoadingId(`delete-${address.id}`);

    const payload = await addressService.deleteAddress(address.id);

    toast.success(payload?.message || "Xóa địa chỉ thành công");
    await loadAddresses();
  } catch (error) {
    console.log("DELETE ADDRESS ERROR:", error);
    toast.error(error?.response?.data?.message || "Không thể xóa địa chỉ");
  } finally {
    setActionLoadingId(null);
  }
};

const handleSetDefault = async (address) => {
  if (address.is_default) return;

  try {
    setActionLoadingId(`default-${address.id}`);

    const payload = await addressService.setDefaultAddress(address.id);

    toast.success(payload?.message || "Đặt địa chỉ mặc định thành công");
    await loadAddresses();
  } catch (error) {
    console.log("SET DEFAULT ADDRESS ERROR:", error);
    toast.error(
      error?.response?.data?.message || "Không thể đặt địa chỉ mặc định"
    );
  } finally {
    setActionLoadingId(null);
  }
};

  return (
    <>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Địa chỉ giao hàng
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Quản lý địa chỉ nhận hàng khi đặt mua nông sản.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="
              inline-flex
              h-11
              items-center
              gap-2
              rounded-xl
              bg-[#6BAE4F]
              px-5
              text-sm
              font-bold
              text-white
              transition
              hover:bg-[#5D9446]
            "
          >
            <Plus size={18} />
            Thêm địa chỉ
          </button>
        </div>

{loading ? (
  <AddressListSkeleton />
) : addresses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-green-200 bg-green-50 p-8 text-center">
            <MapPin size={42} className="mx-auto text-green-700" />

            <p className="mt-3 font-bold text-slate-900">
              Chưa có địa chỉ nào.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Thêm địa chỉ để đặt hàng nhanh hơn.
            </p>

            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white hover:bg-green-800"
            >
              <Plus size={18} />
              Thêm địa chỉ đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              actionLoadingId={actionLoadingId}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <AddressModal
          form={form}
          editingAddress={editingAddress}
          submitting={submitting}
          onClose={closeModal}
          onChange={updateForm}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}

function AddressCard({
  address,
  actionLoadingId,
  onEdit,
  onDelete,
  onSetDefault,
}) {
  const deleting = actionLoadingId === `delete-${address.id}`;
  const settingDefault = actionLoadingId === `default-${address.id}`;
  const busy = deleting || settingDefault;

  return (
    <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-950">
              {address.receiver_name}
            </h3>

            {address.is_default && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                <CheckCircle2 size={14} />
                Mặc định
              </span>
            )}
          </div>

          <div className="mt-3 space-y-2 text-sm font-medium text-slate-600">
            <p className="flex items-center gap-2">
              <Phone size={16} className="text-green-700" />
              {address.phone}
            </p>

            <p className="flex items-start gap-2 leading-6">
              <MapPin size={16} className="mt-1 shrink-0 text-green-700" />
              <span>{address.full_address || getFullAddress(address)}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {!address.is_default && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onSetDefault(address)}
              className="inline-flex items-center gap-1 rounded-xl border border-green-200 px-3 py-2 text-xs font-bold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {settingDefault ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Star size={15} />
              )}
              Mặc định
            </button>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={() => onEdit(address)}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Edit size={15} />
            Sửa
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => onDelete(address)}
            className="inline-flex items-center gap-1 rounded-xl border border-red-100 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Trash2 size={15} />
            )}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

function AddressModal({
  form,
  editingAddress,
  submitting,
  onClose,
  onChange,
  onSubmit,
}) {
  const [addressTree, setAddressTree] = useState([]);
const [addressLoading, setAddressLoading] = useState(false);

useEffect(() => {
  const loadAddressTree = async () => {
    try {
      setAddressLoading(true);

      const data = await fetchAddressTree();

      setAddressTree(data);
    } catch (error) {
      console.log("LOAD VIETNAM ADDRESS ERROR:", error);
    } finally {
      setAddressLoading(false);
    }
  };

  loadAddressTree();
}, []);

const provinceOptions = Array.isArray(addressTree) ? addressTree : [];

const selectedProvince = provinceOptions.find(
  (province) => province.name === form.province
);

const wardOptions = selectedProvince?.wards || [];
  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-xl font-bold text-slate-950">
            {editingAddress ? "Cập nhật địa chỉ" : "Thêm địa chỉ giao hàng"}
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              icon={User}
              label="Người nhận"
              value={form.receiver_name}
              onChange={(value) => onChange("receiver_name", value)}
              placeholder="Nhập tên người nhận"
              required
            />

            <InputField
              icon={Phone}
              label="Số điện thoại"
              value={form.phone}
              onChange={(value) => onChange("phone", value)}
              placeholder="VD: 0909123456"
              required
            />

<SuggestInput
  label="Tỉnh / Thành phố"
  value={form.province}
  options={provinceOptions}
  loading={addressLoading}
  placeholder="Gõ để tìm tỉnh / thành phố"
  required
  onChange={(value) => {
    onChange("province", value);
    onChange("ward", "");
    onChange("district", "");
  }}
/>

<SuggestInput
  label="Phường / Xã"
  value={form.ward}
  options={wardOptions}
  loading={addressLoading}
  disabled={!form.province}
  placeholder={
    form.province
      ? "Gõ để tìm phường / xã"
      : "Chọn tỉnh / thành phố trước"
  }
  required
  onChange={(value) => {
    onChange("ward", value);
    onChange("district", "");
  }}
/>

            <InputField
              label="Địa chỉ chi tiết"
              value={form.address_line}
              onChange={(value) => onChange("address_line", value)}
              placeholder="Số nhà, tên đường..."
              required
            />

            <label className="flex cursor-pointer items-center gap-3 md:col-span-2">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => onChange("is_default", e.target.checked)}
                className="h-4 w-4 accent-green-700"
              />

              <span className="text-sm font-bold text-slate-700">
                Đặt làm địa chỉ mặc định
              </span>
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-60"
            >
              {submitting && <Loader2 size={18} className="animate-spin" />}
              {editingAddress ? "Cập nhật" : "Thêm địa chỉ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InputField({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-800">
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        )}

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none transition focus:border-green-600 ${
            Icon ? "pl-10" : ""
          }`}
        />
      </div>
    </div>
  );
}
const ADDRESS_API_URL = "https://provinces.open-api.vn/api/v2/?depth=2";

let cachedAddressTree = null;

async function fetchAddressTree() {
  if (cachedAddressTree) return cachedAddressTree;

  const res = await fetch(ADDRESS_API_URL);

  if (!res.ok) {
    throw new Error("Không tải được dữ liệu địa chỉ");
  }

  const json = await res.json();

  const rawProvinces = Array.isArray(json)
    ? json
    : json?.data || json?.provinces || json?.results || [];

  cachedAddressTree = rawProvinces
    .map((province) => {
      const provinceName =
        province.name ||
        province.full_name ||
        province.province_name ||
        province.label ||
        "";

      const rawWards =
        province.wards ||
        province.communes ||
        province.children ||
        province.units ||
        [];

      const wards = Array.isArray(rawWards)
        ? rawWards
            .map((ward) => ({
              name:
                ward.name ||
                ward.full_name ||
                ward.ward_name ||
                ward.commune_name ||
                ward.label ||
                "",
            }))
            .filter((ward) => ward.name)
        : [];

      return {
        name: provinceName,
        wards,
      };
    })
    .filter((province) => province.name);

  return cachedAddressTree;
}

function removeVietnameseTones(str = "") {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function filterOptions(options = [], keyword = "") {
  const search = removeVietnameseTones(keyword.trim());

  if (!search) return options;

  return options.filter((item) =>
    removeVietnameseTones(item.name).includes(search)
  );
}

function SuggestInput({
  label,
  value,
  options = [],
  loading = false,
  placeholder,
  disabled = false,
  required = false,
  onChange,
}) {
  const [open, setOpen] = useState(false);

  const safeOptions = Array.isArray(options) ? options : [];
  const filteredOptions = filterOptions(safeOptions, value);

  const handleChoose = (option) => {
    onChange(option.name, true);
    setOpen(false);
  };

  return (
    <div className="relative">
      <label className="mb-2 block text-sm font-bold text-slate-800">
        {label}
      </label>

      <input
        value={value}
        disabled={disabled}
        required={required}
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        onChange={(e) => {
          if (disabled) return;

          onChange(e.target.value, false);
          setOpen(true);
        }}
        placeholder={placeholder}
        className={`
          h-12
          w-full
          rounded-2xl
          border
          border-slate-200
          px-4
          text-sm
          font-semibold
          outline-none
          transition
          focus:border-green-600
          disabled:cursor-not-allowed
          disabled:bg-slate-100
          disabled:text-slate-400
        `}
      />

      {open && !disabled && (
        <div
          className="
            absolute
            left-0
            right-0
            top-[calc(100%+6px)]
            z-1000
            max-h-56
            overflow-y-auto
            rounded-2xl
            border
            border-slate-200
            bg-white
            shadow-xl
          "
        >
          {loading ? (
            <div className="px-4 py-3 text-sm font-semibold text-slate-500">
              Đang tải dữ liệu...
            </div>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.name}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleChoose(option)}
                className="
                  block
                  w-full
                  px-4
                  py-3
                  text-left
                  text-sm
                  font-semibold
                  text-slate-700
                  hover:bg-green-50
                  hover:text-green-700
                "
              >
                {option.name}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm font-semibold text-slate-500">
              Không có gợi ý. Bạn vẫn có thể tự nhập.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
function AddressListSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 2 }).map((_, index) => (
        <AddressCardSkeleton key={index} />
      ))}
    </div>
  );
}

function AddressCardSkeleton() {
  return (
    <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
      <div className="flex animate-pulse flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-5 w-36 rounded-lg bg-slate-200" />
            <div className="h-6 w-20 rounded-full bg-green-100" />
          </div>

          <div className="mt-4 space-y-3">
            <div className="h-4 w-40 rounded-lg bg-slate-200" />
            <div className="h-4 w-full max-w-xl rounded-lg bg-slate-200" />
            <div className="h-4 w-2/3 rounded-lg bg-slate-200" />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="h-9 w-20 rounded-xl bg-slate-200" />
          <div className="h-9 w-16 rounded-xl bg-slate-200" />
          <div className="h-9 w-16 rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
