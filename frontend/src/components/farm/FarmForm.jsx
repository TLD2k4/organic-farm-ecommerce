// src/components/farm/FarmForm.jsx

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { getFarmErrorMessage } from "@/utils/farmError";

import UploadImage from "@/components/upload/UploadImage";
import SellerPolicyAgreement from "@/components/farm/SellerPolicyAgreement";

import { SELLER_POLICY_VERSION } from "@/constants/sellerPolicy";

const ADDRESS_API_URL = "https://provinces.open-api.vn/api/v2/?depth=2";

const PHONE_REGEX = /^0[0-9]{9,10}$/;

const SCREEN_PADDING = 12;
const DROPDOWN_GAP = 6;
const MAX_DROPDOWN_HEIGHT = 240;

const BASE_INPUT_CLASS = `
  w-full
  rounded-xl
  border
  bg-white
  px-4
  py-3
  outline-none
  transition
  focus:ring-2
  disabled:cursor-not-allowed
  disabled:bg-slate-100
`;

let cachedAddressTree = null;

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildFarmAddress(form) {
  return [
    normalizeText(form.address_line),
    normalizeText(form.ward),
    normalizeText(form.province),
  ]
    .filter(Boolean)
    .join(", ");
}

function parseFarmAddress(address = "") {
  const normalizedAddress = normalizeText(address);

  if (!normalizedAddress) {
    return {
      address_line: "",
      ward: "",
      province: "",
    };
  }

  const parts = normalizedAddress
    .split(",")
    .map((item) => normalizeText(item))
    .filter(Boolean);

  /*
   * Format lưu thống nhất:
   * địa chỉ chi tiết, phường/xã, tỉnh/thành phố
   */
  if (parts.length >= 3) {
    return {
      address_line: parts.slice(0, -2).join(", "),
      ward: parts.at(-2) || "",
      province: parts.at(-1) || "",
    };
  }

  /*
   * Dữ liệu cũ không đúng format được giữ ở ô địa chỉ chi tiết.
   */
  return {
    address_line: normalizedAddress,
    ward: "",
    province: "",
  };
}

function normalizeInitialValues(initialValues) {
  const parsedAddress = parseFarmAddress(initialValues?.address);

  return {
    name: initialValues?.name ?? "",
    phone: initialValues?.phone ?? "",
    address_line: parsedAddress.address_line,
    ward: parsedAddress.ward,
    province: parsedAddress.province,
    description: initialValues?.description ?? "",
    logo: initialValues?.logo ?? null,
    cover_image: initialValues?.cover_image ?? null,
  };
}

