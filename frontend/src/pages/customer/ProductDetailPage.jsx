import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BadgeCheck,
  ChevronRight,
  Heart,
  Leaf,
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
import productService from "../../services/productService";

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
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
 const [reviewsMeta, setReviewsMeta] = useState(DEFAULT_REVIEWS_META);
 const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        const res = await productService.getProduct(id);
        const payload = getPayload(res);
        const productData = payload?.data || payload;

        setProduct(productData);
        
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
  }, [id]);

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

  const increaseQuantity = () => {
    setQuantity((prev) => Math.min(prev + 1, maxQuantity));
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(prev - 1, 1));
  };

  const handleAddToCart = () => {
    toast.success("Đã thêm sản phẩm vào giỏ hàng");
  };

 const loadReviews = async (page = 1, mode = "replace") => {
  try {
    setReviewsLoading(true);

    const res = await productService.getProductReviews(id, {
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

const changeReviewsPage = (page) => {
  if (page === "..." || page === reviewsMeta.current_page) return;

  loadReviews(page, "replace");
};
  if (loading) {
    return (
      <main className="bg-[#f7fbf3] py-6">
        <div className="container-main">
          <div className="h-[560px] animate-pulse rounded-3xl bg-white shadow-sm" />
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
              className="relative grid h-[420px] w-full cursor-zoom-in place-items-center overflow-hidden rounded-3xl bg-[#f4faef]"
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
                to={product.farm?.slug ? `/farms/${product.farm.slug}` : "/farms"}
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
              <p className="mb-2 font-black text-slate-900">Số lượng</p>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-11 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={decreaseQuantity}
                    className="grid w-11 place-items-center text-slate-600 hover:bg-slate-50"
                  >
                    <Minus size={16} />
                  </button>

                  <input
                    value={quantity}
                    onChange={(e) => {
                      const value = Number(e.target.value || 1);
                      setQuantity(Math.max(1, Math.min(value, maxQuantity)));
                    }}
                    className="w-14 border-x border-slate-200 text-center text-sm font-black outline-none"
                  />

                  <button
                    type="button"
                    onClick={increaseQuantity}
                    className="grid w-11 place-items-center text-slate-600 hover:bg-slate-50"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <p className="text-sm font-semibold text-slate-500">
                  Còn lại:{" "}
                  {stockValue === null || stockValue === undefined
                    ? "Đang cập nhật"
                    : stockValue}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex min-w-[220px] items-center justify-center gap-2 rounded-xl bg-green-700 px-6 py-3 text-sm font-black text-white transition hover:bg-green-800"
              >
                <ShoppingCart size={18} />
                Thêm vào giỏ
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
              <InfoRow label="Nông trại" value={product.farm?.name} />
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
        onPageChange={changeReviewsPage}
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
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
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
  onPageChange,
}) {
  const currentPage = Number(meta.current_page || 1);
  const lastPage = Number(meta.last_page || 1);
  const total = Number(meta.total || 0);

  const pages = buildPages(currentPage, lastPage);

  const canLoadMore = currentPage < lastPage;

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
              ? `Hiển thị ${reviews.length}/${total} bình luận đánh giá`
              : "Chưa có bình luận đánh giá"}
          </p>
        </div>

        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700">
          Chỉ khách đã mua mới được đánh giá
        </span>
      </div>

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
                        src={review.user.avatar}
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

                    <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                      {review.comment || "Khách hàng chưa để lại nội dung."}
                    </p>
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
                {loading ? "Đang tải..." : "Tải thêm bình luận"}
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
                  )
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
            Khách hàng sau khi mua hàng và nhận hàng thành công mới có thể đánh giá sản phẩm.
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
    <Link
      to={`/products/${product.id}`}
      className="group overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
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

      <div className="p-3">
        <h3 className="min-h-[42px] font-black leading-5 text-slate-900 group-hover:text-green-700">
          {product.name}
        </h3>

        <p className="mt-1 truncate text-xs font-semibold text-slate-500">
          {product.farm?.name || "Organic Farm"}
        </p>

        <div className="mt-2">
          <p className="text-lg font-black text-green-700">{priceText}</p>

          {oldPriceText && (
            <p className="text-xs font-semibold text-slate-400 line-through">
              {oldPriceText}
            </p>
          )}
        </div>
      </div>
    </Link>
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