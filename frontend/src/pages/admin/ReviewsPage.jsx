import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Eye,
  EyeOff,
  Loader2,
  MessageSquareText,
  Plus,
  RotateCcw,
  Reply,
  Search,
  Star,
  Trash2,
} from "lucide-react";

import adminReviewService from "../../services/adminReviewService";
import adminProductService from "../../services/adminProductService";
import ResponsiveSelect from "../../components/common/ResponsiveSelect";
import { requestReason } from "../../utils/actionDialog";

const initialFilters = {
  keyword: "",
  status: "",
  rating: "",
  deleted: "",
  page: 1,
  per_page: 10,
};

function firstError(error, fallback) {
  return (
    Object.values(error?.errors || {})[0]?.[0] ||
    error?.message ||
    fallback
  );
}

export default function ReviewsPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [payload, setPayload] = useState({
    reviews: [],
    stats: {},
    pagination: {},
  });
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyComment, setReplyComment] = useState("");
  const [replyError, setReplyError] = useState("");
  const [commentModalOpen, setCommentModalOpen] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);

    try {
      const response = await adminReviewService.getReviews(filters);
      setPayload(response?.data || {});
    } catch (error) {
      toast.error(firstError(error, "Không thể tải danh sách đánh giá."));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const changeFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value, page: 1 }));
  };

  const toggleStatus = async (review) => {
    const status = Number(review.status) === 1 ? 0 : 1;
    const reason = status === 0 ? await requestReason({ title: "Ẩn đánh giá", description: "Người dùng sẽ thấy lý do và thông tin kiểm duyệt.", placeholder: "Nhập lý do ẩn đánh giá...", confirmLabel: "Ẩn đánh giá" }) : null;

    if (status === 0 && !reason?.trim()) return;

    setActionId(review.id);

    try {
      const response = await adminReviewService.updateStatus(
        review.id,
        status,
        reason?.trim() || null,
      );
      toast.success(response?.message || "Đã cập nhật đánh giá.");
      await loadReviews();
    } catch (error) {
      toast.error(firstError(error, "Không thể cập nhật đánh giá."));
    } finally {
      setActionId(null);
    }
  };

  const deleteReview = async (review) => {
    const reason = await requestReason({ title: "Xóa đánh giá", description: "Đánh giá được xóa mềm và vẫn có thể khôi phục.", placeholder: "Nhập lý do xóa đánh giá...", confirmLabel: "Xóa đánh giá" });
    if (!reason) return;

    setActionId(review.id);

    try {
      const response = await adminReviewService.deleteReview(
        review.id,
        reason.trim(),
      );
      toast.success(response?.message || "Đã xóa đánh giá.");
      await loadReviews();
    } catch (error) {
      toast.error(firstError(error, "Không thể xóa đánh giá."));
    } finally {
      setActionId(null);
    }
  };

  const restoreReview = async (review) => {
    setActionId(review.id);

    try {
      const response = await adminReviewService.restoreReview(review.id);
      toast.success(response?.message || "Đã khôi phục đánh giá.");
      await loadReviews();
    } catch (error) {
      toast.error(firstError(error, "Không thể khôi phục đánh giá."));
    } finally {
      setActionId(null);
    }
  };

  const replyReview = (review) => {
    setReplyTarget(review);
    setReplyComment("");
    setReplyError("");
  };

  const submitReply = async () => {
    if (!replyTarget || !replyComment.trim()) {
      setReplyError("Vui lòng nhập nội dung trả lời.");
      return;
    }

    setActionId(replyTarget.id);

    try {
      const response = await adminReviewService.reply(replyTarget.id, replyComment.trim());
      toast.success(response?.message || "Đã trả lời đánh giá.");
      setReplyTarget(null);
      await loadReviews();
    } catch (error) {
      setReplyError(firstError(error, "Không thể trả lời đánh giá."));
    } finally {
      setActionId(null);
    }
  };

  const stats = payload.stats || {};
  const pagination = payload.pagination || {};

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-950">
            Kiểm duyệt đánh giá
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Ẩn, hiện, xóa hoặc khôi phục đánh giá; mọi thao tác ẩn/xóa đều lưu
            người thực hiện, thời gian và lý do.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCommentModalOpen(true)}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-black text-white hover:bg-red-700"
        >
          <Plus size={18} /> Bình luận sản phẩm
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Tổng đánh giá" value={stats.total} />
        <Stat label="Đang hiển thị" value={stats.visible} tone="green" />
        <Stat label="Đang ẩn" value={stats.hidden} tone="orange" />
        <Stat label="Đã xóa" value={stats.deleted} tone="red" />
        <Stat label="Điểm trung bình" value={`${stats.average_rating || 0}/5`} />
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-6">
        <label className="relative md:col-span-2">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={filters.keyword}
            onChange={(event) => changeFilter("keyword", event.target.value)}
            placeholder="Tìm người mua, sản phẩm, nội dung..."
            className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm font-semibold outline-none focus:border-red-400"
          />
        </label>

        <FilterSelect
          value={filters.status}
          onChange={(value) => changeFilter("status", value)}
          options={[
            ["", "Mọi trạng thái"],
            ["1", "Đang hiển thị"],
            ["0", "Đang ẩn"],
          ]}
        />
        <button
          type="button"
          onClick={() => setFilters({ ...initialFilters })}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw size={16} /> Xóa bộ lọc
        </button>
        <FilterSelect
          value={filters.rating}
          onChange={(value) => changeFilter("rating", value)}
          options={[
            ["", "Mọi số sao"],
            ...[5, 4, 3, 2, 1].map((value) => [String(value), `${value} sao`]),
          ]}
        />
        <FilterSelect
          value={filters.deleted}
          onChange={(value) => changeFilter("deleted", value)}
          options={[
            ["", "Chưa xóa"],
            ["with", "Gồm đã xóa"],
            ["only", "Chỉ đã xóa"],
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {loading ? (
          <ReviewSkeleton />
        ) : (payload.reviews || []).length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <MessageSquareText size={40} className="mx-auto" />
            <p className="mt-3 font-bold">Không có đánh giá phù hợp.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-275 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Người đánh giá</th>
                  <th className="px-4 py-3">Sản phẩm</th>
                  <th className="px-4 py-3">Nội dung</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Kiểm duyệt gần nhất</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {(payload.reviews || []).map((review) => (
                  <tr key={review.id} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-4">
                      <p className="font-extrabold text-slate-800">
                        {review.buyer?.name || "Tài khoản đã xóa"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {review.buyer?.email}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      {review.product?.slug ? (
                        <Link
                          to={`/products/${review.product.slug}`}
                          className="block max-w-52 font-bold text-slate-700 hover:text-green-700 hover:underline"
                        >
                          {review.product.name}
                        </Link>
                      ) : (
                        <p className="max-w-52 font-bold text-slate-700">Sản phẩm không còn hiển thị</p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        {review.product?.farm_name}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            size={14}
                            fill={index < review.rating ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                      <p className="mt-2 max-w-88 whitespace-pre-wrap font-medium text-slate-600">
                        {review.comment || "Không có nội dung."}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {review.created_at}
                      </p>
                      {(review.replies || []).map((reply) => (
                        <div
                          key={reply.id}
                          className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-xs"
                        >
                          <p className="font-extrabold text-green-800">
                            {reply.user?.name || "Quản trị viên"} ·{" "}
                            {reply.created_at}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-slate-700">
                            {reply.comment}
                          </p>
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${
                          review.deleted_at
                            ? "bg-red-50 text-red-700"
                            : Number(review.status) === 1
                              ? "bg-green-50 text-green-700"
                              : "bg-orange-50 text-orange-700"
                        }`}
                      >
                        {review.deleted_at ? "Đã xóa" : review.status_text}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-slate-500">
                      <p>{review.moderated_by?.name || "—"}</p>
                      <p>{review.moderated_at || ""}</p>
                      {review.moderation_reason && (
                        <p className="mt-1 max-w-56 text-red-600">
                          {review.moderation_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        {actionId === review.id ? (
                          <Loader2 size={18} className="animate-spin text-slate-400" />
                        ) : review.deleted_at ? (
                          <ActionButton
                            label="Khôi phục"
                            icon={RotateCcw}
                            onClick={() => restoreReview(review)}
                          />
                        ) : (
                          <>
                            <ActionButton
                              label={Number(review.status) === 1 ? "Ẩn" : "Hiện"}
                              icon={Number(review.status) === 1 ? EyeOff : Eye}
                              onClick={() => toggleStatus(review)}
                            />
                            <ActionButton
                              label="Trả lời"
                              icon={Reply}
                              onClick={() => replyReview(review)}
                            />
                            <ActionButton
                              label="Xóa"
                              icon={Trash2}
                              danger
                              onClick={() => deleteReview(review)}
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
        <span>{pagination.total || 0} đánh giá</span>
        <div className="flex gap-2">
          <button
            disabled={loading || Number(pagination.current_page) <= 1}
            onClick={() =>
              setFilters((current) => ({ ...current, page: current.page - 1 }))
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 disabled:opacity-40"
          >
            Trước
          </button>
          <button
            disabled={
              loading ||
              Number(pagination.current_page) >= Number(pagination.last_page)
            }
            onClick={() =>
              setFilters((current) => ({ ...current, page: current.page + 1 }))
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      </div>

      {replyTarget && (
        <AdminReplyModal
          review={replyTarget}
          comment={replyComment}
          error={replyError}
          loading={actionId === replyTarget.id}
          onChange={(value) => { setReplyComment(value); setReplyError(""); }}
          onClose={() => { if (!actionId) setReplyTarget(null); }}
          onSubmit={submitReply}
        />
      )}
      {commentModalOpen && (
        <AdminProductCommentModal
          onClose={() => setCommentModalOpen(false)}
          onCreated={async () => {
            setCommentModalOpen(false);
            await loadReviews();
          }}
        />
      )}
    </div>
  );
}

function AdminProductCommentModal({ onClose, onCreated }) {
  const [keyword, setKeyword] = useState("");
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoadingProducts(true);
      try {
        const response = await adminProductService.getAll({
          keyword: keyword.trim(), page: 1, limit: 8, deleted: "0",
        });
        if (active) setProducts(response?.data || []);
      } catch (requestError) {
        if (active) setError(firstError(requestError, "Không thể tìm sản phẩm."));
      } finally {
        if (active) setLoadingProducts(false);
      }
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [keyword]);

  const submit = async () => {
    if (!selected) return setError("Vui lòng chọn một sản phẩm.");
    if (!comment.trim()) return setError("Vui lòng nhập nội dung bình luận.");
    setSaving(true); setError("");
    try {
      const response = await adminReviewService.createProductComment(selected.id, comment.trim());
      toast.success(response?.message || "Đã đăng bình luận quản trị.");
      await onCreated();
    } catch (requestError) {
      setError(firstError(requestError, "Không thể đăng bình luận quản trị."));
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-70 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <button type="button" aria-label="Đóng" onClick={onClose} className="absolute inset-0" />
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
        <h2 className="text-xl font-black text-slate-950">Bình luận sản phẩm</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">Tìm bằng tên, mã hoặc ID. Bình luận không được tính vào điểm và tổng số đánh giá.</p>
        <label className="relative mt-4 block"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input autoFocus value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Nhập tên, mã hoặc ID sản phẩm..." className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-red-400" /></label>
        <div className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-2xl border border-slate-100 p-2">
          {loadingProducts ? <div className="flex justify-center p-6"><Loader2 className="animate-spin text-slate-400" /></div> : products.length ? products.map((product) => (
            <button type="button" key={product.id} onClick={() => { setSelected(product); setError(""); }} className={`w-full rounded-xl border p-3 text-left ${selected?.id === product.id ? "border-red-400 bg-red-50" : "border-transparent bg-slate-50 hover:border-slate-200"}`}>
              <p className="font-extrabold text-slate-800">{product.name}</p><p className="mt-1 text-xs font-semibold text-slate-500">{product.code || "Không có mã"} · ID #{product.id} · {product.farm?.name || "Chưa có nông trại"}</p>
            </button>
          )) : <p className="p-6 text-center text-sm font-semibold text-slate-400">Không tìm thấy sản phẩm.</p>}
        </div>
        <textarea rows={4} maxLength={2000} value={comment} onChange={(event) => { setComment(event.target.value); setError(""); }} placeholder="Nhập bình luận công khai..." className="mt-4 w-full rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100" />
        <div className="mt-1 flex justify-between text-xs font-semibold"><span className="text-red-600">{error}</span><span className="text-slate-400">{comment.length}/2000</span></div>
        <div className="mt-5 flex justify-end gap-3"><button type="button" disabled={saving} onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold">Hủy</button><button type="button" disabled={saving || !selected || !comment.trim()} onClick={submit} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving && <Loader2 size={16} className="animate-spin" />}{saving ? "Đang đăng" : "Đăng bình luận"}</button></div>
      </div>
    </div>
  );
}

function AdminReplyModal({ review, comment, error, loading, onChange, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-70 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <button type="button" aria-label="Đóng" onClick={onClose} className="absolute inset-0" />
      <div className="relative w-full max-w-xl rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
        <h2 className="text-xl font-black text-slate-950">Admin trả lời đánh giá</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">Phản hồi được hiển thị công khai nhưng không tính vào điểm và số lượng đánh giá.</p>
        <div className="mt-4 rounded-2xl bg-slate-50 p-4"><p className="font-extrabold text-slate-800">{review.buyer?.name || "Khách hàng"} · {review.product?.name || "Sản phẩm"}</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{review.comment || "Không có nội dung."}</p></div>
        <textarea autoFocus rows={5} maxLength={2000} value={comment} onChange={(event) => onChange(event.target.value)} placeholder="Nhập phản hồi của quản trị viên..." className="mt-4 w-full rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100" />
        <div className="mt-1 flex justify-between text-xs font-semibold"><span className="text-red-600">{error}</span><span className="text-slate-400">{comment.length}/2000</span></div>
        <div className="mt-5 flex justify-end gap-3"><button type="button" disabled={loading} onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold">Hủy</button><button type="button" disabled={loading || !comment.trim()} onClick={onSubmit} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{loading && <Loader2 size={16} className="animate-spin" />}{loading ? "Đang gửi" : "Gửi trả lời"}</button></div>
      </div>
    </div>
  );
}

function Stat({ label, value = 0, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-50 text-slate-700",
    green: "bg-green-50 text-green-700",
    orange: "bg-orange-50 text-orange-700",
    red: "bg-red-50 text-red-700",
  };

  return (
    <div className={`rounded-2xl p-4 ${tones[tone]}`}>
      <p className="text-xs font-bold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-2xl font-black">{value || 0}</p>
    </div>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <ResponsiveSelect
      value={value}
      onChange={onChange}
      options={options.map(([optionValue, label]) => ({
        value: optionValue,
        label,
      }))}
    />
  );
}

function ActionButton({ label, icon: Icon, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`inline-flex h-9 items-center gap-1 rounded-lg border px-3 text-xs font-extrabold ${
        danger
          ? "border-red-100 bg-red-50 text-red-700"
          : "border-slate-200 bg-white text-slate-700"
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function ReviewSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}
