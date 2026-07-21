import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
  Reply,
  Search,
  Star,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import sellerReviewService from "../../services/sellerReviewService";
import ResponsiveSelect from "../../components/common/ResponsiveSelect";
import ProgressiveList from "../../components/common/ProgressiveList";
import useDebounce from "../../hooks/useDebounce";
import { getApiErrorMessage } from "../../utils/apiError";
import { highlight } from "../../utils/highlight";

const DEFAULT_META = {
  current_page: 1,
  last_page: 1,
  per_page: 5,
  total: 0,
  from: null,
  to: null,
};

const DEFAULT_STATS = {
  total_reviews: 0,
  total_comments: 0,
  visible_reviews: 0,
  hidden_reviews: 0,
  visible_comments: 0,
  hidden_comments: 0,
  avg_rating: 0,
  rating_counts: {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  },
};

function isRatingReview(review) {
  return review?.is_rating_review ?? review?.rating !== null;
}

function entryLabel(review) {
  return review?.entry_type_label ||
    (isRatingReview(review) ? "Đánh giá người mua" : "Bình luận sản phẩm");
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

export default function SellerReviews() {
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [meta, setMeta] = useState(DEFAULT_META);

  const [filters, setFilters] = useState({
    keyword: "",
    type: "",
    rating: "",
    status: "",
  });

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [replyReview, setReplyReview] = useState(null);
  const [replyComment, setReplyComment] = useState("");
  const [replyError, setReplyError] = useState("");
  const [hideReview, setHideReview] = useState(null);
  const [hideReason, setHideReason] = useState("");
  const debouncedKeyword = useDebounce(filters.keyword, 400);

  const loadReviews = useCallback(async (nextPage = page) => {
    try {
      setLoading(true);

      const payload = await sellerReviewService.getReviews({
        keyword: debouncedKeyword,
        type: filters.type,
        rating: filters.rating,
        status: filters.status,
        page: nextPage,
        limit: 5,
      });

      setReviews(payload?.data?.reviews || []);
      setStats(payload?.data?.stats || DEFAULT_STATS);
      setMeta(payload?.data?.meta || DEFAULT_META);
    } catch (error) {
      console.log("LOAD SELLER REVIEWS ERROR:", error);
      toast.error(getApiErrorMessage(error, "Không thể tải đánh giá gian hàng"));
    } finally {
      setLoading(false);
    }
  }, [
    debouncedKeyword,
    filters.type,
    filters.rating,
    filters.status,
    page,
  ]);

  useEffect(() => {
    loadReviews(page);
  }, [page, loadReviews]);

  const updateFilter = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setPage(1);
  };

  const updateReviewStatus = async (review, nextStatus, reason = null) => {

    try {
      setActionLoadingId(review.id);

      const payload = await sellerReviewService.updateStatus(
        review.id,
        nextStatus,
        reason?.trim() || null,
      );

      toast.success(
        payload?.message ||
          (nextStatus === 1 ? "Đã hiển thị nội dung" : "Đã ẩn nội dung"),
      );

      await loadReviews(page);
    } catch (error) {
      console.log("UPDATE REVIEW STATUS ERROR:", error);
      toast.error(
        getApiErrorMessage(error, "Không thể cập nhật trạng thái nội dung"),
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const goToProduct = (product) => {
    if (!product?.id) return;

    navigate(
      product.is_publicly_visible && product.slug
        ? `/products/${product.slug}`
        : `/seller/products?view=${product.id}`,
    );
  };

  const handleToggleStatus = (review) => {
    if (Number(review.status) === 1) {
      setHideReview(review);
      setHideReason("");
      return;
    }
    updateReviewStatus(review, 1);
  };

  const handleConfirmHide = async () => {
    if (!hideReview || !hideReason.trim()) return;
    await updateReviewStatus(hideReview, 0, hideReason.trim());
    setHideReview(null);
    setHideReason("");
  };

  const handleReply = (review) => {
    setReplyReview(review);
    setReplyComment("");
    setReplyError("");
  };

  const handleSubmitReply = async () => {
    if (!replyReview || !replyComment.trim()) {
      setReplyError("Vui lòng nhập nội dung trả lời.");
      return;
    }

    setActionLoadingId(replyReview.id);

    try {
      const payload = await sellerReviewService.reply(
        replyReview.id,
        replyComment.trim(),
      );
      toast.success(payload?.message || "Đã trả lời nội dung.");
      setReplyReview(null);
      setReplyComment("");
      await loadReviews(page);
    } catch (error) {
      setReplyError(getApiErrorMessage(error, "Không thể trả lời đánh giá."));
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold text-slate-950 sm:text-2xl">
            Đánh giá và bình luận gian hàng
          </h1>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Theo dõi riêng đánh giá đã mua và bình luận của quản trị/người bán.
          </p>
        </div>

        <div className="w-fit shrink-0 rounded-2xl bg-green-50 px-5 py-3 text-sm font-bold text-green-700">
          {stats.total_reviews} đánh giá · {stats.total_comments} bình luận
        </div>
      </div>

      <SellerReviewStats stats={stats} />

      <div
        className="min-w-0 rounded-2xl bg-white p-4 shadow-sm"
      >
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_180px_150px_160px_auto]">
          <div className="relative sm:col-span-2 xl:col-span-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={filters.keyword}
              onChange={(e) => updateFilter("keyword", e.target.value)}
              placeholder="Tìm theo sản phẩm, người mua, nội dung..."
              className="h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-4 text-sm font-semibold outline-none focus:border-green-600"
            />
          </div>

          <ResponsiveSelect
            value={filters.type}
            onChange={(value) => updateFilter("type", value)}
            options={[
              { value: "", label: "Tất cả nội dung" },
              { value: "rating_review", label: "Đánh giá người mua" },
              { value: "comment", label: "Bình luận Admin/Seller" },
            ]}
          />

          <ResponsiveSelect
            value={filters.rating}
            onChange={(value) => updateFilter("rating", value)}
            options={[
              { value: "", label: "Tất cả sao" },
              ...[5, 4, 3, 2, 1].map((rating) => ({
                value: String(rating),
                label: `${rating} sao`,
              })),
            ]}
          />

          <ResponsiveSelect
            value={filters.status}
            onChange={(value) => updateFilter("status", value)}
            options={[
              { value: "", label: "Tất cả trạng thái" },
              { value: "1", label: "Hiển thị" },
              { value: "0", label: "Đã ẩn" },
            ]}
          />

          <button
            type="button"
            onClick={() => {
              setFilters({ keyword: "", type: "", rating: "", status: "" });
              setPage(1);
            }}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 sm:col-span-2 xl:col-span-1"
          >
            <RotateCcw size={18} />
            Xóa bộ lọc
          </button>
        </div>
      </div>

      <div className="min-w-0 rounded-2xl bg-white p-3 shadow-sm sm:p-5">
        {loading ? (
          <SellerReviewSkeletonList />
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-green-200 bg-green-50 p-8 text-center">
            <MessageSquare size={42} className="mx-auto text-green-700" />

            <p className="mt-3 font-bold text-slate-950">
              Chưa có nội dung nào
            </p>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Đánh giá người mua và bình luận sản phẩm sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {reviews.map((review) => (
                <SellerReviewCard
                  key={review.id}
                  review={review}
                  keyword={filters.keyword}
                  actionLoadingId={actionLoadingId}
                  onToggleStatus={handleToggleStatus}
                  onReply={handleReply}
                  onGoToProduct={goToProduct}
                />
              ))}
            </div>

            <PaginationControls meta={meta} onPageChange={setPage} />
          </>
        )}
      </div>

      {replyReview && (
        <ReviewReplyModal
          review={replyReview}
          comment={replyComment}
          error={replyError}
          loading={actionLoadingId === replyReview.id}
          onChange={(value) => {
            setReplyComment(value);
            if (replyError) setReplyError("");
          }}
          onClose={() => {
            if (!actionLoadingId) setReplyReview(null);
          }}
          onSubmit={handleSubmitReply}
        />
      )}

      {hideReview && (
        <HideReviewModal
          review={hideReview}
          reason={hideReason}
          loading={actionLoadingId === hideReview.id}
          onChange={setHideReason}
          onClose={() => {
            if (!actionLoadingId) setHideReview(null);
          }}
          onSubmit={handleConfirmHide}
        />
      )}
    </div>
  );
}

function HideReviewModal({ review, reason, loading, onChange, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-70 grid place-items-center bg-slate-950/50 p-4" role="dialog" aria-modal="true">
      <button type="button" aria-label="Đóng" onClick={onClose} className="absolute inset-0" />
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
        <h2 className="text-xl font-extrabold text-slate-950">Ẩn {isRatingReview(review) ? "đánh giá" : "bình luận"}</h2>
        <p className="mt-2 text-sm text-slate-600">
          Nội dung của {review.author?.name || review.buyer?.name || "người dùng"} sẽ không còn hiển thị công khai. Người đăng sẽ thấy người thao tác, thời gian và lý do.
        </p>
        <textarea autoFocus rows={4} maxLength={500} value={reason} onChange={(event) => onChange(event.target.value)} placeholder="Nhập lý do ẩn nội dung..." className="mt-4 w-full rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100" />
        <p className="mt-1 text-right text-xs font-semibold text-slate-400">{reason.length}/500</p>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" disabled={loading} onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold">Hủy</button>
          <button type="button" disabled={loading || !reason.trim()} onClick={onSubmit} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{loading ? "Đang xử lý..." : "Xác nhận ẩn"}</button>
        </div>
      </div>
    </div>
  );
}

function ReviewReplyModal({
  review,
  comment,
  error,
  loading,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div
      className="fixed inset-0 z-70 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="seller-review-reply-title"
    >
      <button
        type="button"
        aria-label="Đóng hộp thoại trả lời"
        onClick={onClose}
        className="absolute inset-0"
      />

      <div className="relative w-full max-w-xl rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
        <h2
          id="seller-review-reply-title"
          className="text-xl font-extrabold text-slate-950"
        >
          Trả lời {isRatingReview(review) ? "đánh giá" : "bình luận"}
        </h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Phản hồi sẽ hiển thị công khai ngay bên dưới nội dung gốc.
        </p>

        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-extrabold text-slate-800">
            {review.author?.name || review.buyer?.name || "Người dùng"} ·{" "}
            {review.product?.name || "Sản phẩm"}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {review.comment || "Không có nội dung."}
          </p>
        </div>

        <label
          className="mt-4 block text-sm font-extrabold text-slate-700"
          htmlFor="seller-review-reply"
        >
          Nội dung trả lời
        </label>
        <textarea
          id="seller-review-reply"
          autoFocus
          rows={5}
          maxLength={2000}
          value={comment}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Nhập câu trả lời công khai..."
          className="mt-2 w-full resize-y rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
        />

        <div className="mt-1 flex justify-between gap-3 text-xs font-semibold">
          <span className="text-red-600">{error}</span>
          <span className="ml-auto text-slate-400">{comment.length}/2000</span>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={loading || !comment.trim()}
            onClick={onSubmit}
            className="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Đang gửi" : "Gửi trả lời"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SellerReviewStats({ stats }) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 min-[460px]:grid-cols-2 xl:grid-cols-5">
      <StatCard
        label="Tổng đánh giá"
        value={stats.total_reviews}
        subText="Tất cả đánh giá"
      />

      <StatCard
        label="Tổng bình luận"
        value={stats.total_comments}
        subText={`${stats.visible_comments || 0} hiện · ${stats.hidden_comments || 0} ẩn`}
      />

      <StatCard
        label="Điểm trung bình"
        value={`${Number(stats.avg_rating || 0).toFixed(1)}/5`}
        subText="Dựa trên đánh giá"
      />

      <StatCard
        label="Đang hiển thị"
        value={stats.visible_reviews}
        subText="Xuất hiện ở trang sản phẩm"
      />

      <StatCard
        label="Đã ẩn"
        value={stats.hidden_reviews}
        subText="Không hiển thị công khai"
      />
    </div>
  );
}

function StatCard({ label, value, subText }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 break-words text-xl font-extrabold text-slate-950 sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 text-xs font-semibold text-slate-400">{subText}</p>
    </div>
  );
}

function SellerReviewCard({
  review,
  keyword,
  actionLoadingId,
  onToggleStatus,
  onReply,
  onGoToProduct,
}) {
  const product = review.product;
  const author = review.author || review.buyer;
  const image = getImage(product);

  const updating = actionLoadingId === review.id;
  const visible = Number(review.status) === 1;

  return (
    <div className="min-w-0 rounded-2xl border border-green-100 p-4 shadow-sm">
      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <button
          type="button"
          onClick={() => onGoToProduct(product)}
          className="flex min-w-0 flex-col gap-3 text-left min-[400px]:flex-row min-[400px]:gap-4"
        >
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-green-50">
            {image ? (
              <img
                src={image}
                alt={product?.name || "Sản phẩm"}
                className="h-full w-full object-contain p-2 transition hover:scale-105"
              />
            ) : (
              <MessageSquare size={28} className="text-green-700" />
            )}
          </div>

          <div className="min-w-0">
            <h3 className={`entity-name-link break-words font-bold text-slate-950 ${product?.is_publicly_visible && product?.slug ? "entity-name-link-public" : "entity-name-link-management"}`}>
              {highlight(product?.name || "Sản phẩm", keyword)}
            </h3>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              Người đăng: {highlight(author?.name || "Người dùng", keyword)}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {isRatingReview(review) ? (
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      size={16}
                      className={
                        index < Number(review.rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300"
                      }
                    />
                  ))}
                </div>
              ) : (
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${review.is_admin_comment ? "bg-red-50 text-red-700" : review.is_buyer_comment ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}`}>
                  {entryLabel(review)}
                </span>
              )}

              <span className="text-xs font-bold text-slate-400">
                {review.created_at}
              </span>
            </div>

            <p className="mt-2 break-words text-sm font-medium leading-6 text-slate-600">
              {highlight(review.comment || "Người mua chưa nhập nội dung đánh giá.", keyword)}
            </p>
          </div>
        </button>

        <div className="flex w-full flex-col items-stretch gap-2 min-[400px]:flex-row min-[400px]:items-center lg:w-auto lg:flex-col lg:items-end">
          <span
            className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
              visible
                ? "bg-green-50 text-green-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {review.status_label}
          </span>

          <button
            type="button"
            disabled={updating}
            onClick={() => onToggleStatus(review)}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 ${
              visible
                ? "border border-red-100 text-red-600 hover:bg-red-50"
                : "border border-green-200 text-green-700 hover:bg-green-50"
            }`}
          >
            {updating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : visible ? (
              <EyeOff size={16} />
            ) : (
              <Eye size={16} />
            )}

            {visible ? "Ẩn nội dung" : "Hiện nội dung"}
          </button>

          <button
            type="button"
            disabled={updating}
            onClick={() => onReply(review)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 px-4 py-2 text-sm font-bold text-green-700 hover:bg-green-50 disabled:opacity-60"
          >
            <Reply size={16} /> Trả lời
          </button>
        </div>
      </div>

      {(review.replies || []).length > 0 && (
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
          <ProgressiveList items={review.replies || []} initialCount={1} step={3} moreLabel="Xem thêm trả lời" collapseLabel="Đóng bớt" renderItem={(reply) => (
            <div key={reply.id} className="rounded-xl bg-green-50 px-4 py-3">
              <p className="text-xs font-extrabold text-green-800">
                {reply.user?.name || "Người bán"} · {reply.created_at}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-slate-700">
                {reply.comment}
              </p>
            </div>
          )} />
        </div>
      )}
    </div>
  );
}

function PaginationControls({ meta, onPageChange }) {
  if (!meta || Number(meta.last_page || 1) <= 1) return null;

  const currentPage = Number(meta.current_page || 1);
  const lastPage = Number(meta.last_page || 1);

  return (
    <div className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-center text-sm font-semibold text-slate-500 sm:text-left">
        Hiển thị {meta.from || 0} - {meta.to || 0} / {meta.total || 0}
      </p>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Trước
        </button>

        <span className="rounded-xl bg-green-50 px-4 py-2 text-sm font-bold text-green-700">
          {currentPage} / {lastPage}
        </span>

        <button
          type="button"
          disabled={currentPage >= lastPage}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sau
        </button>
      </div>
    </div>
  );
}

function SellerReviewSkeletonList() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <SellerReviewSkeleton key={index} />
      ))}
    </div>
  );
}

function SellerReviewSkeleton() {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-green-100 p-4 shadow-sm">
      <div className="grid animate-pulse grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-w-0 flex-col gap-4 min-[400px]:flex-row">
          <div className="h-20 w-20 rounded-2xl bg-green-100" />

          <div className="min-w-0 flex-1">
            <div className="h-5 w-full max-w-56 rounded-lg bg-slate-200" />
            <div className="mt-3 h-4 w-full max-w-40 rounded-lg bg-slate-200" />

            <div className="mt-3 flex gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-4 w-4 rounded-full bg-slate-200"
                />
              ))}
            </div>

            <div className="mt-4 h-4 w-full max-w-72 rounded-lg bg-slate-200" />
          </div>
        </div>

        <div>
          <div className="h-7 w-20 rounded-full bg-slate-200" />
          <div className="mt-3 h-10 w-28 rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
