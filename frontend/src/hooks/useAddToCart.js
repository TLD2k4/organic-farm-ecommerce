import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import buyerCartService from "@/services/buyerCartService";
import { useAuthStore } from "@/store/authStore";
import { getApiErrorMessage } from "@/utils/apiError";

export default function useAddToCart() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const [adding, setAdding] = useState(false);

  const addToCart = async (product, quantity = 1) => {
    if (!token) {
      toast.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      navigate("/login");
      return false;
    }

    if (!product?.id || adding) return false;

    if (product.accepting_orders === false) {
      toast.error(
        product.order_unavailable_reason ||
          product.farm?.order_unavailable_reason ||
          "Gian hàng hiện đang tạm ngừng nhận đơn mới.",
      );
      return false;
    }

    const hasStock = product.stock_quantity !== null && product.stock_quantity !== undefined;
    if (hasStock && Number(product.stock_quantity) <= 0) {
      toast.error("Sản phẩm hiện đã hết hàng.");
      return false;
    }

    setAdding(true);
    try {
      const response = await buyerCartService.addItem(product.id, quantity);
      window.dispatchEvent(
        new CustomEvent("cart:updated", { detail: response?.data }),
      );
      toast.success(response?.message || "Đã thêm sản phẩm vào giỏ hàng.");
      return true;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể thêm sản phẩm vào giỏ hàng."));
      return false;
    } finally {
      setAdding(false);
    }
  };

  return { addToCart, adding };
}
