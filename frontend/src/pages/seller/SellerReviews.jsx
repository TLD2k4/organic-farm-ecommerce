import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Eye,
  EyeOff,
  Filter,
  Loader2,
  MessageSquare,
  Search,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import sellerReviewService from "../../services/sellerReviewService";

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
  visible_reviews: 0,
  hidden_reviews: 0,
  avg_rating: 0,
  rating_counts: {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  },
};

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
    rating: "",
    status: "",
  });

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadReviews = async (nextPage = page) => {
    try {
      setLoading(true);

      const payload = await sellerReviewService.getReviews({
        ...filters,
        page: nextPage,
        limit: 5,
      });

      setReviews(payload?.data?.reviews || []);
      setStats(payload?.data?.stats || DEFAULT_STATS);
      setMeta(payload?.data?.meta || DEFAULT_META);
    } catch (error) {
      console.log("LOAD SELLER REVIEWS ERROR:", error);
      toast.error(
        error?.response?.data?.message || "Không thể tải đánh giá gian hàng"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews(page);
  }, [page]);

  const updateFilter = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmitFilter = (e) => {
    e.preventDefault();

    if (page === 1) {
      loadReviews(1);
    } else {
      setPage(1);
    }
  };

  const handleToggleStatus = async (review) => {
    const nextStatus = Number(review.status) === 1 ? 0 : 1;

    try {
      setActionLoadingId(review.id);

      const payload = await sellerReviewService.updateStatus(
        review.id,
        nextStatus
      );

      toast.success(
        payload?.message ||
          (nextStatus === 1
            ? "Đã hiển thị đánh giá"
            : "Đã ẩn đánh giá")
      );

      await loadReviews(page);
    } catch (error) {
      console.log("UPDATE REVIEW STATUS ERROR:", error);
      toast.error(
        error?.response?.data?.message ||
          "Không thể cập nhật trạng thái đánh giá"
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const goToProduct = (product) => {
    if (!product?.id) return;
    navigate(`/products/${product.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950">
            Đánh giá gian hàng
          </h1>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Theo dõi đánh giá của khách hàng dành cho sản phẩm trong nông trại.
          </p>
        </div>

        <div className="rounded-2xl bg-green-50 px-5 py-3 text-sm font-bold text-green-700">
          {stats.total_reviews} đánh giá
        </div>
      </div>

      <SellerReviewStats stats={stats} />

      <form
        onSubmit={handleSubmitFilter}
        className="rounded-2xl bg-white p-4 shadow-sm"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_160px_170px_auto]">
          <div className="relative">
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

          <select
            value={filters.rating}
            onChange={(e) => updateFilter("rating", e.target.value)}
            className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-green-600"
          >
            <option value="">Tất cả sao</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-green-600"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="1">Hiển thị</option>
            <option value="0">Đã ẩn</option>
          </select>

          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-green-700 px-5 text-sm font-bold text-white hover:bg-green-800"
          >
            <Filter size={18} />
            Lọc
          </button>
        </div>
      </form>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        {loading ? (
          <SellerReviewSkeletonList />
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-green-200 bg-green-50 p-8 text-center">
            <MessageSquare size={42} className="mx-auto text-green-700" />

            <p className="mt-3 font-bold text-slate-950">
              Chưa có đánh giá nào
            </p>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Khi khách hàng đánh giá sản phẩm, đánh giá sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {reviews.map((review) => (
                <SellerReviewCard
                  key={review.id}
                  review={review}
                  actionLoadingId={actionLoadingId}
                  onToggleStatus={handleToggleStatus}
                  onGoToProduct={goToProduct}
                />
              ))}
            </div>

            <PaginationControls meta={meta} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

function SellerReviewStats({ stats }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatCard
        label="Tổng đánh giá"
        value={stats.total_reviews}
        subText="Tất cả đánh giá"
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
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-400">{subText}</p>
    </div>
  );
}

function SellerReviewCard({
  review,
  actionLoadingId,
  onToggleStatus,
  onGoToProduct,
}) {
  const product = review.product;
  const buyer = review.buyer;
  const image = getImage(product);

  const updating = actionLoadingId === review.id;
  const visible = Number(review.status) === 1;

  return (
    <div className="rounded-2xl border border-green-100 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <button
          type="button"
          onClick={() => onGoToProduct(product)}
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
            <h3 className="font-bold text-slate-950 hover:text-green-700">
              {product?.name || "Sản phẩm"}
            </h3>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              Người mua: {buyer?.name || "Khách hàng"}
            </p>

            <div className="mt-2 flex items-center gap-1">
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

              <span className="ml-2 text-xs font-bold text-slate-400">
                {review.created_at}
              </span>
            </div>

            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
              {review.comment || "Khách hàng chưa nhập nội dung đánh giá."}
            </p>
          </div>
        </button>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
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
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 ${
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

            {visible ? "Ẩn đánh giá" : "Hiện đánh giá"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaginationControls({ meta, onPageChange }) {
  if (!meta || Number(meta.last_page || 1) <= 1) return null;

  const currentPage = Number(meta.current_page || 1);
  const lastPage = Number(meta.last_page || 1);

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-semibold text-slate-500">
        Hiển thị {meta.from || 0} - {meta.to || 0} / {meta.total || 0}
      </p>

      <div className="flex items-center gap-2">
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
    <div className="rounded-2xl border border-green-100 p-4 shadow-sm">
      <div className="flex animate-pulse flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="h-20 w-20 rounded-2xl bg-green-100" />

          <div>
            <div className="h-5 w-56 rounded-lg bg-slate-200" />
            <div className="mt-3 h-4 w-40 rounded-lg bg-slate-200" />

            <div className="mt-3 flex gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-4 w-4 rounded-full bg-slate-200" />
              ))}
            </div>

            <div className="mt-4 h-4 w-72 rounded-lg bg-slate-200" />
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