// src/components/ui/customer/profile/ReviewSection.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Edit,
  Loader2,
  MessageSquare,
  PackageCheck,
  Save,
  ShieldAlert,
  Star,
  Trash2,
  X,
} from "lucide-react";
import reviewService from "../../../../services/reviewService";
import { confirmAction } from "../../../../utils/actionDialog";
import {
  getPublicFarmPath,
  getPublicProductPath,
} from "../../../../utils/entityLink";
import ProgressiveList from "../../../common/ProgressiveList";

const EMPTY_FORM = {
  entry_type: "rating_review",
  order_item_id: "",
  rating: 5,
  comment: "",
};

function isRatingReview(review) {
  return review?.is_rating_review ?? (
    review?.order_item_id !== null && review?.rating !== null
  );
}

function getPayloadReviews(payload) {
  return payload?.data?.reviews || payload?.reviews || [];
}

function getPayloadItems(payload) {
  return payload?.data?.items || payload?.items || [];
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

export default function ReviewSection({ focusReviewId = null }) {
  const [reviews, setReviews] = useState([]);
  const [reviewableItems, setReviewableItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      const [reviewsPayload, itemsPayload] = await Promise.all([
        reviewService.getMyReviews(),
        reviewService.getReviewableItems(),
      ]);

      setReviews(getPayloadReviews(reviewsPayload));
      setReviewableItems(getPayloadItems(itemsPayload));
    } catch (error) {
      console.log("LOAD REVIEWS ERROR:", error);
      toast.error("Không thể tải dữ liệu đánh giá");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!focusReviewId || loading) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`my-review-${focusReviewId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [focusReviewId, loading, reviews.length]);

  const openCreateModal = (item) => {
    setEditingReview(null);
    setSelectedItem(item);

    setForm({
      entry_type: "rating_review",
      order_item_id: item.order_item_id || item.id,
      rating: 5,
      comment: "",
    });

    setModalOpen(true);
  };

  const openEditModal = (review) => {
    setEditingReview(review);
    setSelectedItem(null);

    setForm({
      entry_type: isRatingReview(review) ? "rating_review" : "buyer_comment",
      order_item_id: review.order_item_id,
      rating: review.rating || 5,
      comment: review.comment || "",
    });

    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;

    setModalOpen(false);
    setEditingReview(null);
    setSelectedItem(null);
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

    try {
      setSubmitting(true);

      if (editingReview) {
        const payload = await reviewService.updateReview(
          editingReview.id,
          form.entry_type === "buyer_comment"
            ? { comment: form.comment.trim() }
            : { rating: Number(form.rating), comment: form.comment },
        );

        toast.success(payload?.message || (form.entry_type === "buyer_comment"
          ? "Cập nhật bình luận thành công"
          : "Cập nhật đánh giá thành công"));
      } else {
        const payload = await reviewService.createReview({
          entry_type: "rating_review",
          order_item_id: form.order_item_id,
          rating: Number(form.rating),
          comment: form.comment,
        });

        toast.success(payload?.message || "Đánh giá sản phẩm thành công");
      }

      setModalOpen(false);
      setEditingReview(null);
      setSelectedItem(null);
      setForm(EMPTY_FORM);
      await loadData();
    } catch (error) {
      console.log("SAVE REVIEW ERROR:", error);

      const errors = error?.response?.data?.errors;

      if (errors) {
        const firstError = Object.values(errors)?.[0]?.[0];
        toast.error(firstError || "Dữ liệu đánh giá không hợp lệ");
      } else {
        toast.error(error?.response?.data?.message || "Không thể lưu đánh giá");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (review) => {
    const entryLabel = isRatingReview(review) ? "đánh giá" : "bình luận";
    if (!await confirmAction({ title: `Xóa ${entryLabel}`, description: `${entryLabel[0].toUpperCase()}${entryLabel.slice(1)} sẽ không còn hiển thị công khai.`, confirmLabel: `Xóa ${entryLabel}`, danger: true })) return;

    try {
      setActionLoadingId(`delete-${review.id}`);

      const payload = await reviewService.deleteReview(review.id);

      toast.success(payload?.message || "Xóa đánh giá thành công");
      await loadData();
    } catch (error) {
      console.log("DELETE REVIEW ERROR:", error);
      toast.error(error?.response?.data?.message || "Không thể xóa đánh giá");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Đánh giá & bình luận của tôi
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Quản lý nội dung bạn đã đăng sau khi đơn hàng hoàn thành.
            </p>
          </div>

          <div className="rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-700">
            {reviews.length} nội dung
          </div>
        </div>

        {loading ? (
          <ReviewSkeletonList />
        ) : (
          <div className="space-y-6">
            <ReviewableItemsSection
              items={reviewableItems}
              onReview={openCreateModal}
            />

            <MyReviewsSection
              reviews={reviews}
              actionLoadingId={actionLoadingId}
              onEdit={openEditModal}
              onDelete={handleDelete}
              focusReviewId={focusReviewId}
            />
          </div>
        )}
      </div>

      {modalOpen && (
        <ReviewModal
          form={form}
          editingReview={editingReview}
          selectedItem={selectedItem}
          submitting={submitting}
          onClose={closeModal}
          onChange={updateForm}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}

function ReviewableItemsSection({ items, onReview }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <PackageCheck size={19} className="text-green-700" />

        <h3 className="font-bold text-slate-950">Sản phẩm chờ đánh giá</h3>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-green-200 bg-green-50 p-6 text-center">
          <PackageCheck size={36} className="mx-auto text-green-700" />

          <p className="mt-3 font-bold text-slate-900">
            Không có sản phẩm chờ đánh giá
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Sản phẩm sẽ xuất hiện tại đây sau khi đơn hàng hoàn thành.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <ReviewableItemCard
              key={item.id}
              item={item}
              onReview={onReview}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ReviewableItemCard({ item, onReview }) {
  const product = item.product;
  const image = getImage(product);
  const productPath = getPublicProductPath(product);
  const farmPath = getPublicFarmPath(product?.farm);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-green-100 p-4">
      <div className="flex min-w-0 items-center gap-4 text-left">
        {productPath ? (
          <Link to={productPath} className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-green-50">
            {image ? (
              <img src={image} alt={product?.name || "Sản phẩm"} className="h-full w-full object-contain p-2 transition hover:scale-105" />
            ) : (
              <MessageSquare size={28} className="text-green-700" />
            )}
          </Link>
        ) : (
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-green-50">
            {image ? (
              <img src={image} alt={product?.name || "Sản phẩm"} className="h-full w-full object-contain p-2" />
            ) : (
              <MessageSquare size={28} className="text-green-700" />
            )}
          </div>
        )}

        <div className="min-w-0">
          {productPath ? (
            <Link to={productPath} className="font-bold text-slate-950 hover:text-green-700 hover:underline">
              {product?.name || "Sản phẩm"}
            </Link>
          ) : (
            <h4 className="font-bold text-slate-950">{product?.name || "Sản phẩm"}</h4>
          )}

          {farmPath ? (
            <Link to={farmPath} className="mt-1 block text-sm font-medium text-slate-500 hover:text-green-700 hover:underline">
              {product?.farm?.name || "Organic Farm"}
            </Link>
          ) : (
            <p className="mt-1 text-sm font-medium text-slate-500">{product?.farm?.name || "Organic Farm"}</p>
          )}

          <p className="mt-1 text-xs font-bold text-slate-400">
            Số lượng: {item.quantity} {product?.unit || ""}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onReview(item)}
        className="rounded-xl bg-green-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-800"
      >
        Đánh giá ngay
      </button>
    </div>
  );
}

function MyReviewsSection({ reviews, actionLoadingId, onEdit, onDelete, focusReviewId }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare size={19} className="text-green-700" />

        <h3 className="font-bold text-slate-950">Đánh giá & bình luận đã viết</h3>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
          {reviews.length}
        </span>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-green-200 bg-green-50 p-6 text-center">
          <MessageSquare size={36} className="mx-auto text-green-700" />

          <p className="mt-3 font-bold text-slate-900">
            Bạn chưa có đánh giá hoặc bình luận nào
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Sau khi nhận hàng, bạn có thể chọn chấm sao hoặc chỉ bình luận sản phẩm.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          <ProgressiveList items={reviews} initialCount={3} step={3} moreLabel="Xem thêm nội dung" collapseLabel="Đóng bớt" ensureVisibleItemId={focusReviewId} renderItem={(review) => (
            <ReviewCard
              key={review.id}
              review={review}
              actionLoadingId={actionLoadingId}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )} />
        </div>
      )}
    </section>
  );
}

function ReviewCard({ review, actionLoadingId, onEdit, onDelete }) {
  const product = review.product;
  const image = getImage(product);
  const productPath = getPublicProductPath(product);
  const farmPath = getPublicFarmPath(product?.farm);

  const deleting = actionLoadingId === `delete-${review.id}`;
  const removed = Boolean(review.deleted_at);
  const hidden = !removed && Number(review.status) === 0;
  const ratingEntry = isRatingReview(review);

  return (
    <div id={`my-review-${review.id}`} className="scroll-mt-24 rounded-2xl border border-green-100 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4 text-left">
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
            {productPath ? (
              <Link to={productPath} className="font-bold text-slate-950 hover:text-green-700 hover:underline">
                {product?.name || "Sản phẩm"}
              </Link>
            ) : (
              <h4 className="font-bold text-slate-950">{product?.name || "Sản phẩm"}</h4>
            )}

            {farmPath ? (
              <Link to={farmPath} className="mt-1 block text-sm font-medium text-slate-500 hover:text-green-700 hover:underline">
                {product?.farm?.name || "Organic Farm"}
              </Link>
            ) : (
              <p className="mt-1 text-sm font-medium text-slate-500">{product?.farm?.name || "Organic Farm"}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-1">
              {ratingEntry ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    size={15}
                    className={
                      index < Number(review.rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300"
                    }
                  />
                ))
              ) : (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">
                  {review.entry_type_label || "Bình luận người mua"}
                </span>
              )}

              <span className="ml-2 text-xs font-bold text-slate-400">
                {review.created_at}
              </span>
            </div>

            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
              {review.comment || (ratingEntry ? "Bạn chưa nhập nội dung đánh giá." : "")}
            </p>
          </div>
        </div>

        {removed ? (
          <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-black text-red-700">
            Đã bị xóa
          </span>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={deleting}
              onClick={() => onEdit(review)}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Edit size={15} />
              Sửa
            </button>

            <button
              type="button"
              disabled={deleting}
              onClick={() => onDelete(review)}
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
        )}
      </div>

      {(hidden || removed) && (
        <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900">
          <p className="flex items-center gap-2 font-black">
            <ShieldAlert size={17} /> {review.status_label || (removed ? "Đã bị xóa" : "Đã bị ẩn")}
          </p>
          {review.deleted_by_owner ? (
            <p className="mt-1 font-semibold">
              Bạn đã xóa {ratingEntry ? "đánh giá" : "bình luận"} này{review.deleted_at ? ` lúc ${review.deleted_at}` : ""}.
            </p>
          ) : (
            <p className="mt-1 font-semibold">
              Thao tác bởi {review.moderated_by?.name || "Quản trị hệ thống"}
              {review.moderated_at ? ` lúc ${review.moderated_at}` : ""}.
            </p>
          )}
          {review.moderation_reason && (
            <p className="mt-1 whitespace-pre-wrap">Lý do: {review.moderation_reason}</p>
          )}
        </div>
      )}

      {(review.replies || []).length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="mb-2 text-sm font-black text-slate-700">Phản hồi từ gian hàng/quản trị</p>
          <ProgressiveList
            items={review.replies || []}
            initialCount={1}
            step={3}
            moreLabel="Xem thêm phản hồi"
            collapseLabel="Đóng bớt"
            renderItem={(reply) => (
              <div key={reply.id} className="mt-2 rounded-xl border-l-4 border-green-500 bg-green-50 px-4 py-3">
                <p className="text-xs font-black text-green-800">
                  {reply.user?.name || "Organic Farm"} · {reply.created_at}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-slate-700">
                  {reply.comment}
                </p>
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}

function ReviewModal({
  form,
  editingReview,
  selectedItem,
  submitting,
  onClose,
  onChange,
  onSubmit,
}) {
  const product = editingReview?.product || selectedItem?.product;
  const isComment = form.entry_type === "buyer_comment";

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-xl font-bold text-slate-950">
            {editingReview
              ? (isComment ? "Cập nhật bình luận" : "Cập nhật đánh giá")
              : "Đánh giá sản phẩm"}
          </h3>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Đóng biểu mẫu đánh giá"
            title="Đóng biểu mẫu đánh giá"
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100 disabled:opacity-60"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6">
          {product && (
            <div className="mb-5 rounded-2xl bg-green-50 p-4">
              {getPublicProductPath(product) ? (
                <Link to={getPublicProductPath(product)} className="font-bold text-slate-950 hover:text-green-700 hover:underline">
                  {product.name}
                </Link>
              ) : (
                <p className="font-bold text-slate-950">{product.name}</p>
              )}

              {getPublicFarmPath(product.farm) ? (
                <Link to={getPublicFarmPath(product.farm)} className="mt-1 block text-sm font-medium text-slate-500 hover:text-green-700 hover:underline">
                  {product.farm?.name || "Organic Farm"}
                </Link>
              ) : (
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {product.farm?.name || "Organic Farm"}
                </p>
              )}
            </div>
          )}

          {!isComment && (
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">
                Số sao đánh giá
              </label>

              <StarRating
                value={Number(form.rating)}
                onChange={(value) => onChange("rating", value)}
              />
            </div>
          )}

          <div className="mt-5">
            <label className="mb-2 block text-sm font-bold text-slate-800">
              {isComment ? "Nội dung bình luận" : "Nội dung đánh giá"}
            </label>

            <textarea
              value={form.comment}
              onChange={(e) => onChange("comment", e.target.value)}
              required={isComment}
              maxLength={1000}
              placeholder={isComment ? "Nhập bình luận về sản phẩm..." : "Chia sẻ cảm nhận của bạn về sản phẩm..."}
              rows={5}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none transition focus:border-green-600"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting || (isComment && !form.comment.trim())}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {editingReview ? "Cập nhật" : (isComment ? "Gửi bình luận" : "Gửi đánh giá")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StarRating({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;

        return (
          <button
            key={starValue}
            type="button"
            onClick={() => onChange(starValue)}
            aria-label={`Chọn ${starValue} sao`}
            title={`Chọn ${starValue} sao`}
            className="transition hover:scale-110"
          >
            <Star
              size={30}
              className={
                starValue <= value
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300"
              }
            />
          </button>
        );
      })}

      <span className="ml-3 text-sm font-bold text-slate-600">
        {value}/5 sao
      </span>
    </div>
  );
}

function ReviewSkeletonList() {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 h-5 w-44 animate-pulse rounded-lg bg-slate-200" />

        <ReviewCardSkeleton />
      </div>

      <div>
        <div className="mb-3 h-5 w-36 animate-pulse rounded-lg bg-slate-200" />

        <div className="grid gap-4">
          <ReviewCardSkeleton />
          <ReviewCardSkeleton />
        </div>
      </div>
    </div>
  );
}

function ReviewCardSkeleton() {
  return (
    <div className="rounded-2xl border border-green-100 p-4 shadow-sm">
      <div className="flex animate-pulse flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <div className="h-20 w-20 shrink-0 rounded-2xl bg-green-100" />

          <div className="min-w-0">
            <div className="h-5 w-48 rounded-lg bg-slate-200" />

            <div className="mt-3 h-4 w-32 rounded-lg bg-slate-200" />

            <div className="mt-3 flex gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-4 w-4 rounded-full bg-slate-200"
                />
              ))}
            </div>

            <div className="mt-4 h-4 w-72 rounded-lg bg-slate-200" />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="h-9 w-16 rounded-xl bg-slate-200" />
          <div className="h-9 w-16 rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
