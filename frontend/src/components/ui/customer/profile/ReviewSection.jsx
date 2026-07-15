// src/components/ui/customer/profile/ReviewSection.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Edit,
  Loader2,
  MessageSquare,
  PackageCheck,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";
import reviewService from "../../../../services/reviewService";
import { confirmAction } from "../../../../utils/actionDialog";

const EMPTY_FORM = {
  order_item_id: "",
  rating: 5,
  comment: "",
};

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

export default function ReviewSection() {
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

  const openCreateModal = (item) => {
    setEditingReview(null);
    setSelectedItem(item);

    setForm({
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
        const payload = await reviewService.updateReview(editingReview.id, {
          rating: Number(form.rating),
          comment: form.comment,
        });

        toast.success(payload?.message || "Cập nhật đánh giá thành công");
      } else {
        const payload = await reviewService.createReview({
          order_item_id: form.order_item_id,
          rating: Number(form.rating),
          comment: form.comment,
        });

        toast.success(payload?.message || "Đánh giá sản phẩm thành công");
      }

      closeModal();
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
    if (!await confirmAction({ title: "Xóa đánh giá", description: "Đánh giá sẽ không còn hiển thị công khai.", confirmLabel: "Xóa đánh giá", danger: true })) return;

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
              Đánh giá của tôi
            </h2>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Quản lý đánh giá sản phẩm sau khi đơn hàng hoàn thành.
            </p>
          </div>

          <div className="rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-700">
            {reviews.length} đánh giá
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
  const navigate = useNavigate();

  const product = item.product;
  const image = getImage(product);

  const goToProduct = () => {
    if (!product?.id) return;
    navigate(`/products/${product.slug || product.id}`);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-green-100 p-4">
      <button
        type="button"
        onClick={goToProduct}
        className="flex min-w-0 items-center gap-4 text-left"
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
          <h4 className="font-bold text-slate-950 hover:text-green-700">
            {product?.name || "Sản phẩm"}
          </h4>

          <p className="mt-1 text-sm font-medium text-slate-500">
            {product?.farm?.name || "Organic Farm"}
          </p>

          <p className="mt-1 text-xs font-bold text-slate-400">
            Số lượng: {item.quantity} {product?.unit || ""}
          </p>
        </div>
      </button>

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

function MyReviewsSection({ reviews, actionLoadingId, onEdit, onDelete }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare size={19} className="text-green-700" />

        <h3 className="font-bold text-slate-950">Đánh giá đã viết</h3>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
          {reviews.length}
        </span>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-green-200 bg-green-50 p-6 text-center">
          <MessageSquare size={36} className="mx-auto text-green-700" />

          <p className="mt-3 font-bold text-slate-900">
            Bạn chưa có đánh giá nào
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Hãy đánh giá sản phẩm sau khi đơn hàng hoàn thành.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              actionLoadingId={actionLoadingId}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ReviewCard({ review, actionLoadingId, onEdit, onDelete }) {
  const navigate = useNavigate();

  const product = review.product;
  const image = getImage(product);

  const deleting = actionLoadingId === `delete-${review.id}`;

  const goToProduct = () => {
    if (!product?.id) return;
    navigate(`/products/${product.slug || product.id}`);
  };

  return (
    <div className="rounded-2xl border border-green-100 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <button
          type="button"
          onClick={goToProduct}
          className="flex min-w-0 gap-4 text-left"
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
            <h4 className="font-bold text-slate-950 hover:text-green-700">
              {product?.name || "Sản phẩm"}
            </h4>

            <p className="mt-1 text-sm font-medium text-slate-500">
              {product?.farm?.name || "Organic Farm"}
            </p>

            <div className="mt-2 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  size={15}
                  className={
                    index < Number(review.rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-300"
                  }
                />
              ))}

              <span className="ml-2 text-xs font-bold text-slate-400">
                {review.created_at}
              </span>
            </div>

            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
              {review.comment || "Bạn chưa nhập nội dung đánh giá."}
            </p>
          </div>
        </button>

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
      </div>
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

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-xl font-bold text-slate-950">
            {editingReview ? "Cập nhật đánh giá" : "Đánh giá sản phẩm"}
          </h3>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-slate-100 disabled:opacity-60"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6">
          {product && (
            <div className="mb-5 rounded-2xl bg-green-50 p-4">
              <p className="font-bold text-slate-950">{product.name}</p>

              <p className="mt-1 text-sm font-medium text-slate-500">
                {product.farm?.name || "Organic Farm"}
              </p>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-800">
              Số sao đánh giá
            </label>

            <StarRating
              value={Number(form.rating)}
              onChange={(value) => onChange("rating", value)}
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-bold text-slate-800">
              Nội dung đánh giá
            </label>

            <textarea
              value={form.comment}
              onChange={(e) => onChange("comment", e.target.value)}
              placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
              rows={5}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium outline-none transition focus:border-green-600"
            />
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
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {editingReview ? "Cập nhật" : "Gửi đánh giá"}
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
