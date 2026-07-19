import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  AlertTriangle,
  CreditCard,
  Loader2,
  MapPin,
  PackageOpen,
  ShieldCheck,
  Store,
  Truck,
  Wallet,
} from "lucide-react";

import addressService from "../../services/addressService";
import buyerCartService from "../../services/buyerCartService";
import checkoutService from "../../services/checkoutService";
import ResponsiveSelect from "../../components/common/ResponsiveSelect";
import { getApiErrorMessage } from "../../utils/apiError";
import { formatKg, formatQuantity, sumItemQuantity } from "../../utils/quantity";

const DEFAULT_SHIPPING_FEE = 30000;

export default function CheckoutPage() {
  const navigate = useNavigate();

  const [cart, setCart] = useState({
    items: [],
  });

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("COD");

  const [shippingForm, setShippingForm] = useState({
    shipping_name: "",
    shipping_phone: "",
    shipping_address: "",
    note: "",
  });

  const applyAddress = useCallback((address) => {
    if (!address) return;

    setSelectedAddressId(address.id);

    setShippingForm((prev) => ({
      ...prev,
      shipping_name: address.receiver_name || "",
      shipping_phone: address.phone || "",
      shipping_address: getFullAddress(address),
    }));
  }, []);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);

      const response = await buyerCartService.getCart();
      const payload = response.data ?? response;
      const normalized = normalizeCart(payload.cart || payload);
      const selectedIds = JSON.parse(sessionStorage.getItem("checkout_cart_item_ids") || "[]").map(Number);
      setCart({ ...normalized, items: selectedIds.length ? normalized.items.filter((item) => selectedIds.includes(Number(item.id))) : [] });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải giỏ hàng."));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAddresses = useCallback(async () => {
    try {
      const response = await addressService.getMyAddresses();

      const list = response.data?.addresses || response.addresses || [];

      setAddresses(list);

      const defaultAddress =
        list.find((item) => Boolean(item.is_default)) || list[0];

      if (defaultAddress) {
        applyAddress(defaultAddress);
      }
    } catch (error) {
      console.log("LOAD ADDRESSES ERROR:", error);
    }
  }, [applyAddress]);

  useEffect(() => {
    fetchCart();
    fetchAddresses();
  }, [fetchCart, fetchAddresses]);

  const groups = useMemo(() => {
    return groupItemsByFarm(cart.items || []);
  }, [cart.items]);
  const unavailableItems = useMemo(
    () => (cart.items || []).filter((item) => !item.is_available),
    [cart.items],
  );

  const itemsTotal = useMemo(() => {
    return groups.reduce((total, group) => {
      return total + getFarmItemsTotal(group);
    }, 0);
  }, [groups]);

  const shippingTotal = useMemo(() => {
    return groups.reduce((total, group) => {
      return total + getFarmShippingFee(group);
    }, 0);
  }, [groups]);

  const grandTotal = itemsTotal + shippingTotal;

  const handleSelectAddress = (addressId) => {
    setSelectedAddressId(addressId);

    if (!addressId) return;

    const address = addresses.find(
      (item) => String(item.id) === String(addressId)
    );

    applyAddress(address);
  };

  const handleChangeShipping = (e) => {
    const { name, value } = e.target;


    setShippingForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateCheckout = () => {
    if (cart.items.length === 0) {
      toast.error("Giỏ hàng đang trống.");
      return false;
    }

    if (unavailableItems.length > 0) {
      toast.error(
        unavailableItems[0].availability_reason ||
          "Có gian hàng hiện đang tạm ngừng nhận đơn mới.",
      );
      return false;
    }

    if (addresses.length === 0) {
      toast.error("Bạn cần thêm địa chỉ nhận hàng trước khi thanh toán.");
      navigate("/profile?tab=addresses");
      return false;
    }

    if (!selectedAddressId) {
      toast.error("Vui lòng chọn địa chỉ nhận hàng.");
      return false;
    }

    return true;
  };

  const handleCheckout = async () => {
    if (checkoutLoading) return;
    if (!validateCheckout()) return;

    try {
      setCheckoutLoading(true);

      const payload = {
        address_id: selectedAddressId || null,
        shipping_name: shippingForm.shipping_name,
        shipping_phone: shippingForm.shipping_phone,
        shipping_address: shippingForm.shipping_address,
        note: shippingForm.note || null,
        payment_method: paymentMethod,
        cart_item_ids: cart.items.map((item) => item.id),

        split_orders: groups.map((group) => ({
          farm_id: group.farmId,
          farm_name: group.farmName,
          items_total: getFarmItemsTotal(group),
          shipping_fee: getFarmShippingFee(group),
          total: getFarmGrandTotal(group),
          items: group.items.map((item) => ({
            cart_item_id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
          })),
        })),
      };

      const response = await checkoutService.checkout(payload);
      const payloadData = response.data ?? response;
      const data = payloadData.data ?? payloadData;

      toast.success(payloadData.message || "Tạo đơn hàng thành công.");
      sessionStorage.removeItem("checkout_cart_item_ids");
      window.dispatchEvent(new Event("cart:updated"));

      const momoUrl =
        data.payment_url ||
        data.pay_url ||
        data.payUrl ||
        data.momo_url ||
        data.checkout_url;

      if (paymentMethod === "MOMO" && momoUrl) {
        window.location.href = momoUrl;
        return;
      }

    const orderId = data.order?.id || data.order_id || data.id;

    navigate(
      `/order-success?order=${orderId || ""}&method=${paymentMethod}`
    );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Thanh toán thất bại."));
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-main py-8">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto animate-spin text-[#6BAE4F]" size={34} />

          <p className="mt-3 font-semibold text-slate-500">
            Đang tải thông tin thanh toán...
          </p>
        </div>
      </div>
    );
  }

  if (!cart.items.length) {
    return (
      <div className="container-main py-8">
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
          <PackageOpen size={42} className="mx-auto text-[#6BAE4F]" />

          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
            Giỏ hàng đang trống
          </h1>

          <p className="mt-2 text-sm font-semibold text-slate-500">
            Hãy thêm sản phẩm vào giỏ hàng trước khi thanh toán.
          </p>

          <Link
            to="/products"
            className="mt-5 inline-flex rounded-2xl bg-[#6BAE4F] px-6 py-3 font-bold text-white"
          >
            Mua sắm ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-main py-8">
      <div className="mb-5">
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#6BAE4F]"
        >
          <ChevronLeft size={17} />
          Quay lại giỏ hàng
        </Link>

        <h1 className="mt-3 text-3xl font-black text-slate-900">
          Thanh toán
        </h1>

        <p className="mt-1 text-sm font-semibold text-slate-500">
          Hệ thống sẽ tự động tách đơn theo từng nông trại để giao hàng minh
          bạch và nhanh hơn.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-8">
          {unavailableItems.length > 0 && (
            <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
              <AlertTriangle size={20} className="mt-0.5 shrink-0" />
              <div>
                <p>Không thể tạo đơn mới cho một gian hàng đang tạm ngừng nhận đơn.</p>
                <p className="mt-1 font-semibold">
                  {unavailableItems[0].availability_reason ||
                    "Vui lòng quay lại giỏ hàng và bỏ chọn sản phẩm này."}
                </p>
              </div>
            </div>
          )}
          <ShippingInfo
            form={shippingForm}
            addresses={addresses}
            selectedAddressId={selectedAddressId}
            onSelectAddress={handleSelectAddress}
            onChange={handleChangeShipping}
          />

          <SplitOrderPreview groups={groups} />
        </div>

        <div className="xl:col-span-4">
          <CheckoutSummary
            groups={groups}
            itemsTotal={itemsTotal}
            shippingTotal={shippingTotal}
            grandTotal={grandTotal}
            paymentMethod={paymentMethod}
            onPaymentChange={setPaymentMethod}
            loading={checkoutLoading}
            unavailable={unavailableItems.length > 0}
            onCheckout={handleCheckout}
          />
        </div>
      </div>
    </div>
  );
}

function ShippingInfo({
  form,
  addresses,
  selectedAddressId,
  onSelectAddress,
  onChange,
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin size={20} className="text-[#6BAE4F]" />

          <h2 className="text-lg font-extrabold text-slate-900">
            1. Thông tin giao hàng
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {addresses.length > 0 && (
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Chọn địa chỉ đã lưu
            </label>

        <ResponsiveSelect
          value={selectedAddressId}
          onChange={onSelectAddress}
          options={addresses.map((address) => ({
            value: address.id,
            label: `${address.receiver_name} - ${address.phone} - ${getFullAddress(address)}${
              address.is_default ? " (Mặc định)" : ""
            }`,
          }))}
        />
          </div>
        )}

        {addresses.length === 0 && (
          <div className="md:col-span-2 rounded-2xl border border-dashed border-orange-200 bg-orange-50 p-4 text-sm font-semibold text-orange-600">
            Bạn chưa có địa chỉ lưu sẵn. Vui lòng thêm địa chỉ trong hồ sơ trước khi
            thanh toán.
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Họ tên người nhận
          </label>

          <input
            name="shipping_name"
            value={form.shipping_name}
            readOnly
            onChange={onChange}
            placeholder="Ví dụ: Nguyễn Văn A"
            className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-[#6BAE4F] focus:ring-4 focus:ring-green-50"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Số điện thoại
          </label>

          <input
            name="shipping_phone"
            value={form.shipping_phone}
            readOnly
            onChange={onChange}
            placeholder="Ví dụ: 0901234567"
            className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-[#6BAE4F] focus:ring-4 focus:ring-green-50"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Địa chỉ giao hàng
          </label>

          <input
            name="shipping_address"
            value={form.shipping_address}
            readOnly
            onChange={onChange}
            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
            className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm font-semibold outline-none focus:border-[#6BAE4F] focus:ring-4 focus:ring-green-50"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Ghi chú cho đơn hàng
            <span className="font-semibold text-slate-400">
              {" "}
              (không bắt buộc)
            </span>
          </label>

          <textarea
            name="note"
            value={form.note}
            onChange={onChange}
            rows="3"
            placeholder="Ví dụ: Giao hàng giờ hành chính, gọi trước khi giao..."
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-[#6BAE4F] focus:ring-4 focus:ring-green-50"
          />
        </div>
      </div>
    </div>
  );
}

function SplitOrderPreview({ groups }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-2 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Store size={20} className="text-[#6BAE4F]" />

          <h2 className="text-lg font-extrabold text-slate-900">
            2. Đơn hàng được tách theo nông trại
          </h2>
        </div>

        <span className="w-fit rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-[#6BAE4F]">
          {groups.length} đơn con
        </span>
      </div>

      <div className="space-y-4">
        {groups.map((group, index) => {
          const itemsTotal = getFarmItemsTotal(group);
          const shippingFee = getFarmShippingFee(group);
          const total = getFarmGrandTotal(group);

          return (
            <div
              key={group.farmKey}
              className="overflow-hidden rounded-3xl border border-slate-100 bg-white"
            >
              <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 font-extrabold text-slate-900">
                  <span className="rounded-full bg-[#6BAE4F] px-3 py-1 text-xs font-black text-white">
                    Đơn {index + 1}
                  </span>

                  <Store size={18} className="text-[#6BAE4F]" />

                  {group.farmSlug ? (
                    <Link
                      to={`/farms/${group.farmSlug}`}
                      className="hover:text-[#6BAE4F] hover:underline"
                    >
                      {group.farmName}
                    </Link>
                  ) : (
                    <span>{group.farmName}</span>
                  )}
                </div>

                <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">
                  {group.items.length} loại · {formatKg(sumItemQuantity(group.items))}
                </span>
              </div>

              <div className="hidden grid-cols-12 border-b border-slate-100 px-5 py-3 text-xs font-black uppercase text-slate-400 md:grid">
                <div className="col-span-5">Sản phẩm</div>
                <div className="col-span-2 text-right">Đơn giá</div>
                <div className="col-span-2 text-center">Số lượng</div>
                <div className="col-span-3 text-right">Thành tiền</div>
              </div>

              <div className="divide-y divide-slate-100">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-12 md:items-center"
                  >
                    <div className="flex gap-3 md:col-span-5">
                      {item.is_publicly_visible && item.product_slug ? (
                        <Link to={`/products/${item.product_slug}`} className="flex-none">
                          <img
                            src={
                              item.product_image ||
                              "https://placehold.co/100x100?text=Product"
                            }
                            alt={item.product_name}
                            className="h-20 w-20 rounded-2xl border border-slate-100 object-cover"
                          />
                        </Link>
                      ) : (
                        <img
                          src={
                            item.product_image ||
                            "https://placehold.co/100x100?text=Product"
                          }
                          alt={item.product_name}
                          className="h-20 w-20 rounded-2xl border border-slate-100 object-cover"
                        />
                      )}

                      <div className="min-w-0 flex-1">
                        {item.is_publicly_visible && item.product_slug ? (
                          <Link
                            to={`/products/${item.product_slug}`}
                            className="line-clamp-2 font-extrabold text-slate-900 hover:text-[#6BAE4F] hover:underline"
                          >
                            {item.product_name}
                          </Link>
                        ) : (
                          <p className="line-clamp-2 font-extrabold text-slate-900">
                            {item.product_name}
                          </p>
                        )}

                        {item.unit && (
                          <p className="mt-1 text-sm font-semibold text-slate-400">
                            Đơn vị: {item.unit}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:col-span-2 md:block md:text-right">
                      <span className="text-sm font-bold text-slate-400 md:hidden">
                        Đơn giá
                      </span>

                      <span className="font-bold text-slate-700">
                        {formatMoney(item.price)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between md:col-span-2 md:block md:text-center">
                      <span className="text-sm font-bold text-slate-400 md:hidden">
                        Số lượng
                      </span>

                      <span className="font-bold text-slate-700">
                        {formatQuantity(item.quantity)} {item.unit || "kg"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between md:col-span-3 md:block md:text-right">
                      <span className="text-sm font-bold text-slate-400 md:hidden">
                        Thành tiền
                      </span>

                      <span className="font-extrabold text-slate-900">
                        {formatMoney(item.subtotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                <div className="ml-auto max-w-sm space-y-2">
                  <SummaryRow
                    label="Tiền hàng"
                    value={formatMoney(itemsTotal)}
                  />

                  <SummaryRow
                    label="Phí vận chuyển"
                    value={formatMoney(shippingFee)}
                  />

                  <div className="border-t border-dashed border-slate-200 pt-2">
                    <SummaryRow
                      label="Tổng đơn con"
                      value={formatMoney(total)}
                      bold
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CheckoutSummary({
  groups,
  itemsTotal,
  shippingTotal,
  grandTotal,
  paymentMethod,
  onPaymentChange,
  loading,
  unavailable,
  onCheckout,
}) {
  const totalTypes = groups.reduce((total, group) => {
    return total + group.items.length;
  }, 0);
  const totalQuantity = groups.reduce((total, group) => {
    return total + sumItemQuantity(group.items);
  }, 0);

  return (
    <div className="sticky top-28 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <ShieldCheck size={20} className="text-[#6BAE4F]" />

        <h2 className="text-lg font-extrabold text-slate-900">
          Tổng thanh toán
        </h2>
      </div>

      <div className="mt-5 space-y-3">
        <SummaryRow label="Số đơn con" value={`${groups.length} đơn`} />

        <SummaryRow label="Số loại sản phẩm" value={`${totalTypes} loại`} />

        <SummaryRow label="Tổng khối lượng" value={formatKg(totalQuantity)} />

        <SummaryRow label="Tiền hàng" value={formatMoney(itemsTotal)} />

        <SummaryRow
          label="Tổng phí vận chuyển"
          value={formatMoney(shippingTotal)}
        />
      </div>

      <div className="my-5 border-t border-dashed border-slate-200" />

      <PaymentMethodInSummary
        value={paymentMethod}
        onChange={onPaymentChange}
      />

      <div className="mt-5 border-t border-dashed border-slate-200 pt-4">
        <SummaryRow
          label="Cần thanh toán"
          value={formatMoney(grandTotal)}
          bold
        />
      </div>

      <button
        type="button"
        onClick={onCheckout}
        disabled={loading || unavailable}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#6BAE4F] text-sm font-extrabold text-white shadow-lg shadow-green-100 transition hover:bg-[#5d9d43] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}

        {paymentMethod === "MOMO" ? "Thanh toán qua MoMo" : "Đặt hàng"}
      </button>

      <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-600">
        <div className="flex gap-2">
          <ShieldCheck size={18} className="mt-0.5 flex-none" />

          <p>
            Hệ thống sẽ tạo 1 đơn hàng chính và nhiều đơn con theo từng nông
            trại.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-green-50 p-4 text-sm font-semibold text-[#4f9140]">
        <div className="flex gap-2">
          <Truck size={18} className="mt-0.5 flex-none" />

          <p>
            Phí vận chuyển được tính riêng cho từng nông trại để minh bạch chi
            phí giao hàng.
          </p>
        </div>
      </div>
    </div>
  );
}

function PaymentMethodInSummary({ value, onChange }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <CreditCard size={18} className="text-[#6BAE4F]" />

        <h3 className="text-sm font-extrabold text-slate-900">
          Phương thức thanh toán
        </h3>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onChange("COD")}
          className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
            value === "COD"
              ? "border-[#6BAE4F] bg-green-50"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full border ${
              value === "COD" ? "border-[#6BAE4F]" : "border-slate-300"
            }`}
          >
            {value === "COD" && (
              <span className="h-2.5 w-2.5 rounded-full bg-[#6BAE4F]" />
            )}
          </span>

          <Truck size={22} className="text-[#6BAE4F]" />

          <div>
            <p className="font-extrabold text-slate-900">
              Thanh toán khi nhận hàng
            </p>

            <p className="text-xs font-semibold text-slate-500">
              Trả tiền mặt khi đơn hàng được giao đến bạn.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChange("MOMO")}
          className={`payment-option-momo flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
            value === "MOMO"
              ? "border-pink-500 bg-pink-50"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full border ${
              value === "MOMO" ? "border-pink-500" : "border-slate-300"
            }`}
          >
            {value === "MOMO" && (
              <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />
            )}
          </span>

          <Wallet size={22} className="text-pink-500" />

          <div>
            <p className="font-extrabold text-slate-900">
              MoMo Sandbox · Thẻ ATM nội địa
            </p>

            <p className="text-xs font-semibold text-slate-500">
              Chuyển sang cổng MoMo payWithATM để thanh toán online.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, bold = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          bold
            ? "font-extrabold text-slate-900"
            : "font-semibold text-slate-500"
        }
      >
        {label}
      </span>

      <span
        className={
          bold
            ? "text-2xl font-extrabold text-[#5fa846]"
            : "font-bold text-slate-800"
        }
      >
        {value}
      </span>
    </div>
  );
}

function normalizeCart(payload) {
  const data = payload || {};
  const rawItems = data.items || data.cart_items || [];

  const items = rawItems.map((item) => {
    const product = item.product || {};
    const quantity = Number(item.quantity || 0);

    const price = Number(
      item.price ??
        item.product_price ??
        item.sale_price ??
        product.sale_price ??
        product.price ??
        0
    );

    return {
      id: item.id,
      product_id: item.product_id || product.id,
      product_slug: item.product_slug || product.slug || "",
      product_name: item.product_name || product.name || "Sản phẩm",
      product_image:
        item.product_image ||
        product.thumbnail ||
        product.image ||
        "https://placehold.co/120x120?text=Product",
      is_publicly_visible: item.is_publicly_visible !== false,
      unit: item.unit || product.unit || "",
      quantity,
      price,
      subtotal: Number(item.subtotal ?? quantity * price),
      farm_id: item.farm_id || product.farm_id || product.farm?.id || "unknown",
      farm_name:
        item.farm_name ||
        item.farm?.name ||
        product.farm?.name ||
        "Nông trại",
      farm_slug:
        item.farm_slug || item.farm?.slug || product.farm?.slug || "",
      is_available: item.is_available !== false,
      availability_reason:
        item.availability_reason ||
        item.order_unavailable_reason ||
        product.order_unavailable_reason ||
        null,
      shipping_fee: Number(
        item.shipping_fee ??
          item.farm?.shipping_fee ??
          product.farm?.shipping_fee ??
          DEFAULT_SHIPPING_FEE
      ),
    };
  });

  return {
    id: data.id || data.cart_id || null,
    items,
  };
}

function groupItemsByFarm(items) {
  const map = new Map();

  items.forEach((item) => {
    const farmKey = item.farm_id || "unknown";

    if (!map.has(farmKey)) {
      map.set(farmKey, {
        farmKey,
        farmId: item.farm_id,
        farmName: item.farm_name || "Nông trại",
        farmSlug: item.farm_slug || "",
        shipping_fee: item.shipping_fee ?? DEFAULT_SHIPPING_FEE,
        items: [],
      });
    }

    map.get(farmKey).items.push(item);
  });

  return Array.from(map.values());
}

function getFarmShippingFee(group) {
  return Number(group.shipping_fee ?? DEFAULT_SHIPPING_FEE);
}

function getFarmItemsTotal(group) {
  return group.items.reduce((total, item) => {
    return total + Number(item.subtotal || 0);
  }, 0);
}

function getFarmGrandTotal(group) {
  return getFarmItemsTotal(group) + getFarmShippingFee(group);
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN") + "đ";
}

function getFullAddress(address) {
  if (!address) return "";

  return (
    address.full_address ||
    [
      address.address_line,
      address.ward,
      address.district,
      address.province,
    ]
      .filter(Boolean)
      .join(", ")
  );
}