function isValidUrl(value) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function removeVietnameseTones(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function filterOptions(options = [], keyword = "") {
  const search = removeVietnameseTones(normalizeText(keyword));

  if (!search) {
    return options;
  }

  return options.filter((option) =>
    removeVietnameseTones(option.name).includes(search),
  );
}

async function fetchAddressTree() {
  if (cachedAddressTree) {
    return cachedAddressTree;
  }

  const response = await fetch(ADDRESS_API_URL);

  if (!response.ok) {
    throw new Error("Không tải được dữ liệu địa chỉ.");
  }

  const json = await response.json();

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

function validateFarmForm(form) {
  const errors = {};

  const name = normalizeText(form.name);
  const phone = normalizeText(form.phone);
  const addressLine = normalizeText(form.address_line);
  const ward = normalizeText(form.ward);
  const province = normalizeText(form.province);
  const fullAddress = buildFarmAddress(form);
  const description = String(form.description ?? "").trim();
  const logo = form.logo ? String(form.logo).trim() : "";
  const coverImage = form.cover_image ? String(form.cover_image).trim() : "";

  if (!name) {
    errors.name = ["Tên nông trại không được để trống."];
  } else if (name.length > 100) {
    errors.name = ["Tên nông trại tối đa 100 ký tự."];
  }

  if (phone && !PHONE_REGEX.test(phone)) {
    errors.phone = ["Số điện thoại phải bắt đầu bằng 0 và có 10-11 chữ số."];
  }

  if (!province) {
    errors.province = ["Vui lòng chọn tỉnh/thành phố."];
  } else if (province.length > 100) {
    errors.province = ["Tỉnh/thành phố tối đa 100 ký tự."];
  }

  if (!ward) {
    errors.ward = ["Vui lòng chọn phường/xã."];
  } else if (ward.length > 100) {
    errors.ward = ["Phường/xã tối đa 100 ký tự."];
  }

  if (!addressLine) {
    errors.address_line = ["Vui lòng nhập địa chỉ chi tiết."];
  }

  if (fullAddress.length > 255) {
    errors.address_line = ["Toàn bộ địa chỉ nông trại tối đa 255 ký tự."];
  }

  if (description.length > 5000) {
    errors.description = ["Mô tả tối đa 5000 ký tự."];
  }

  if (logo && !isValidUrl(logo)) {
    errors.logo = ["Logo phải là một URL hợp lệ."];
  } else if (logo.length > 255) {
    errors.logo = ["Đường dẫn logo tối đa 255 ký tự."];
  }

  if (coverImage && !isValidUrl(coverImage)) {
    errors.cover_image = ["Ảnh bìa phải là một URL hợp lệ."];
  } else if (coverImage.length > 255) {
    errors.cover_image = ["Đường dẫn ảnh bìa tối đa 255 ký tự."];
  }

  return errors;
}

function getFirstErrorMessage(errors) {
  const firstError = Object.values(errors ?? {})[0];

  if (Array.isArray(firstError)) {
    return firstError[0] || null;
  }

  return typeof firstError === "string" ? firstError : null;
}

export default function FarmForm(props) {
  /*
   * Khi initialValues thay đổi sau register/update,
   * tạo lại phần state bên trong bằng key mới.
   */
  const formKey = JSON.stringify(normalizeInitialValues(props.initialValues));

  return <FarmFormContent key={formKey} {...props} />;
}

function FarmFormContent({
  initialValues,
  onSubmit,
  loading = false,
  disabled = false,
  requirePolicyAcceptance = false,
  submitLabel = "Lưu thông tin",
}) {
  const [form, setForm] = useState(() => normalizeInitialValues(initialValues));

  const [errors, setErrors] = useState({});
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [currentPolicy, setCurrentPolicy] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [addressTree, setAddressTree] = useState([]);
  const [addressLoading, setAddressLoading] = useState(true);

  const uploading = uploadingLogo || uploadingCover;
  const formDisabled = loading || uploading || disabled;
  const submitDisabled =
    formDisabled || (requirePolicyAcceptance && !policyAccepted);

  useEffect(() => {
    let cancelled = false;

    fetchAddressTree()
      .then((data) => {
        if (!cancelled) {
          setAddressTree(data);
        }
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        console.error("LOAD FARM ADDRESS ERROR:", error);

        toast.error("Không thể tải danh sách địa chỉ. Bạn vẫn có thể tự nhập.");
      })
      .finally(() => {
        if (!cancelled) {
          setAddressLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const provinceOptions = Array.isArray(addressTree) ? addressTree : [];

  const selectedProvince = provinceOptions.find(
    (province) => province.name === form.province,
  );

  const wardOptions = selectedProvince?.wards || [];
  const fullAddress = buildFarmAddress(form);

  const clearError = (field) => {
    setErrors((previous) => {
      if (!previous[field]) {
        return previous;
      }

      const nextErrors = { ...previous };

      delete nextErrors[field];

      return nextErrors;
    });
  };

  const getFieldClassName = (field) => `
    ${BASE_INPUT_CLASS}
    ${
      errors[field]
        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
        : "border-slate-200 focus:border-green-500 focus:ring-green-100"
    }
  `;

  const handleChange = (event) => {
    const { name, value } = event.target;

    const nextValue =
      name === "phone" ? value.replace(/\D/g, "").slice(0, 11) : value;

    setForm((previous) => ({
      ...previous,
      [name]: nextValue,
    }));

    clearError(name);
  };

  const validateField = (field) => {
    const fieldErrors = validateFarmForm(form);

    setErrors((previous) => {
      const nextErrors = { ...previous };

      if (fieldErrors[field]) {
        nextErrors[field] = fieldErrors[field];
      } else {
        delete nextErrors[field];
      }

      return nextErrors;
    });
  };

  const handleProvinceChange = (value) => {
    setForm((previous) => ({
      ...previous,
      province: value,
      ward: "",
    }));

    clearError("province");
    clearError("ward");
    clearError("address_line");
  };

  const handleWardChange = (value) => {
    setForm((previous) => ({
      ...previous,
      ward: value,
    }));

    clearError("ward");
    clearError("address_line");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (uploading) {
      toast.error("Vui lòng chờ upload ảnh hoàn tất.");
      return;
    }

    if (requirePolicyAcceptance && !policyAccepted) {
      const policyError =
        "Bạn phải đọc và chấp thuận chính sách người bán trước khi đăng ký.";

      setErrors((previous) => ({
        ...previous,
        policy_accepted: [policyError],
      }));

      toast.error(policyError);
      document.querySelector('[name="policy_accepted"]')?.focus();

      return;
    }

    const validationErrors = validateFarmForm(form);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      toast.error(
        getFirstErrorMessage(validationErrors) ||
          "Vui lòng kiểm tra lại thông tin.",
      );

      const firstField = Object.keys(validationErrors)[0];

      document.querySelector(`[name="${firstField}"]`)?.focus();

      return;
    }

    const payload = {
      name: normalizeText(form.name),
      phone: normalizeText(form.phone) || null,
      address: buildFarmAddress(form),
      description: String(form.description ?? "").trim() || null,
      logo: form.logo || null,
      cover_image: form.cover_image || null,
      ...(requirePolicyAcceptance
        ? {
            policy_accepted: true,
            policy_version: currentPolicy?.version || SELLER_POLICY_VERSION,
            seller_policy_id: currentPolicy?.id || null,
          }
        : {}),
    };

    setErrors({});

    try {
      const response = await onSubmit(payload);

      toast.success(response?.message || "Lưu thông tin nông trại thành công.");
    } catch (error) {
      console.error("SAVE FARM ERROR:", error);

      const errorData = error?.response?.data ?? error;
      const backendErrors = {
        ...(errorData?.errors ?? {}),
      };

      if (backendErrors.address && !backendErrors.address_line) {
        backendErrors.address_line = backendErrors.address;
      }

      if (Object.keys(backendErrors).length > 0) {
        setErrors(backendErrors);
      }

      toast.error(
        getFarmErrorMessage(error, "Không thể lưu thông tin nông trại."),
      );
    }
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="farm-form-surface space-y-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:space-y-5 sm:rounded-2xl sm:p-4 lg:p-5"
    >
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 md:gap-5">
        <ImageUploadField
          label="Logo nông trại"
          value={form.logo}
          uploadType="farm_logo"
          uploading={uploadingLogo}
          error={errors.logo?.[0]}
          onUploadingChange={setUploadingLogo}
          onChange={(url) => {
            setForm((previous) => ({
              ...previous,
              logo: url,
            }));

            clearError("logo");
          }}
        />

        <ImageUploadField
          label="Ảnh bìa nông trại"
          value={form.cover_image}
          uploadType="farm_cover"
          uploading={uploadingCover}
          error={errors.cover_image?.[0]}
          onUploadingChange={setUploadingCover}
          onChange={(url) => {
            setForm((previous) => ({
              ...previous,
              cover_image: url,
            }));

            clearError("cover_image");
          }}
        />
      </div>

      <TextField
        label="Tên nông trại"
        name="name"
        value={form.name}
        required
        disabled={formDisabled}
        maxLength={100}
        autoComplete="organization"
        placeholder="Ví dụ: Nông trại Xanh Đà Lạt"
        error={errors.name?.[0]}
        className={getFieldClassName("name")}
        onChange={handleChange}
        onBlur={() => validateField("name")}
      />

      <TextField
        label="Số điện thoại"
        name="phone"
        type="tel"
        value={form.phone}
        disabled={formDisabled}
        maxLength={11}
        inputMode="numeric"
        autoComplete="tel"
        placeholder="Ví dụ: 0901234567"
        error={errors.phone?.[0]}
        className={getFieldClassName("phone")}
        onChange={handleChange}
        onBlur={() => validateField("phone")}
      />

      <section className="farm-address-panel rounded-xl border border-green-100 bg-green-50/40 p-3 sm:rounded-2xl sm:p-4">
        <h2 className="text-base font-bold text-slate-900 sm:text-lg">
          Địa chỉ nông trại
        </h2>

        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Chọn tỉnh/thành phố, phường/xã và nhập số nhà, tên đường.
        </p>

        <div className="mt-3 grid gap-3 sm:mt-4 sm:gap-4 md:grid-cols-2 md:gap-5">
          <SuggestInput
            name="province"
            label="Tỉnh / Thành phố"
            value={form.province}
            options={provinceOptions}
            loading={addressLoading}
            disabled={formDisabled}
            placeholder="Gõ để tìm tỉnh / thành phố"
            required
            error={errors.province?.[0]}
            onChange={handleProvinceChange}
            onBlur={() => validateField("province")}
          />

          <SuggestInput
            name="ward"
            label="Phường / Xã"
            value={form.ward}
            options={wardOptions}
            loading={addressLoading}
            disabled={formDisabled || !normalizeText(form.province)}
            placeholder={
              form.province
                ? "Gõ để tìm phường / xã"
                : "Chọn tỉnh / thành phố trước"
            }
            required
            error={errors.ward?.[0]}
            onChange={handleWardChange}
            onBlur={() => validateField("ward")}
          />
        </div>

        <div className="mt-3 sm:mt-5">
          <TextField
            label="Địa chỉ chi tiết"
            name="address_line"
            value={form.address_line}
            required
            disabled={formDisabled}
            maxLength={255}
            autoComplete="street-address"
            placeholder="Ví dụ: 12 Nguyễn Văn Bảo"
            error={errors.address_line?.[0]}
            className={getFieldClassName("address_line")}
            onChange={handleChange}
            onBlur={() => validateField("address_line")}
          />
        </div>

        <div className="mt-4 rounded-xl border border-green-100 bg-white p-4">
          <p className="text-sm font-semibold text-slate-500">
            Địa chỉ hoàn chỉnh sẽ được lưu:
          </p>

          <p className="mt-1 wrap-break-word font-bold text-slate-800">
            {fullAddress || "Chưa nhập đầy đủ địa chỉ"}
          </p>

          <p className="mt-2 text-right text-xs text-slate-400">
            {fullAddress.length}/255 ký tự
          </p>
        </div>
      </section>

      <TextareaField
        label="Mô tả"
        name="description"
        value={form.description}
        disabled={formDisabled}
        rows={6}
        maxLength={5000}
        placeholder="Giới thiệu về nông trại..."
        error={errors.description?.[0]}
        className={`${getFieldClassName("description")} resize-y`}
        onChange={handleChange}
        onBlur={() => validateField("description")}
      />

      {requirePolicyAcceptance && (
        <SellerPolicyAgreement
          checked={policyAccepted}
          disabled={loading || uploading}
          error={
            errors.policy_accepted?.[0] || errors.policy_version?.[0] || errors.seller_policy_id?.[0] || null
          }
          onPolicyLoaded={setCurrentPolicy}
          onChange={(checked) => {
            setPolicyAccepted(checked);

            if (checked) {
              clearError("policy_accepted");
              clearError("policy_version");
              clearError("seller_policy_id");
            }
          }}
        />
      )}

      {errors.farm && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-semibold text-red-600">{errors.farm[0]}</p>
        </div>
      )}

      {!disabled && (
        <button
          type="submit"
          disabled={submitDisabled}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {(loading || uploading) && (
            <Loader2 size={19} className="animate-spin" />
          )}

          {uploading
            ? "Đang upload ảnh..."
            : loading
              ? "Đang xử lý..."
              : submitLabel}
        </button>
      )}
    </form>
  );
}

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-2 block font-semibold">
      {children}

      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );
}

function FieldError({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

function TextField({
  label,
  name,
  type = "text",
  value,
  required = false,
  error,
  className,
  ...inputProps
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>

      <input
        type={type}
        name={name}
        value={value}
        required={required}
        aria-invalid={Boolean(error)}
        className={className}
        {...inputProps}
      />

      <div className="mt-1 flex items-start justify-between gap-3">
        <FieldError message={error} />

        {inputProps.maxLength && (
          <span className="ml-auto shrink-0 text-xs text-slate-400">
            {String(value ?? "").length}/{inputProps.maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

function TextareaField({
  label,
  name,
  value,
  error,
  className,
  ...textareaProps
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>

      <textarea
        name={name}
        value={value}
        aria-invalid={Boolean(error)}
        className={className}
        {...textareaProps}
      />

      <div className="mt-1 flex items-start justify-between gap-3">
        <FieldError message={error} />

        {textareaProps.maxLength && (
          <span className="ml-auto shrink-0 text-xs text-slate-400">
            {String(value ?? "").length}/{textareaProps.maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

function ImageUploadField({
  label,
  value,
  uploadType,
  uploading,
  error,
  onUploadingChange,
  onChange,
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>

      <UploadImage
        value={value}
        uploadType={uploadType}
        onUploadingChange={onUploadingChange}
        onChange={onChange}
      />

      {uploading && (
        <p className="mt-1 text-sm text-slate-500">Đang tải ảnh...</p>
      )}

      <FieldError message={error} />
    </div>
  );
}

/**
 * SuggestInput giữ khả năng gõ tìm và tự nhập,
 * nhưng dropdown hiển thị bằng portal giống ResponsiveSelect.
 */
function SuggestInput({
  name,
  label,
  value,
  options = [],
  loading = false,
  placeholder,
  disabled = false,
  required = false,
  error,
  onChange,
  onBlur,
}) {
  const listboxId = useId();

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({
    left: 0,
    width: 0,
    top: null,
    bottom: null,
    maxHeight: MAX_DROPDOWN_HEIGHT,
  });

  const safeOptions = Array.isArray(options) ? options : [];

  const filteredOptions = filterOptions(safeOptions, value);

  const calculatePosition = () => {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    const rect = input.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const width = Math.min(
      Math.max(rect.width, 180),
      viewportWidth - SCREEN_PADDING * 2,
    );

    let left = rect.left;

    if (left + width > viewportWidth - SCREEN_PADDING) {
      left = viewportWidth - width - SCREEN_PADDING;
    }

    left = Math.max(SCREEN_PADDING, left);

    const availableBelow =
      viewportHeight - rect.bottom - DROPDOWN_GAP - SCREEN_PADDING;

    const availableAbove = rect.top - DROPDOWN_GAP - SCREEN_PADDING;

    const openUpward = availableBelow < 160 && availableAbove > availableBelow;

    const availableHeight = openUpward ? availableAbove : availableBelow;

    const maxHeight = Math.max(
      80,
      Math.min(MAX_DROPDOWN_HEIGHT, availableHeight),
    );

    if (openUpward) {
      setPosition({
        left,
        width,
        top: null,
        bottom: viewportHeight - rect.top + DROPDOWN_GAP,
        maxHeight,
      });

      return;
    }

    setPosition({
      left,
      width,
      top: rect.bottom + DROPDOWN_GAP,
      bottom: null,
      maxHeight,
    });
  };

  const openDropdown = () => {
    if (disabled) {
      return;
    }

    calculatePosition();
    setOpen(true);
  };

  const closeDropdown = (validate = false) => {
    setOpen(false);

    if (validate) {
      onBlur?.();
    }
  };

  const handleChoose = (option) => {
    onChange(option.name);
    closeDropdown();

    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const closeAndValidate = () => {
      setOpen(false);
      onBlur?.();
    };

    const handlePointerDown = (event) => {
      const target = event.target;

      const clickedWrapper = wrapperRef.current?.contains(target);

      const clickedDropdown = dropdownRef.current?.contains(target);

      if (!clickedWrapper && !clickedDropdown) {
        closeAndValidate();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeAndValidate();
        inputRef.current?.focus();
      }
    };

    const handleResize = () => {
      setOpen(false);
    };

    const handleScroll = (event) => {
      if (dropdownRef.current?.contains(event.target)) {
        return;
      }

      setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [open, onBlur]);

  return (
    <div ref={wrapperRef}>
      <FieldLabel required={required}>{label}</FieldLabel>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={value}
          disabled={disabled}
          required={required}
          autoComplete="off"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-invalid={Boolean(error)}
          onFocus={openDropdown}
          onChange={(event) => {
            if (disabled) {
              return;
            }

            onChange(event.target.value);
            openDropdown();
          }}
          onBlur={() => {
            window.setTimeout(() => {
              const activeElement = document.activeElement;

              const focusInsideWrapper =
                wrapperRef.current?.contains(activeElement);

              const focusInsideDropdown =
                dropdownRef.current?.contains(activeElement);

              if (!focusInsideWrapper && !focusInsideDropdown) {
                closeDropdown(true);
              }
            }, 0);
          }}
          placeholder={placeholder}
          className={`
            ${BASE_INPUT_CLASS}
            pr-11
            ${
              error
                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                : "border-slate-200 focus:border-green-500 focus:ring-green-100"
            }
            ${open && !error ? "border-green-500 ring-2 ring-green-100" : ""}
          `}
        />

        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label={open ? "Đóng danh sách" : "Mở danh sách"}
          onClick={() => {
            if (open) {
              closeDropdown(true);
              return;
            }

            inputRef.current?.focus();
            openDropdown();
          }}
          className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronDown
            size={18}
            className={`transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      <FieldError message={error} />

      {open &&
        !disabled &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            id={listboxId}
            role="listbox"
            className="fixed overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_14px_35px_rgba(15,23,42,0.18)]"
            style={{
              zIndex: 9999,
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,
              ...(position.top !== null ? { top: position.top } : {}),
              ...(position.bottom !== null ? { bottom: position.bottom } : {}),
            }}
          >
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-4 text-sm font-semibold text-slate-500">
                <Loader2 size={16} className="animate-spin" />
                Đang tải dữ liệu...
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = option.name === value;

                return (
                  <button
                    key={option.name}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onClick={() => handleChoose(option)}
                    className={`
                      flex
                      min-h-10
                      w-full
                      items-center
                      justify-between
                      gap-3
                      rounded-lg
                      px-3
                      py-2.5
                      text-left
                      text-sm
                      leading-5
                      transition-colors
                      ${
                        isSelected
                          ? "bg-green-50 font-semibold text-green-700"
                          : "text-slate-700 hover:bg-slate-50"
                      }
                    `}
                  >
                    <span className="min-w-0 flex-1 whitespace-normal wrap-break-word">
                      {option.name}
                    </span>

                    {isSelected && (
                      <Check size={16} className="shrink-0 text-green-600" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center text-sm text-slate-500">
                Không có gợi ý. Bạn vẫn có thể tự nhập.
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
