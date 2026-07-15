import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  Loader2,
  Minus,
  PackageOpen,
  Plus,
  ShoppingCart,
  Store,
  Trash2,
  Truck,
} from "lucide-react";

import buyerCartService from "../../services/buyerCartService";
import { confirmAction } from "../../utils/actionDialog";

const DEFAULT_SHIPPING_FEE = 30000;

export default function CartPage() {
  const navigate = useNavigate();

  const [cart, setCart] = useState({
    id: null,
    items: [],
    items_total: 0,
    total_quantity: 0,
  });

  const [loading, setLoading] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchCart = useCallback(async ({ showLoading = true } = {}) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const response = await buyerCartService.getCart();
      const payload = response.data ?? response;
      const normalizedCart = normalizeCart(payload.cart || payload);

      setCart(normalizedCart);
      setSelectedIds((current) => {
        const valid = current.filter((id) => normalizedCart.items.some((item) => item.id === id));
        return valid.length ? valid : normalizedCart.items.map((item) => item.id);
      });
      window.dispatchEvent(
        new CustomEvent("cart:updated", { detail: normalizedCart }),
      );
    } catch (error) {
      console.log("LOAD CART ERROR:", error);

      toast.error(error?.response?.data?.message || "Không thể tải giỏ hàng.");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchCart({ showLoading: true });
  }, [fetchCart]);

  const selectedItems = useMemo(() => (cart.items || []).filter((item) => selectedIds.includes(item.id)), [cart.items, selectedIds]);
  const cartGroups = useMemo(() => groupItemsByFarm(cart.items || []), [cart.items]);
  const groups = useMemo(() => groupItemsByFarm(selectedItems), [selectedItems]);

  const itemsTotal = useMemo(() => {
    return selectedItems.reduce((total, item) => {
      return total + Number(item.subtotal || 0);
    }, 0);
  }, [selectedItems]);

  const totalQuantity = useMemo(() => {
    return selectedItems.reduce((total, item) => {
      return total + Number(item.quantity || 0);
    }, 0);
  }, [selectedItems]);

  const shippingTotal = useMemo(() => {
    return groups.reduce((total, group) => {
      return total + getFarmShippingFee(group);
    }, 0);
  }, [groups]);

  const grandTotal = itemsTotal + shippingTotal;

  const handleUpdateQuantity = async (item, nextQuantity) => {
    if (updatingItemId || removingItemId) return;

    const quantity = Number(nextQuantity);

    if (quantity < 1) {
      return;
    }

    if (item.stock_quantity > 0 && quantity > item.stock_quantity) {
      toast.error("Số lượng vượt quá tồn kho hiện có.");
      return;
    }

    try {
      setUpdatingItemId(item.id);

      const response = await buyerCartService.updateItem(item.id, quantity);

      toast.success(response.message || "Cập nhật giỏ hàng thành công.");

      await fetchCart({ showLoading: false });
    } catch (error) {
      const errors = error?.response?.data?.errors;
      const firstError = errors ? Object.values(errors)?.[0]?.[0] : null;

      toast.error(
        firstError ||
          error?.response?.data?.message ||
          "Không thể cập nhật số lượng.",
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (item) => {
    if (removingItemId || updatingItemId) return;

    try {
      setRemovingItemId(item.id);

      const response = await buyerCartService.removeItem(item.id);

      toast.success(response.message || "Đã xóa sản phẩm khỏi giỏ hàng.");

      await fetchCart({ showLoading: false });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể xóa sản phẩm.");
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleClearCart = async () => {
    if (clearing || cart.items.length === 0) return;

    const confirmed = await confirmAction({ title: "Xóa toàn bộ giỏ hàng", description: "Tất cả sản phẩm đang chọn và chưa chọn sẽ bị xóa khỏi giỏ.", confirmLabel: "Xóa giỏ hàng", danger: true });

    if (!confirmed) return;

    try {
      setClearing(true);

      const response = await buyerCartService.clearCart();

      toast.success(response.message || "Đã xóa toàn bộ giỏ hàng.");

      await fetchCart({ showLoading: false });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể xóa giỏ hàng.");
    } finally {
      setClearing(false);
    }
  };

  const handleCheckout = () => {
    if (selectedIds.length === 0) {
      toast.error("Vui lòng tick chọn ít nhất một sản phẩm.");
      return;
    }
    sessionStorage.setItem("checkout_cart_item_ids", JSON.stringify(selectedIds));
    navigate("/checkout");
  };

  return (
    <div className="space-y-6">
      <PageHeader totalQuantity={totalQuantity} />

      {loading ? (
        <CartSkeleton />
      ) : cart.items.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-8">
            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Sản phẩm trong giỏ
                </h2>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {totalQuantity} sản phẩm từ {groups.length} nông trại
                </p>
              </div>

              <label className="ml-auto mr-3 inline-flex items-center gap-2 text-sm font-bold text-slate-600">
                <input type="checkbox" checked={selectedIds.length === cart.items.length} onChange={() => setSelectedIds(selectedIds.length === cart.items.length ? [] : cart.items.map((item) => item.id))} className="h-5 w-5 accent-green-600" />
                Chọn tất cả
              </label>

              <button
                onClick={handleClearCart}
                disabled={clearing}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {clearing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Xóa tất cả
              </button>
            </div>

            {cartGroups.map((group) => (
              <CartFarmGroup
                key={group.farmKey}
                group={group}
                selectedIds={selectedIds}
                onToggle={(id) => setSelectedIds((ids) => ids.includes(id) ? ids.filter((itemId) => itemId !== id) : [...ids, id])}
                updatingItemId={updatingItemId}
                removingItemId={removingItemId}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
              />
            ))}
          </div>

          <div className="xl:col-span-4">
            <CartSummary
              itemsTotal={itemsTotal}
              totalQuantity={totalQuantity}
              farmsCount={groups.length}
              shippingTotal={shippingTotal}
              grandTotal={grandTotal}
              onCheckout={handleCheckout}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PageHeader({ totalQuantity }) {
  return (
    <div className="overflow-hidden rounded-[28px] bg-linear-to-r from-[#5fa846] via-emerald-500 to-lime-500 p-6 text-white shadow-lg shadow-green-100">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <ShoppingCart size={30} />
          </div>

          <div>
            <p className="text-sm font-bold text-white/80">Organic Farm</p>

            <h1 className="mt-1 text-3xl font-black">Giỏ hàng của tôi</h1>

            <p className="mt-1 text-sm font-medium text-white/90">
              Kiểm tra sản phẩm trước khi tiến hành thanh toán.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white/20 px-5 py-3 text-sm font-black backdrop-blur">
          {totalQuantity} sản phẩm
        </div>
      </div>
    </div>
  );
}

function CartFarmGroup({
  group,
  selectedIds,
  onToggle,
  updatingItemId,
  removingItemId,
  onUpdateQuantity,
  onRemoveItem,
}) {
  const farmItemsTotal = getFarmItemsTotal(group);
  const farmShippingFee = getFarmShippingFee(group);
  const farmGrandTotal = getFarmGrandTotal(group);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2 font-extrabold text-slate-900">
          <Store size={18} className="text-[#5fa846]" />
          {group.farmName}
        </div>

        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-[#5fa846]">
          {group.items.length} sản phẩm
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {group.items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            selected={selectedIds.includes(item.id)}
            onToggle={() => onToggle(item.id)}
            updating={updatingItemId === item.id}
            removing={removingItemId === item.id}
            disabled={Boolean(updatingItemId || removingItemId)}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
          />
        ))}
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
        <div className="ml-auto max-w-sm space-y-2">
          <SummaryRow
            label="Tiền hàng gian hàng"
            value={formatMoney(farmItemsTotal)}
          />
          <SummaryRow
            label="Phí vận chuyển gian hàng"
            value={formatMoney(farmShippingFee)}
          />
          <div className="border-t border-dashed border-slate-200 pt-2">
            <SummaryRow
              label="Tạm tính gian hàng"
              value={formatMoney(farmGrandTotal)}
              bold
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CartItemRow({
  item,
  selected,
  onToggle,
  updating,
  removing,
  disabled,
  onUpdateQuantity,
  onRemoveItem,
}) {
  const isOutOfStock =
    Number(item.stock_quantity || 0) > 0 &&
    Number(item.quantity || 0) > Number(item.stock_quantity || 0);

  return (
    <div className="grid grid-cols-1 gap-4 px-5 py-4 lg:grid-cols-12 lg:items-center">
      <div className="lg:col-span-6">
        <div className="flex gap-4">
          <input aria-label={`Chọn ${item.product_name}`} type="checkbox" checked={selected} onChange={onToggle} className="mt-10 h-5 w-5 shrink-0 accent-green-600" />
          <Link
            to={
              item.product_slug ? `/products/${item.product_slug}` : "/products"
            }
            className="flex-none"
          >
            <img
              src={
                item.product_image ||
                "https://placehold.co/120x120?text=Product"
              }
              alt={item.product_name}
              className="h-24 w-24 rounded-2xl border border-slate-100 object-cover"
            />
          </Link>

          <div className="min-w-0 flex-1">
            <Link
              to={
                item.product_slug
                  ? `/products/${item.product_slug}`
                  : "/products"
              }
              className="line-clamp-2 text-base font-extrabold text-slate-900 hover:text-[#5fa846]"
            >
              {item.product_name}
            </Link>

            <p className="mt-1 text-sm font-semibold text-slate-400">
              Đơn vị: {item.unit || "sản phẩm"}
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-md bg-green-50 px-2 py-1 text-xs font-bold text-[#5fa846]">
                Organic
              </span>

              {item.stock_quantity > 0 && (
                <span className="rounded-md bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500">
                  Còn {formatNumber(item.stock_quantity)}
                </span>
              )}

              {isOutOfStock && (
                <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-bold text-red-500">
                  Vượt tồn kho
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <p className="font-extrabold text-slate-900">
          {formatMoney(item.price)}
        </p>

        {item.original_price > item.price && (
          <p className="mt-1 text-xs font-semibold text-slate-400 line-through">
            {formatMoney(item.original_price)}
          </p>
        )}
      </div>

      <div className="lg:col-span-2">
        <div className="inline-flex h-10 items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
          <button
            disabled={disabled || item.quantity <= 1}
            onClick={() => onUpdateQuantity(item, item.quantity - 1)}
            className="flex h-10 w-10 items-center justify-center text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus size={15} />
          </button>

          <div className="flex h-10 min-w-12 items-center justify-center border-x border-slate-200 px-3 text-sm font-extrabold text-slate-900">
            {updating ? (
              <Loader2 size={16} className="animate-spin text-[#5fa846]" />
            ) : (
              item.quantity
            )}
          </div>

          <button
            disabled={
              disabled ||
              (item.stock_quantity > 0 && item.quantity >= item.stock_quantity)
            }
            onClick={() => onUpdateQuantity(item, item.quantity + 1)}
            className="flex h-10 w-10 items-center justify-center text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 lg:col-span-2 lg:justify-end">
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-400">Tạm tính</p>
          <p className="text-lg font-extrabold text-[#5fa846]">
            {formatMoney(item.subtotal)}
          </p>
        </div>

        <button
          disabled={disabled}
          onClick={() => onRemoveItem(item)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-white text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {removing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Trash2 size={17} />
          )}
        </button>
      </div>
    </div>
  );
}

function CartSummary({
  itemsTotal,
  totalQuantity,
  farmsCount,
  shippingTotal,
  grandTotal,
  onCheckout,
}) {
  return (
    <div className="sticky top-28 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-extrabold text-slate-900">
        Tóm tắt thanh toán
      </h2>

      <div className="mt-5 space-y-3">
        <SummaryRow label="Số sản phẩm" value={`${totalQuantity} sản phẩm`} />
        <SummaryRow label="Số gian hàng" value={`${farmsCount} nông trại`} />
        <SummaryRow label="Tiền hàng" value={formatMoney(itemsTotal)} />
        <SummaryRow
          label="Tổng phí vận chuyển"
          value={formatMoney(shippingTotal)}
        />

        <div className="border-t border-dashed border-slate-200 pt-4">
          <SummaryRow
            label="Tổng thanh toán"
            value={formatMoney(grandTotal)}
            bold
          />
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-green-50 p-4 text-sm font-semibold text-[#4f8f3e]">
        <div className="flex gap-2">
          <Truck size={18} className="mt-0.5 flex-none" />
          <p>
            Khi thanh toán, hệ thống sẽ tự tách đơn theo từng nông trại. Mỗi
            nông trại có phí vận chuyển riêng.
          </p>
        </div>
      </div>

      <button
        onClick={onCheckout}
        disabled={totalQuantity === 0}
        className="mt-5 h-12 w-full rounded-2xl bg-[#6BAE4F] text-sm font-extrabold text-white shadow-lg shadow-green-100 transition hover:bg-[#5d9d43] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Tiến hành thanh toán
      </button>

      <Link
        to="/products"
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition hover:bg-slate-50"
      >
        <ChevronLeft size={17} />
        Tiếp tục mua hàng
      </Link>
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

function EmptyCart() {
  return (
    <div className="rounded-[28px] border border-slate-100 bg-white p-12 text-center shadow-sm">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-green-50 text-[#5fa846]">
        <PackageOpen size={38} />
      </div>

      <h2 className="mt-5 text-2xl font-extrabold text-slate-900">
        Giỏ hàng đang trống
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-slate-500">
        Hãy chọn thêm nông sản yêu thích để bắt đầu đặt hàng.
      </p>

      <Link
        to="/products"
        className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-[#6BAE4F] px-6 text-sm font-extrabold text-white transition hover:bg-[#5d9d43]"
      >
        Mua sắm ngay
      </Link>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="space-y-4 xl:col-span-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-5 h-5 w-1/3 animate-pulse rounded-full bg-slate-100" />

            <div className="flex gap-4">
              <div className="h-24 w-24 animate-pulse rounded-2xl bg-slate-100" />

              <div className="flex-1 space-y-3">
                <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
                <div className="h-4 w-1/3 animate-pulse rounded-full bg-slate-100" />
                <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-100" />
              </div>

              <div className="hidden w-40 space-y-3 lg:block">
                <div className="h-4 animate-pulse rounded-full bg-slate-100" />
                <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="xl:col-span-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="h-6 w-1/2 animate-pulse rounded-full bg-slate-100" />
          <div className="mt-6 space-y-4">
            <div className="h-4 animate-pulse rounded-full bg-slate-100" />
            <div className="h-4 animate-pulse rounded-full bg-slate-100" />
            <div className="h-4 animate-pulse rounded-full bg-slate-100" />
            <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      </div>
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
        0,
    );

    const originalPrice = Number(item.original_price ?? product.price ?? price);

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
      unit: item.unit || product.unit || "",
      quantity,
      price,
      original_price: originalPrice,
      subtotal: Number(item.subtotal ?? quantity * price),
      stock_quantity: Number(
        item.stock_quantity ?? product.stock_quantity ?? 0,
      ),
      farm_id: item.farm_id || product.farm_id || product.farm?.id || "unknown",
      farm_name:
        item.farm_name || item.farm?.name || product.farm?.name || "Nông trại",

      shipping_fee: Number(
        item.shipping_fee ??
          item.farm?.shipping_fee ??
          product.farm?.shipping_fee ??
          DEFAULT_SHIPPING_FEE,
      ),
    };
  });

  return {
    id: data.id || data.cart_id || null,
    items,
    items_count: Number(data.items_count ?? items.length),
    items_total: Number(
      data.items_total ??
        items.reduce((total, item) => total + Number(item.subtotal || 0), 0),
    ),
    total_quantity: Number(
      data.total_quantity ??
        items.reduce((total, item) => total + Number(item.quantity || 0), 0),
    ),
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
        shipping_fee: Number(item.shipping_fee ?? DEFAULT_SHIPPING_FEE),
        items: [],
      });
    }

    map.get(farmKey).items.push(item);
  });

  return Array.from(map.values());
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("vi-VN") + "đ";
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("vi-VN");
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
