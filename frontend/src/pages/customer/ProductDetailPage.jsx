import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BadgeCheck,
  ChevronRight,
  ChevronUp,
  Heart,
  Leaf,
  Loader2,
  MessageSquare,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Truck,
  X,
} from "lucide-react";
import buyerCartService from "../../services/buyerCartService";
import productService from "../../services/productService";
import reviewService from "../../services/reviewService";
import sellerReviewService from "../../services/sellerReviewService";
import adminReviewService from "../../services/adminReviewService";
import { getImageUrl } from "../../utils/image";
import { useAuthStore } from "../../store/authStore";
import ProgressiveList from "../../components/common/ProgressiveList";
import {
  formatQuantity,
  isQuantityDraft,
  MIN_CART_QUANTITY,
  parseQuantityInput,
  roundQuantity,
  stepQuantity,
} from "../../utils/quantity";

function getPayload(res) {
  return res?.data?.success !== undefined
    ? res.data
    : res?.success !== undefined
      ? res
      : res?.data || res;
}

function money(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function getImage(product) {
  return (
    product?.thumbnail_url ||
    product?.thumbnail ||
    product?.image_url ||
    product?.image ||
    ""
  );
}

function replyRoleLabel(reply) {
  const roles = Array.isArray(reply?.user?.roles) ? reply.user.roles : [];
  if (roles.includes("admin")) return "Quản trị viên";
  if (roles.includes("seller")) return "Người bán";
  return "Người dùng";
}

function getGalleryImages(product) {
  if (!product) return [];

  const result = [];

  const mainImage = getImage(product);
  if (mainImage) result.push(mainImage);

  const images =
    product?.images ||
    product?.gallery ||
    product?.product_images ||
    product?.productImages ||
    [];

  if (Array.isArray(images)) {
    images.forEach((item) => {
      const url =
        item?.url ||
        item?.image_url ||
        item?.thumbnail_url ||
        item?.path ||
        item?.image ||
        item;

      if (url && !result.includes(url)) {
        result.push(url);
      }
    });
  }

  return result;
}

function getCertificateName(product) {
  return (
    product?.certification_name ||
    product?.certificate?.certification_name ||
    product?.certificate?.certification?.name ||
    product?.certification?.name ||
    ""
  );
}

function formatSoldQuantity(product) {
  const quantity = Number(product?.sold_quantity ?? 0);
  const unit = product?.unit || "";

  if (!quantity) return "Chưa bán";

  const displayQuantity = Number.isInteger(quantity)
    ? quantity
    : quantity.toFixed(1).replace(".0", "");

  return `Đã bán ${displayQuantity}${unit ? ` ${unit}` : ""}`;
}

function getStockValue(product) {
  const value =
    product?.stock_quantity ??
    product?.quantity_remaining ??
    product?.quantity ??
    null;

  if (value === null || value === undefined || value === "") return null;

  return Number(value);
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState("1");
  const [reviews, setReviews] = useState([]);
  const [reviewsMeta, setReviewsMeta] = useState(DEFAULT_REVIEWS_META);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [reviewableItem, setReviewableItem] = useState(null);
  const [reviewEligibility, setReviewEligibility] = useState(DEFAULT_REVIEW_ELIGIBILITY);
  const [reviewMode, setReviewMode] = useState("rating_review");
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewSaving, setReviewSaving] = useState(false);
  const [replyingReviewId, setReplyingReviewId] = useState(null);
  const [replyComment, setReplyComment] = useState("");
  const [replySaving, setReplySaving] = useState(false);
  const [staffComment, setStaffComment] = useState("");
  const [staffCommentSaving, setStaffCommentSaving] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        const res = await productService.getProduct(slug);
        const payload = getPayload(res);
        const productData = payload?.data || payload;

        setProduct(productData);
        setQuantity(1);
        setQuantityInput("1");
        setReviewableItem(null);
        setReviewEligibility(DEFAULT_REVIEW_ELIGIBILITY);

        if (token) {
          const eligibleResponse = await reviewService.getEligibility(productData.id).catch(() => null);
          const eligiblePayload = eligibleResponse?.data ?? eligibleResponse;
          const eligibility = {
            has_purchased: Boolean(eligiblePayload?.has_purchased),
            can_comment: Boolean(eligiblePayload?.can_comment),
            can_rate: Boolean(eligiblePayload?.can_rate),
            order_item_id: eligiblePayload?.order_item_id || null,
          };

          setReviewEligibility(eligibility);
          setReviewableItem(eligibility.can_rate
            ? { order_item_id: eligibility.order_item_id, product: productData }
            : null);
          setReviewMode(eligibility.can_rate ? "rating_review" : "buyer_comment");
        }

        setReviews(productData?.reviews || []);
        setReviewsMeta(productData?.reviews_meta || DEFAULT_REVIEWS_META);

        const galleryImages = getGalleryImages(productData);
        setSelectedImage(galleryImages[0] || getImage(productData));
      } catch (error) {
        console.log("LOAD PRODUCT DETAIL ERROR:", error);
        toast.error("Không thể tải chi tiết sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug, token]);

  const submitReview = async () => {
    const isBuyerComment = reviewMode === "buyer_comment";

    if (isBuyerComment && !reviewEligibility.can_comment) return;
    if (!isBuyerComment && !reviewableItem) return;
    if (isBuyerComment && !reviewForm.comment.trim()) {
      toast.error("Vui lòng nhập nội dung bình luận.");
      return;
    }

    try {
      setReviewSaving(true);
      await reviewService.createReview(isBuyerComment
        ? {
            entry_type: "buyer_comment",
            product_id: product.id,
            comment: reviewForm.comment.trim(),
          }
        : {
            entry_type: "rating_review",
            order_item_id: reviewableItem.order_item_id,
            rating: reviewForm.rating,
            comment: reviewForm.comment.trim(),
          });
      toast.success(isBuyerComment
        ? "Đã gửi bình luận sản phẩm."
        : "Đã gửi đánh giá sản phẩm.");
      setProduct((currentProduct) => {
        if (!currentProduct) return currentProduct;

        if (isBuyerComment) {
          return {
            ...currentProduct,
            comment_count: Number(currentProduct.comment_count || 0) + 1,
          };
        }

        const currentCount = Number(currentProduct.review_count || 0);
        const currentAverage = Number(currentProduct.rating_avg ?? currentProduct.rating ?? 0);
        const nextCount = currentCount + 1;
        const nextAverage = ((currentAverage * currentCount) + Number(reviewForm.rating)) / nextCount;

        return {
          ...currentProduct,
          review_count: nextCount,
          rating: nextAverage,
          rating_avg: nextAverage,
        };
      });
      setReviewForm({ rating: 5, comment: "" });

      const eligibleResponse = await reviewService.getEligibility(product.id).catch(() => null);
      const eligiblePayload = eligibleResponse?.data ?? eligibleResponse;
      if (eligiblePayload) {
        const eligibility = {
          has_purchased: Boolean(eligiblePayload.has_purchased),
          can_comment: Boolean(eligiblePayload.can_comment),
          can_rate: Boolean(eligiblePayload.can_rate),
          order_item_id: eligiblePayload.order_item_id || null,
        };
        setReviewEligibility(eligibility);
        setReviewableItem(eligibility.can_rate
          ? { order_item_id: eligibility.order_item_id, product }
          : null);
        setReviewMode(eligibility.can_rate ? reviewMode : "buyer_comment");
      } else if (!isBuyerComment) {
        setReviewableItem(null);
        setReviewEligibility((current) => ({
          ...current,
          can_rate: false,
          order_item_id: null,
        }));
        setReviewMode("buyer_comment");
      }

      const response = await productService
        .getProductReviews(product.id, { page: 1, limit: reviewsMeta.per_page || 5 })
        .catch(() => null);
      if (response) {
        const payload = getPayload(response);
        setReviews(payload?.data || payload?.reviews || []);
        setReviewsMeta(payload?.meta || DEFAULT_REVIEWS_META);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể gửi đánh giá.");
    } finally {
      setReviewSaving(false);
    }
  };

  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const canReplyReviews = roles.includes("admin") || (
    roles.includes("seller") && Number(product?.farm?.seller_id) === Number(user?.id)
  );

  const submitReviewReply = async (reviewId) => {
    if (!replyComment.trim()) return;
    try {
      setReplySaving(true);
      if (roles.includes("admin")) {
        await adminReviewService.reply(reviewId, replyComment.trim());
      } else {
        await sellerReviewService.reply(reviewId, replyComment.trim());
      }
      toast.success("Đã trả lời đánh giá.");
      setReplyingReviewId(null);
      setReplyComment("");
      await loadReviews(1, "replace");
    } catch (error) {
      toast.error(Object.values(error?.errors || {})[0]?.[0] || error?.message || "Không thể trả lời đánh giá.");
    } finally {
      setReplySaving(false);
    }
  };

  const submitStaffComment = async () => {
    if (!staffComment.trim() || !canReplyReviews) return;
    try {
      setStaffCommentSaving(true);
      if (roles.includes("admin")) {
        await adminReviewService.createProductComment(product.id, staffComment.trim());
      } else {
        await sellerReviewService.createProductComment(product.id, staffComment.trim());
      }
      toast.success("Đã đăng bình luận sản phẩm.");
      setStaffComment("");
      await loadReviews(1, "replace");
    } catch (error) {
      toast.error(Object.values(error?.errors || {})[0]?.[0] || error?.message || "Không thể đăng bình luận.");
    } finally {
      setStaffCommentSaving(false);
    }
  };

  const images = useMemo(() => getGalleryImages(product), [product]);

  const certificateName = getCertificateName(product);

  const relatedProducts =
    product?.related_products ||
    product?.relatedProducts ||
    product?.related ||
    [];

  const finalPriceText =
    product?.final_price_text ||
    money(product?.final_price ?? product?.sale_price ?? product?.price);

  const oldPriceText =
    product?.sale_price && Number(product.sale_price) < Number(product.price)
      ? product.price_text || money(product.price)
      : null;

  const discountPercent = product?.discount_percent || 0;

  const stockValue = getStockValue(product);
  const maxQuantity =
    Number.isFinite(stockValue) && stockValue > 0 ? stockValue : 999;

  const farmLogo =
    product?.farm?.logo_url ||
    product?.farm?.logo ||
    product?.farm?.avatar_url ||
    product?.farm?.avatar ||
    "";

  const setCommittedQuantity = (nextQuantity) => {
    const rounded = roundQuantity(nextQuantity);
    const normalizedMax = roundQuantity(maxQuantity);
    const next = Math.max(
      MIN_CART_QUANTITY,
      Number.isFinite(normalizedMax) && normalizedMax >= MIN_CART_QUANTITY
        ? Math.min(rounded, normalizedMax)
        : rounded,
    );

    setQuantity(next);
    setQuantityInput(formatQuantity(next));

    return next;
  };

  const commitQuantityInput = ({ showError = false } = {}) => {
    const parsed = roundQuantity(parseQuantityInput(quantityInput));

    if (!Number.isFinite(parsed) || parsed < MIN_CART_QUANTITY) {
      if (showError) toast.error("Khối lượng tối thiểu là 0,1 kg.");
      return setCommittedQuantity(MIN_CART_QUANTITY);
    }

    if (Number.isFinite(stockValue) && parsed > stockValue) {
      if (showError) {
        toast.error(`Khối lượng vượt tồn kho. Hiện còn ${formatQuantity(stockValue)} kg.`);
      }
      return setCommittedQuantity(stockValue);
    }

    return setCommittedQuantity(parsed);
  };

  const increaseQuantity = () => {
    setCommittedQuantity(stepQuantity(quantity, 1, maxQuantity));
  };

  const decreaseQuantity = () => {
    setCommittedQuantity(stepQuantity(quantity, -1, maxQuantity));
  };

  const handleAddToCart = async () => {
    if (!token) {
      toast.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      navigate("/login");
      return;
    }

    if (!product?.id || addingToCart) return;

    if (product.accepting_orders === false) {
      toast.error(
        product.order_unavailable_reason ||
          "Gian hàng hiện đang tạm ngừng nhận đơn mới.",
      );
      return;
    }

    if (Number.isFinite(stockValue) && stockValue < MIN_CART_QUANTITY) {
      toast.error("Sản phẩm hiện đã hết hàng.");
      return;
    }

    const requestedQuantity = commitQuantityInput({ showError: true });

    setAddingToCart(true);

    try {
      const response = await buyerCartService.addItem(product.id, requestedQuantity);

      window.dispatchEvent(
        new CustomEvent("cart:updated", { detail: response?.data }),
      );

      toast.success(response?.message || "Đã thêm sản phẩm vào giỏ hàng.");
    } catch (error) {
      const firstValidationError = Object.values(error?.errors || {})[0]?.[0];

      toast.error(
        firstValidationError ||
          error?.message ||
          "Không thể thêm sản phẩm vào giỏ hàng.",
      );
    } finally {
      setAddingToCart(false);
    }
  };

  const loadReviews = async (page = 1, mode = "replace") => {
    try {
      setReviewsLoading(true);

      if (!product?.id) {
        return;
      }

      const res = await productService.getProductReviews(product.id, {
        page,
        limit: reviewsMeta.per_page || 5,
      });

      const payload = getPayload(res);

      const nextReviews = payload?.data || [];
      const nextMeta = payload?.meta || DEFAULT_REVIEWS_META;

      if (mode === "append") {
        setReviews((prev) => uniqueReviews([...prev, ...nextReviews]));
      } else {
        setReviews(nextReviews);
      }

      setReviewsMeta(nextMeta);
    } catch (error) {
      console.log("LOAD REVIEWS ERROR:", error);
      toast.error("Không thể tải bình luận đánh giá");
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadMoreReviews = () => {
    const currentPage = Number(reviewsMeta.current_page || 1);
    const lastPage = Number(reviewsMeta.last_page || 1);

    if (currentPage >= lastPage) return;

    loadReviews(currentPage + 1, "append");
  };

  const collapseReviews = () => {
    loadReviews(1, "replace");
  };

  const changeReviewsPage = (page) => {
    if (page === "..." || page === reviewsMeta.current_page) return;

    loadReviews(page, "replace");
  };
  if (loading) {
    return (
      <main className="bg-[#f7fbf3] py-6">
        <div className="container-main">
          <div className="h-140 animate-pulse rounded-3xl bg-white shadow-sm" />
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="bg-[#f7fbf3] py-10">
        <div className="container-main">
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <Leaf size={48} className="mx-auto text-green-700" />

            <h1 className="mt-4 text-2xl font-black text-slate-900">
              Không tìm thấy sản phẩm
            </h1>

            <Link
              to="/products"
              className="mt-5 inline-flex rounded-xl bg-green-700 px-5 py-3 text-sm font-black text-white hover:bg-green-800"
            >
              Quay lại sản phẩm
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#f7fbf3] py-6">
      <div className="container-main">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-500">
          <Link to="/" className="hover:text-green-700">
            Trang chủ
          </Link>

          <ChevronRight size={15} />

          <Link to="/products" className="hover:text-green-700">
            Sản phẩm
          </Link>

          <ChevronRight size={15} />

          <span className="truncate text-slate-700">{product.name}</span>
        </div>

        <section className="grid gap-6 rounded-3xl border border-green-100 bg-white p-4 shadow-sm lg:grid-cols-[1fr_1.1fr] lg:p-6">
          <div>
            <button
              type="button"
              onClick={() => selectedImage && setPreviewOpen(true)}
              className="relative grid h-105 w-full cursor-zoom-in place-items-center overflow-hidden rounded-3xl bg-[#f4faef]"
            >
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="h-full w-full object-contain p-4"
                />
              ) : (
                <Leaf size={80} className="text-green-700" />
              )}

              <span className="absolute bottom-4 right-4 rounded-xl bg-white/90 px-3 py-1.5 text-xs font-black text-green-700 shadow-sm">
                Bấm để xem ảnh lớn
              </span>

              {discountPercent > 0 && (
                <span className="absolute left-4 top-4 rounded-xl bg-red-500 px-3 py-1.5 text-sm font-black text-white">
                  -{discountPercent}%
                </span>
              )}

              {product.is_hot ? (
                <span className="absolute right-4 top-4 rounded-xl bg-green-700 px-3 py-1.5 text-sm font-black text-white">
                  Nổi bật
                </span>
              ) : null}
            </button>

            {images.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-black text-slate-900">
                  Ảnh sản phẩm
                </p>

                <div className="grid grid-cols-5 gap-3">
                  {images.slice(0, 5).map((image) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className={`h-20 overflow-hidden rounded-2xl border bg-[#f4faef] ${
                        selectedImage === image
                          ? "border-green-700"
                          : "border-green-100"
                      }`}
                    >
                      <img
                        src={image}
                        alt={product.name}
                        className="h-full w-full object-contain p-1"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {product.category?.name && (
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">
                  {product.category.name}
                </span>
              )}

              {product.certificate && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                  <ShieldCheck size={14} />
                  {certificateName || "Đã chứng nhận"}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-black leading-tight text-slate-950">
              {product.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              {product.review_count > 0 && product.rating ? (
                <div className="flex items-center gap-1">
                  <Star size={16} className="fill-amber-400 text-amber-400" />

                  <span className="font-black text-slate-800">
                    {Number(product.rating).toFixed(1)}
                  </span>

                  <span className="font-semibold text-slate-400">
                    ({product.review_count} đánh giá)
                  </span>
                </div>
              ) : (
                <span className="font-bold text-slate-400">
                  Chưa có đánh giá
                </span>
              )}

              <span className="font-bold text-slate-400">|</span>

              <span className="font-bold text-slate-500">
                {formatSoldQuantity(product)}
              </span>
            </div>

            <div className="mt-5 rounded-2xl bg-green-50 p-5">
              <div className="flex flex-wrap items-end gap-3">
                <p className="text-4xl font-black text-green-700">
                  {finalPriceText}
                </p>

                {oldPriceText && (
                  <p className="pb-1 text-lg font-bold text-slate-400 line-through">
                    {oldPriceText}
                  </p>
                )}
              </div>

              {product.unit && (
                <p className="mt-1 text-sm font-bold text-slate-500">
                  Đơn vị: {product.unit}
                </p>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <InfoBox icon={Truck} title="Giao hàng" desc="Giao tận nơi" />
              <InfoBox
                icon={ShieldCheck}
                title="Chất lượng"
                desc="Nguồn gốc rõ ràng"
              />
              <InfoBox icon={BadgeCheck} title="Đổi trả" desc="Hỗ trợ 7 ngày" />
            </div>

            {product.farm && (
              <Link
                to={
                  product.farm?.slug ? `/farms/${product.farm.slug}` : "/farms"
                }
                className="mt-5 flex items-center justify-between rounded-2xl border border-green-100 p-4 transition hover:bg-green-50"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-green-100 text-green-700">
                    {farmLogo ? (
                      <img
                        src={farmLogo}
                        alt={product.farm.name}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <Store size={24} />
                    )}
                  </div>

                  <div>
                    <p className="font-black text-slate-900">
                      {product.farm.name}
                    </p>

                    <p className="text-sm font-semibold text-slate-500">
                      Xem gian hàng
                    </p>
                  </div>
                </div>

                <ChevronRight size={18} className="text-green-700" />
              </Link>
            )}

            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="mb-2 font-black text-slate-900">Khối lượng (kg)</p>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-11 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={decreaseQuantity}
                    disabled={quantity <= MIN_CART_QUANTITY}
                    aria-label={`Giảm 0,1 kg ${product.name}`}
                    title="Giảm 0,1 kg"
                    className="grid w-11 place-items-center text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus size={16} />
                  </button>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={quantityInput}
                    onChange={(e) => {
                      const value = e.target.value;

                      if (!isQuantityDraft(value)) return;

                      setQuantityInput(value);

                      const parsed = roundQuantity(parseQuantityInput(value));
                      if (
                        Number.isFinite(parsed) &&
                        parsed >= MIN_CART_QUANTITY &&
                        parsed <= maxQuantity
                      ) {
                        setQuantity(parsed);
                      }
                    }}
                    onBlur={() => commitQuantityInput()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") event.currentTarget.blur();
                    }}
                    aria-label={`Khối lượng ${product.name}, đơn vị kg`}
                    title="Nhập khối lượng, ví dụ 0,5 hoặc 1,25 kg"
                    className="w-16 border-x border-slate-200 text-center text-sm font-black outline-none"
                  />

                  <button
                    type="button"
                    onClick={increaseQuantity}
                    disabled={quantity >= maxQuantity}
                    aria-label={`Tăng 0,1 kg ${product.name}`}
                    title="Tăng 0,1 kg"
                    className="grid w-11 place-items-center text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <span className="text-xs font-semibold text-slate-500">
                  Tối thiểu 0,1 kg · nhập được 0,5 hoặc 1.25
                </span>

                <p className="text-sm font-semibold text-slate-500">
                  Còn lại:{" "}
                  {stockValue === null || stockValue === undefined
                    ? "Đang cập nhật"
                    : `${formatQuantity(stockValue)} kg`}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {product.accepting_orders === false && (
                <div className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                  {product.order_unavailable_reason ||
                    "Gian hàng hiện đang tạm ngừng nhận đơn mới."}
                </div>
              )}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={
                  addingToCart ||
                  product.accepting_orders === false ||
                  (Number.isFinite(stockValue) && stockValue < MIN_CART_QUANTITY)
                }
                className="flex min-w-55 items-center justify-center gap-2 rounded-xl bg-green-700 px-6 py-3 text-sm font-black text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {addingToCart ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ShoppingCart size={18} />
                )}
                {addingToCart
                  ? "Đang thêm..."
                  : product.accepting_orders === false
                    ? "Tạm ngừng nhận đơn"
                    : "Thêm vào giỏ"}
              </button>

              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-6 py-3 text-sm font-black text-green-700 transition hover:bg-green-50"
              >
                <Heart size={18} />
                Yêu thích
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-3xl border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              Mô tả sản phẩm
            </h2>

            <div className="mt-4 whitespace-pre-line text-sm font-medium leading-7 text-slate-600">
              {product.description ||
                "Sản phẩm hiện chưa có mô tả chi tiết. Organic Farm sẽ cập nhật thông tin trong thời gian sớm nhất."}
            </div>
          </div>

          <div className="rounded-3xl border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              Thông tin sản phẩm
            </h2>

            <div className="mt-4 space-y-3 text-sm">
              <InfoRow label="Danh mục" value={product.category?.name} />
              <InfoRow
                label="Nông trại"
                value={
                  product.farm?.slug ? (
                    <Link
                      to={`/farms/${product.farm.slug}`}
                      className="text-green-700 hover:underline"
                    >
                      {product.farm.name}
                    </Link>
                  ) : (
                    product.farm?.name
                  )
                }
              />
              <InfoRow label="Đơn vị" value={product.unit} />
              <InfoRow
                label="Trạng thái"
                value={product.status === 1 ? "Đang bán" : "Ngừng bán"}
              />
              <InfoRow
                label="Chứng nhận"
                value={certificateName || "Đã chứng nhận"}
              />
            </div>
          </div>
        </section>

        <ReviewSection
          reviews={reviews}
          meta={reviewsMeta}
          loading={reviewsLoading}
          onLoadMore={loadMoreReviews}
          onCollapse={collapseReviews}
          onPageChange={changeReviewsPage}
          reviewableItem={reviewableItem}
          reviewEligibility={reviewEligibility}
          reviewMode={reviewMode}
          setReviewMode={setReviewMode}
          reviewForm={reviewForm}
          setReviewForm={setReviewForm}
          reviewSaving={reviewSaving}
          onSubmitReview={submitReview}
          canReplyReviews={canReplyReviews}
          replyingReviewId={replyingReviewId}
          replyComment={replyComment}
          replySaving={replySaving}
          onStartReply={(reviewId) => { setReplyingReviewId(reviewId); setReplyComment(""); }}
          onCancelReply={() => { setReplyingReviewId(null); setReplyComment(""); }}
          onReplyCommentChange={setReplyComment}
          onSubmitReply={submitReviewReply}
          staffComment={staffComment}
          staffCommentSaving={staffCommentSaving}
          onStaffCommentChange={setStaffComment}
          onSubmitStaffComment={submitStaffComment}
          ratingReviewCount={product.review_count}
          commentCount={product.comment_count}
        />

        {relatedProducts.length > 0 && (
          <section className="mt-6 rounded-3xl border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
              <Leaf size={21} className="text-green-700" />
              Sản phẩm liên quan
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {relatedProducts.map((item) => (
                <RelatedProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      {previewOpen && (
        <ImagePreviewModal
          image={selectedImage}
          alt={product.name}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </main>
  );
}

function InfoBox({ icon: Icon, title, desc }) {
  return (
    <div className="rounded-2xl border border-green-100 bg-white p-4">
      <Icon size={22} className="text-green-700" />

      <p className="mt-2 font-black text-slate-900">{title}</p>

      <p className="mt-1 text-xs font-semibold text-slate-500">{desc}</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <span className="font-bold text-slate-500">{label}</span>

      <span className="text-right font-black text-slate-800">
        {value || "Đang cập nhật"}
      </span>
    </div>
  );
}

function ImagePreviewModal({ image, alt, onClose }) {
  return (
    <div
      className="fixed inset-0 z-999 flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng xem ảnh"
        title="Đóng xem ảnh"
        className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white text-slate-800 hover:bg-slate-100"
      >
        <X size={22} />
      </button>

      <img
        src={image}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] max-w-[92vw] rounded-2xl object-contain"
      />
    </div>
  );
}

function ReviewSection({
  reviews = [],
  meta = DEFAULT_REVIEWS_META,
  loading = false,
  onLoadMore,
  onCollapse,
  onPageChange,
  reviewableItem,
  reviewEligibility = DEFAULT_REVIEW_ELIGIBILITY,
  reviewMode,
  setReviewMode,
  reviewForm,
  setReviewForm,
  reviewSaving,
  onSubmitReview,
  canReplyReviews,
  replyingReviewId,
  replyComment,
  replySaving,
  onStartReply,
  onCancelReply,
  onReplyCommentChange,
  onSubmitReply,
  staffComment,
  staffCommentSaving,
  onStaffCommentChange,
  onSubmitStaffComment,
  ratingReviewCount = 0,
  commentCount = 0,
}) {
  const currentPage = Number(meta.current_page || 1);
  const lastPage = Number(meta.last_page || 1);
  const total = Number(meta.total || 0);

  const pages = buildPages(currentPage, lastPage);

  const canLoadMore = currentPage < lastPage;
  const canCollapse = currentPage > 1 && reviews.length > Number(meta.per_page || 5);
  const canWriteBuyerEntry = reviewEligibility.can_comment || Boolean(reviewableItem);
  const isBuyerCommentMode = reviewMode === "buyer_comment";

  return (
    <section className="mt-6 rounded-3xl border border-green-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
            <MessageSquare size={21} className="text-green-700" />
            Đánh giá sản phẩm
          </h2>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            {total > 0
              ? `${Number(ratingReviewCount)} đánh giá đã mua · ${Number(commentCount)} bình luận · đang hiển thị ${reviews.length}/${total}`
              : "Chưa có đánh giá hoặc bình luận"}
          </p>
        </div>

        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">
          Khách đã mua được chọn đánh giá hoặc bình luận
        </span>
      </div>

      {canReplyReviews && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          <p className="font-black text-emerald-900">Bình luận với tư cách {staffCommentSaving ? "..." : "quản trị/người bán"}</p>
          <p className="mt-1 text-xs font-semibold text-emerald-700">Bình luận này được tính riêng, không cộng vào tổng đánh giá hoặc điểm sao.</p>
          <textarea rows={3} maxLength={2000} value={staffComment} onChange={(event) => onStaffCommentChange(event.target.value)} placeholder="Đăng thông tin hoặc giải đáp chung về sản phẩm..." className="mt-3 w-full rounded-xl border border-emerald-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
          <div className="mt-2 flex justify-end"><button type="button" disabled={staffCommentSaving || !staffComment.trim()} onClick={onSubmitStaffComment} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">{staffCommentSaving ? "Đang đăng..." : "Đăng bình luận"}</button></div>
        </div>
      )}

      {canWriteBuyerEntry && (
        <div className="mt-5 rounded-2xl border border-green-200 bg-green-50/60 p-4">
          <p className="font-black text-green-900">Chia sẻ về sản phẩm</p>
          <p className="mt-1 text-xs font-semibold text-green-700">
            Đánh giá có chấm sao; bình luận chỉ có nội dung và không làm thay đổi điểm sản phẩm.
          </p>

          <div className="mt-3 inline-flex rounded-xl border border-green-200 bg-white p-1">
            <button
              type="button"
              disabled={!reviewEligibility.can_rate}
              onClick={() => setReviewMode("rating_review")}
              title={reviewEligibility.can_rate ? "Chấm sao và đánh giá sản phẩm" : "Bạn đã đánh giá lượt mua này"}
              className={`rounded-lg px-4 py-2 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-45 ${!isBuyerCommentMode ? "bg-green-700 text-white" : "text-slate-600 hover:bg-green-50"}`}
            >
              {reviewEligibility.can_rate ? "Đánh giá" : "Đã đánh giá"}
            </button>
            <button
              type="button"
              disabled={!reviewEligibility.can_comment}
              onClick={() => setReviewMode("buyer_comment")}
              title="Bình luận không chấm sao"
              className={`rounded-lg px-4 py-2 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-45 ${isBuyerCommentMode ? "bg-green-700 text-white" : "text-slate-600 hover:bg-green-50"}`}
            >
              Bình luận
            </button>
          </div>

          {!isBuyerCommentMode && reviewableItem && (
            <div className="mt-3 flex gap-1">
              {[1,2,3,4,5].map((rating) => (
                <button type="button" key={rating} onClick={() => setReviewForm((form) => ({ ...form, rating }))} aria-label={`Chọn ${rating} sao`} title={`Chọn ${rating} sao`}>
                  <Star size={22} className={rating <= reviewForm.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
                </button>
              ))}
            </div>
          )}

          <textarea
            value={reviewForm.comment}
            onChange={(event) => setReviewForm((form) => ({ ...form, comment: event.target.value }))}
            rows={3}
            maxLength={1000}
            required={isBuyerCommentMode}
            aria-label={isBuyerCommentMode ? "Nội dung bình luận" : "Nội dung đánh giá"}
            placeholder={isBuyerCommentMode ? "Nhập bình luận về sản phẩm..." : "Chia sẻ cảm nhận về sản phẩm (không bắt buộc)..."}
            className="mt-3 w-full rounded-xl border border-green-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="button"
            disabled={reviewSaving || (isBuyerCommentMode && !reviewForm.comment.trim())}
            onClick={onSubmitReview}
            className="mt-3 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50"
          >
            {reviewSaving ? "Đang gửi..." : isBuyerCommentMode ? "Gửi bình luận" : "Gửi đánh giá"}
          </button>
        </div>
      )}

      {reviews.length > 0 ? (
        <>
          <div className="mt-5 space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-green-100 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-green-100 text-green-700">
                    {review.user?.avatar ? (
                      <img
                        src={getImageUrl(review.user.avatar)}
                        alt={review.user?.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="font-black">
                        {review.user?.name?.charAt(0) || "K"}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-black text-slate-900">
                        {review.user?.name || "Khách hàng"}
                      </p>

                      <p className="text-xs font-bold text-slate-400">
                        {review.created_at || ""}
                      </p>
                    </div>

                    {!review.is_rating_review ? (
                      <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-black ${review.is_admin_comment ? "bg-red-50 text-red-700" : review.is_seller_comment ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}>
                        {review.entry_type_label || (review.is_admin_comment ? "Bình luận quản trị" : review.is_seller_comment ? "Bình luận người bán" : "Bình luận người mua")}
                      </span>
                    ) : (
                      <div className="mt-1 flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            size={14}
                            className={
                              index < Number(review.rating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300"
                            }
                          />
                        ))}
                      </div>
                    )}

                    <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                      {review.comment || (review.is_rating_review ? "Khách hàng chưa để lại nội dung." : "")}
                    </p>

                    {canReplyReviews && replyingReviewId !== review.id && (
                      <button type="button" onClick={() => onStartReply(review.id)} className="mt-2 text-sm font-black text-green-700 hover:underline">Trả lời {review.is_rating_review ? "đánh giá" : "bình luận"}</button>
                    )}

                    {canReplyReviews && replyingReviewId === review.id && (
                      <div className="mt-3 rounded-xl border border-green-200 bg-green-50/60 p-3">
                        <textarea autoFocus rows={3} maxLength={2000} value={replyComment} onChange={(event) => onReplyCommentChange(event.target.value)} placeholder="Nhập phản hồi công khai..." className="w-full rounded-xl border border-green-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                        <div className="mt-2 flex items-center justify-between gap-3"><span className="text-xs font-semibold text-slate-400">Phản hồi không tính vào điểm đánh giá.</span><div className="flex gap-2"><button type="button" disabled={replySaving} onClick={onCancelReply} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold">Hủy</button><button type="button" disabled={replySaving || !replyComment.trim()} onClick={() => onSubmitReply(review.id)} className="rounded-lg bg-green-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{replySaving ? "Đang gửi..." : "Gửi trả lời"}</button></div></div>
                      </div>
                    )}

                    <ProgressiveList items={review.replies || []} initialCount={1} step={3} moreLabel="Xem thêm phản hồi" collapseLabel="Đóng bớt" renderItem={(reply) => (
                      <div
                        key={reply.id}
                        className="mt-3 rounded-xl border-l-4 border-green-500 bg-green-50 px-4 py-3"
                      >
                        <p className="text-xs font-black text-green-800">
                          {reply.user?.name || "Organic Farm"} · {replyRoleLabel(reply)} · {reply.created_at}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-slate-700">
                          {reply.comment}
                        </p>
                      </div>
                    )} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col items-center gap-4">
            {canLoadMore && (
              <button
                type="button"
                disabled={loading}
                onClick={onLoadMore}
                className="rounded-xl bg-green-700 px-5 py-2.5 text-sm font-black text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Đang tải..." : "Xem thêm bình luận"}
              </button>
            )}

            {canCollapse && (
              <button
                type="button"
                disabled={loading}
                onClick={onCollapse}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                <ChevronUp size={17} /> Đóng bớt
              </button>
            )}

            {lastPage > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {pages.map((page, index) =>
                  page === "..." ? (
                    <span
                      key={`review-ellipsis-${index}`}
                      className="grid h-9 w-9 place-items-center text-sm font-black text-slate-400"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      disabled={loading}
                      onClick={() => onPageChange(page)}
                      className={`grid h-9 w-9 place-items-center rounded-xl border text-sm font-black transition ${
                        Number(page) === Number(currentPage)
                          ? "border-green-700 bg-green-700 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-green-300 hover:text-green-700"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-green-200 bg-green-50 p-6 text-center">
          <MessageSquare size={36} className="mx-auto text-green-700" />

          <p className="mt-3 font-black text-slate-900">
            Chưa có bình luận đánh giá
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            Khách hàng sau khi mua hàng và nhận hàng thành công mới có thể đánh
            giá sản phẩm.
          </p>
        </div>
      )}
    </section>
  );
}

function RelatedProductCard({ product }) {
  const image = getImage(product);

  const priceText =
    product.final_price_text ||
    product.price_text ||
    money(product.final_price ?? product.sale_price ?? product.price);

  const oldPriceText =
    product.sale_price && Number(product.sale_price) < Number(product.price)
      ? product.price_text || money(product.price)
      : null;

  return (
    <div className="group overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <Link to={`/products/${product.slug}`} className="block">
        <div className="relative h-44 bg-[#f4faef]">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-contain p-3 transition group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-green-700">
            <Leaf size={40} />
          </div>
        )}

        {product.discount_percent ? (
          <span className="absolute left-2 top-2 rounded-md bg-red-500 px-2 py-1 text-xs font-black text-white">
            -{product.discount_percent}%
          </span>
        ) : product.is_hot ? (
          <span className="absolute left-2 top-2 rounded-md bg-green-700 px-2 py-1 text-xs font-black text-white">
            Mới
          </span>
        ) : null}
        </div>
      </Link>

      <div className="p-3">
        <Link to={`/products/${product.slug}`}>
          <h3 className="min-h-10.5 font-black leading-5 text-slate-900 group-hover:text-green-700">
            {product.name}
          </h3>
        </Link>

        {product.farm?.slug ? (
          <Link
            to={`/farms/${product.farm.slug}`}
            className="mt-1 block truncate text-xs font-semibold text-slate-500 hover:text-green-700 hover:underline"
          >
            {product.farm?.name || "Organic Farm"}
          </Link>
        ) : (
          <p className="mt-1 truncate text-xs font-semibold text-slate-500">
            {product.farm?.name || "Organic Farm"}
          </p>
        )}

        <div className="mt-2">
          <p className="text-lg font-black text-green-700">{priceText}</p>

          {oldPriceText && (
            <p className="text-xs font-semibold text-slate-400 line-through">
              {oldPriceText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const DEFAULT_REVIEWS_META = {
  current_page: 1,
  last_page: 1,
  per_page: 5,
  total: 0,
  from: 0,
  to: 0,
};

const DEFAULT_REVIEW_ELIGIBILITY = {
  has_purchased: false,
  can_comment: false,
  can_rate: false,
  order_item_id: null,
};

function uniqueReviews(list) {
  return Array.from(new Map(list.map((item) => [item.id, item])).values());
}

function buildPages(current, last) {
  const pages = [];

  if (!last || last <= 1) return pages;

  if (last <= 5) {
    for (let i = 1; i <= last; i++) pages.push(i);
    return pages;
  }

  pages.push(1);

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < last - 2) pages.push("...");

  pages.push(last);

  return pages;
}
