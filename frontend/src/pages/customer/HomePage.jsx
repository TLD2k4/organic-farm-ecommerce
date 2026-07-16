import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowRight,
  BadgePercent,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Leaf,
  MapPin,
  Package,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Truck,
} from "lucide-react";
import homeService from "../../services/homeService";
import { getImageUrl } from "../../utils/image";
import useAddToCart from "@/hooks/useAddToCart";

const emptyHomeData = {
  hero: null,
  categories: [],
  featured_products: [],
  best_selling_products: [],
  new_products: [],
  sale_products: [],
  featured_farms: [],
  stats: null,
};

const carouselItemClass = `
  min-w-[calc((100%_-_0.75rem)/2)]
  snap-start
  sm:min-w-[calc((100%_-_1.5rem)/3)]
  md:min-w-[calc((100%_-_2.25rem)/4)]
  lg:min-w-[calc((100%_-_3rem)/5)]
  xl:min-w-[calc((100%_-_3.75rem)/6)]
`;

const farmCarouselItemClass = `
  min-w-[calc((100%_-_0.75rem)/2)]
  snap-start
  md:min-w-[calc((100%_-_1.5rem)/3)]
  lg:min-w-[calc((100%_-_2.25rem)/4)]
  xl:min-w-[calc((100%_-_3rem)/5)]
`;

const productTabs = [
  {
    key: "best_selling",
    label: "Bán chạy",
    sort: "best_selling",
    title: "Xem các sản phẩm bán chạy",
  },
  {
    key: "featured",
    label: "Nổi bật",
    sort: "featured",
    title: "Xem các sản phẩm nổi bật",
  },
  {
    key: "sale",
    label: "Khuyến mãi",
    sort: "sale",
    title: "Xem các sản phẩm đang khuyến mãi",
  },
  {
    key: "latest",
    label: "Mới nhất",
    sort: "latest",
    title: "Xem các sản phẩm mới nhất",
  },
];

function getHomePayload(response) {
  return response?.data?.data || response?.data || response || emptyHomeData;
}

function getImage(item) {
  return (
    item?.thumbnail_url ||
    item?.thumbnail ||
    item?.image_url ||
    item?.image ||
    ""
  );
}

function getFarmRating(farm) {
  const rawAverage =
    typeof farm?.rating === "object"
      ? farm?.rating?.average
      : (farm?.rating ?? farm?.rating_avg ?? farm?.average_rating);

  const rawTotal =
    typeof farm?.rating === "object"
      ? farm?.rating?.total
      : (farm?.review_count ?? farm?.reviews_count);

  const average = Number(rawAverage ?? 0);
  const total = Number(rawTotal ?? 0);

  return {
    average: Number.isFinite(average) ? average : 0,
    total: Number.isFinite(total) ? total : 0,
  };
}

function getProductRating(product) {
  const rawAverage =
    typeof product?.rating === "object"
      ? product?.rating?.average
      : (product?.rating ?? product?.rating_avg ?? product?.average_rating);

  const rawTotal =
    typeof product?.rating === "object"
      ? product?.rating?.total
      : (product?.review_count ?? product?.reviews_count);

  const average = Number(rawAverage ?? 0);
  const total = Number(rawTotal ?? 0);

  return {
    average: Number.isFinite(average) ? average : 0,
    total: Number.isFinite(total) ? total : 0,
  };
}

function getDiscountPercent(product) {
  const existingPercent = Number(product?.discount_percent ?? 0);

  if (existingPercent > 0) {
    return Math.round(existingPercent);
  }

  const price = Number(product?.price ?? 0);
  const salePrice = Number(product?.sale_price ?? 0);

  if (price <= 0 || salePrice <= 0 || salePrice >= price) {
    return 0;
  }

  return Math.round(((price - salePrice) / price) * 100);
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return Number(value).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
}

function formatSoldQuantity(product) {
  const quantity = Number(product?.sold_quantity ?? product?.sold_count ?? 0);

  const unit = product?.unit || "";

  if (!quantity) {
    return "Chưa bán";
  }

  const displayQuantity = Number.isInteger(quantity)
    ? quantity
    : quantity.toFixed(1).replace(".0", "");

  return `Đã bán ${displayQuantity}${unit ? ` ${unit}` : ""}`;
}

export default function HomePage() {
  const [homeData, setHomeData] = useState(emptyHomeData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchHome = async () => {
      try {
        setLoading(true);

        const response = await homeService.getHome({
          category_limit: 12,
          product_limit: 12,
          farm_limit: 10,
        });

        if (cancelled) {
          return;
        }

        const data = getHomePayload(response);

        setHomeData({
          ...emptyHomeData,
          ...data,
        });
      } catch (error) {
        if (!cancelled) {
          console.log("FETCH HOME ERROR:", error);
          toast.error("Không thể tải dữ liệu trang chủ");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchHome();

    return () => {
      cancelled = true;
    };
  }, []);

  const heroProducts = useMemo(() => {
    if (homeData.featured_products?.length) {
      return homeData.featured_products;
    }

    return homeData.new_products || [];
  }, [homeData.featured_products, homeData.new_products]);

  const saleProducts = useMemo(
    () => homeData.sale_products || [],
    [homeData.sale_products],
  );

  if (loading) {
    return (
      <main
        title="Đang tải trang chủ Organic Farm"
        className="bg-[#f7fbf3] py-8"
      >
        <div className="container-main space-y-6">
          <div className="h-90 animate-pulse rounded-3xl bg-white shadow-sm" />
          <div className="h-36 animate-pulse rounded-2xl bg-white shadow-sm" />
          <div className="h-80 animate-pulse rounded-2xl bg-white shadow-sm" />
        </div>
      </main>
    );
  }

  return (
    <main
      title="Trang chủ Organic Farm"
      className="min-w-0 overflow-x-hidden bg-[#f7fbf3] pb-10"
    >
      <div className="container-main min-w-0 space-y-8 py-6">
        <HeroBanner hero={homeData.hero} products={heroProducts} />

        <ServiceStrip />

        <CategorySection categories={homeData.categories} />

        <ProductTabsSection homeData={homeData} />

        <SaleBanner />

        <ProductSection
          title="Ưu đãi hôm nay"
          description="Các sản phẩm đang có mức giá tốt trên Organic Farm."
          products={saleProducts}
          viewAllLink="/products?type=sale&sort=latest"
        />

        <FarmSection farms={homeData.featured_farms} />

        <AboutSection stats={homeData.stats} />
      </div>
    </main>
  );
}

function HeroBanner({ hero, products = [] }) {
  const firstProduct = products[0];
  const heroImage = getImage(firstProduct);
  const productName = firstProduct?.name || "Nông sản sạch";

  return (
    <section
      aria-label="Giới thiệu Organic Farm"
      title="Nông sản sạch cho cuộc sống xanh"
      className="overflow-hidden rounded-[28px] border border-green-100 bg-white shadow-sm"
    >
      <div className="grid min-h-90 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-center px-6 py-9 sm:px-8 lg:px-12">
          <div
            title="Thực phẩm hữu cơ"
            className="mb-5 flex w-fit items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-700"
          >
            <Leaf size={16} aria-hidden="true" />
            Thực phẩm hữu cơ
          </div>

          <h1
            title={hero?.title || "Nông sản sạch cho cuộc sống xanh"}
            className="max-w-xl text-4xl font-black leading-tight text-slate-950 lg:text-5xl"
          >
            {hero?.title || "Nông sản sạch cho cuộc sống xanh"}
          </h1>

          <p
            title={
              hero?.subtitle ||
              "Từ nông trại hữu cơ đến bàn ăn gia đình bạn, an toàn và minh bạch nguồn gốc."
            }
            className="mt-4 max-w-xl text-base font-medium leading-7 text-slate-600"
          >
            {hero?.subtitle ||
              "Từ nông trại hữu cơ đến bàn ăn gia đình bạn, an toàn và minh bạch nguồn gốc."}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/products"
              title="Mua sản phẩm nông sản sạch"
              aria-label="Đi đến danh sách sản phẩm"
              className="rounded-xl bg-green-700 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-green-800"
            >
              {hero?.primary_button || "Mua ngay"}
            </Link>

            <Link
              to="/farms"
              title="Khám phá các nông trại"
              aria-label="Đi đến danh sách nông trại"
              className="rounded-xl border border-green-200 bg-white px-6 py-3 text-sm font-black text-green-700 transition hover:bg-green-50"
            >
              {hero?.secondary_button || "Khám phá nông trại"}
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            {(hero?.badges || []).slice(0, 3).map((badge, index) => (
              <div
                key={`${badge.label}-${index}`}
                title={`${badge.label} ${badge.text}`}
                className="rounded-2xl border border-green-100 bg-[#f8fcf5] px-4 py-3"
              >
                <p className="text-lg font-black text-green-700">
                  {badge.label}
                </p>

                <p className="text-xs font-bold text-slate-500">{badge.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center bg-linear-to-br from-[#edf8e7] to-[#dcefcf] p-8">
          {heroImage ? (
            <Link
              to={
                firstProduct?.slug
                  ? `/products/${firstProduct.slug}`
                  : "/products"
              }
              title={`Xem chi tiết sản phẩm ${productName}`}
              aria-label={`Xem chi tiết sản phẩm ${productName}`}
              className="block w-full max-w-130"
            >
              <img
                src={heroImage}
                alt={`Ảnh sản phẩm ${productName}`}
                title={`Ảnh sản phẩm ${productName}`}
                className="h-75 w-full rounded-[26px] object-contain p-3 shadow-lg"
              />
            </Link>
          ) : (
            <div
              role="img"
              aria-label="Chưa có ảnh nông sản sạch"
              title="Chưa có ảnh nông sản sạch"
              className="grid h-75 w-full max-w-130 place-items-center rounded-[26px] bg-white text-center shadow-sm"
            >
              <div>
                <Leaf
                  className="mx-auto text-green-700"
                  size={60}
                  aria-hidden="true"
                />

                <p className="mt-3 text-xl font-black text-green-800">
                  Organic Farm
                </p>
              </div>
            </div>
          )}

          <div
            title="Cam kết nông sản hữu cơ"
            className="absolute right-7 top-7 rounded-full bg-white px-5 py-4 text-center shadow-md"
          >
            <p className="text-xl font-black text-green-700">100%</p>
            <p className="text-xs font-black text-red-500">HỮU CƠ</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServiceStrip() {
  const services = [
    {
      icon: Truck,
      title: "Giao hàng nhanh",
      description: "Giao tận nơi toàn quốc",
    },
    {
      icon: RefreshCw,
      title: "Đổi trả dễ dàng",
      description: "Đổi trả trong 7 ngày",
    },
    {
      icon: PackageCheck,
      title: "Thanh toán tiện lợi",
      description: "Nhiều hình thức thanh toán",
    },
    {
      icon: ShieldCheck,
      title: "Cam kết chất lượng",
      description: "Nông sản sạch 100%",
    },
  ];

  return (
    <section
      aria-label="Dịch vụ của Organic Farm"
      title="Dịch vụ của Organic Farm"
      className="grid rounded-2xl border border-green-100 bg-white shadow-sm md:grid-cols-2 lg:grid-cols-4"
    >
      {services.map((item, index) => {
        const Icon = item.icon;

        return (
          <article
            key={item.title}
            title={`${item.title}: ${item.description}`}
            className={`flex items-center gap-4 px-6 py-5 ${
              index !== services.length - 1
                ? "lg:border-r lg:border-green-100"
                : ""
            }`}
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-green-50 text-green-700">
              <Icon size={23} aria-hidden="true" />
            </div>

            <div>
              <h2 className="font-black text-slate-900">{item.title}</h2>
              <p className="text-sm font-medium text-slate-500">
                {item.description}
              </p>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function CategorySection({ categories = [] }) {
  if (!categories.length) {
    return null;
  }

  return (
    <section aria-label="Danh mục sản phẩm" title="Danh mục sản phẩm">
      <SectionTitle
        title="DANH MỤC SẢN PHẨM"
        description="Khám phá nông sản theo từng nhóm danh mục."
        link="/products"
        linkTitle="Xem toàn bộ sản phẩm"
      />

      <HorizontalCarousel
        ariaLabel="Danh sách danh mục sản phẩm"
        itemCount={categories.length}
      >
        {categories.map((category) => {
          const image = getImage(category);
          const categoryUrl = category.slug
            ? `/products?category_slug=${encodeURIComponent(category.slug)}`
            : "/products";
          const categoryTitle = `Xem sản phẩm thuộc danh mục ${category.name}`;

          return (
            <div
              key={category.slug || category.id}
              className={carouselItemClass}
            >
              <Link
                to={categoryUrl}
                title={categoryTitle}
                aria-label={categoryTitle}
                className="group flex h-full flex-col rounded-2xl border border-green-100 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mx-auto grid h-24 w-full place-items-center overflow-hidden rounded-xl bg-[#f4faef]">
                  {image ? (
                    <img
                      src={image}
                      alt={`Ảnh danh mục ${category.name}`}
                      title={`Ảnh danh mục ${category.name}`}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      role="img"
                      aria-label={`Danh mục ${category.name} chưa có hình ảnh`}
                      title={`Danh mục ${category.name} chưa có hình ảnh`}
                      className="grid h-16 w-16 place-items-center rounded-full bg-green-100 text-2xl font-black text-green-700"
                    >
                      {category.name?.charAt(0)}
                    </div>
                  )}
                </div>

                <h3
                  title={category.name}
                  className="mt-3 font-black text-slate-900 group-hover:text-green-700"
                >
                  {category.name}
                </h3>

                <p
                  title={category.description || "Chưa có mô tả danh mục"}
                  className="mt-1 whitespace-normal wrap-break-word text-xs leading-5 text-slate-500"
                >
                  {category.description || "Chưa có mô tả danh mục"}
                </p>

                <p
                  title={`${category.children?.length || 0} nhóm sản phẩm con`}
                  className="mt-2 text-xs font-semibold text-slate-400"
                >
                  {category.children?.length || 0} nhóm sản phẩm
                </p>

                <span className="mt-auto inline-flex items-center justify-center gap-1 pt-3 text-xs font-black text-green-700">
                  Xem tất cả
                  <ArrowRight size={13} aria-hidden="true" />
                </span>
              </Link>
            </div>
          );
        })}
      </HorizontalCarousel>
    </section>
  );
}

function ProductTabsSection({ homeData }) {
  const [activeTab, setActiveTab] = useState("best_selling");

  const productMap = {
    best_selling: homeData.best_selling_products || [],
    featured: homeData.featured_products || [],
    sale: homeData.sale_products || [],
    latest: homeData.new_products || [],
  };

  const products = productMap[activeTab] || [];
  const currentTab = productTabs.find((tab) => tab.key === activeTab);

  const hasAnyProducts = productTabs.some(
    (tab) => (productMap[tab.key] || []).length > 0,
  );

  if (!hasAnyProducts) {
    return null;
  }

  return (
    <section aria-label="Sản phẩm nổi bật" title="Sản phẩm nổi bật">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            title="Sản phẩm nổi bật"
            className="flex items-center gap-2 text-2xl font-black text-slate-950"
          >
            <Leaf size={22} className="text-green-700" aria-hidden="true" />
            Sản phẩm nổi bật
          </h2>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Chọn nhóm sản phẩm phù hợp với nhu cầu của bạn.
          </p>

          <div className="mt-3 flex flex-wrap gap-2" role="tablist">
            {productTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                title={tab.title}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full border px-4 py-1.5 text-sm font-black transition ${
                  activeTab === tab.key
                    ? "border-green-700 bg-green-700 text-white"
                    : "border-green-100 bg-white text-slate-600 hover:border-green-300 hover:text-green-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <Link
          to={`/products?type=${currentTab?.key || "latest"}&sort=${
            currentTab?.sort || "latest"
          }`}
          title={`Xem tất cả sản phẩm ${currentTab?.label || "mới nhất"}`}
          aria-label={`Xem tất cả sản phẩm ${currentTab?.label || "mới nhất"}`}
          className="flex items-center gap-1 text-sm font-black text-green-700 hover:text-green-900"
        >
          Xem tất cả
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      {products.length > 0 ? (
        <HorizontalCarousel
          key={activeTab}
          ariaLabel={`Danh sách sản phẩm ${currentTab?.label || "mới nhất"}`}
          itemCount={products.length}
          resetKey={activeTab}
        >
          {products.map((product) => (
            <div
              key={`${activeTab}-${product.id}`}
              className={carouselItemClass}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </HorizontalCarousel>
      ) : (
        <div
          title="Chưa có sản phẩm phù hợp"
          className="rounded-2xl border border-green-100 bg-white p-6 text-center text-sm font-bold text-slate-500"
        >
          Chưa có sản phẩm phù hợp
        </div>
      )}
    </section>
  );
}

function ProductSection({
  title,
  description,
  products = [],
  viewAllLink = "/products",
}) {
  if (!products.length) {
    return null;
  }

  return (
    <section aria-label={title} title={title}>
      <SectionTitle
        title={title}
        description={description}
        link={viewAllLink}
        linkTitle={`Xem tất cả ${title.toLowerCase()}`}
      />

      <HorizontalCarousel
        ariaLabel={`Danh sách ${title.toLowerCase()}`}
        itemCount={products.length}
      >
        {products.map((product) => (
          <div key={`${title}-${product.id}`} className={carouselItemClass}>
            <ProductCard product={product} />
          </div>
        ))}
      </HorizontalCarousel>
    </section>
  );
}

function ProductCard({ product }) {
  const { addToCart, adding } = useAddToCart();
  const image = getImage(product);
  const rating = getProductRating(product);
  const discountPercent = getDiscountPercent(product);
  const productUrl = product?.slug ? `/products/${product.slug}` : "/products";
  const productTitle = `Xem chi tiết sản phẩm ${product.name}`;

  const finalPrice = product.final_price ?? product.sale_price ?? product.price;

  const finalPriceText =
    product.final_price_text ||
    product.sale_price_text ||
    formatMoney(finalPrice);

  const hasSalePrice =
    product.sale_price !== null &&
    product.sale_price !== undefined &&
    Number(product.sale_price) > 0 &&
    Number(product.sale_price) < Number(product.price);

  const oldPriceText = hasSalePrice
    ? product.price_text || formatMoney(product.price)
    : null;

  return (
    <article
      title={product.name}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <Link
        to={productUrl}
        title={productTitle}
        aria-label={productTitle}
        className="block"
      >
        <div className="relative h-44 bg-[#f4faef]">
          {image ? (
            <img
              src={image}
              alt={`Ảnh sản phẩm ${product.name}`}
              title={`Ảnh sản phẩm ${product.name}`}
              className="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div
              role="img"
              aria-label={`Sản phẩm ${product.name} chưa có hình ảnh`}
              title={`Sản phẩm ${product.name} chưa có hình ảnh`}
              className="grid h-full w-full place-items-center text-green-700"
            >
              <Leaf size={44} aria-hidden="true" />
            </div>
          )}

          <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1.5">
            {discountPercent > 0 && (
              <span
                title={`Giảm ${discountPercent}%`}
                className="rounded-md bg-red-500 px-2 py-1 text-xs font-black text-white shadow-sm"
              >
                -{discountPercent}%
              </span>
            )}

            {product.is_hot && (
              <span
                title="Sản phẩm nổi bật"
                className="rounded-md bg-orange-500 px-2 py-1 text-xs font-black text-white shadow-sm"
              >
                HOT
              </span>
            )}

            {product.is_best_seller && (
              <span
                title="Bán từ 20 sản phẩm trong 30 ngày gần nhất"
                className="rounded-md bg-violet-600 px-2 py-1 text-xs font-black text-white shadow-sm"
              >
                Bán chạy
              </span>
            )}

            {product.is_new && (
              <span
                title="Sản phẩm mới trong 7 ngày gần nhất"
                className="rounded-md bg-green-700 px-2 py-1 text-xs font-black text-white shadow-sm"
              >
                Mới
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <Link to={productUrl} title={productTitle} aria-label={productTitle}>
          <h3
            title={product.name}
            className="min-h-10.5 font-black leading-5 text-slate-900 hover:text-green-700"
          >
            {product.name}
          </h3>
        </Link>

        <Link
          to={product.farm?.slug ? `/farms/${product.farm.slug}` : "/farms"}
          title={`Xem nông trại ${product.farm?.name || "Organic Farm"}`}
          aria-label={`Xem nông trại ${product.farm?.name || "Organic Farm"}`}
          className="mt-1 truncate text-xs font-semibold text-slate-500 hover:text-green-700"
        >
          {product.farm?.name || "Organic Farm"}
        </Link>

        <div
          title={
            rating.total > 0
              ? `${rating.average.toFixed(1)}/5 từ ${rating.total} đánh giá`
              : "Sản phẩm chưa có đánh giá"
          }
          className="mt-2 flex min-w-0 items-center gap-1 text-xs"
        >
          <Star
            size={14}
            className="shrink-0 fill-amber-400 text-amber-400"
            aria-hidden="true"
          />

          {rating.total > 0 ? (
            <>
              <span className="shrink-0 font-black text-slate-700">
                {rating.average.toFixed(1)}
              </span>

              <span className="truncate text-slate-400">
                ({rating.total} đánh giá)
              </span>
            </>
          ) : (
            <span className="truncate font-bold text-slate-400">
              Chưa có đánh giá
            </span>
          )}
        </div>

        <p
          title={formatSoldQuantity(product)}
          className="mt-1 text-xs font-bold text-slate-400"
        >
          {formatSoldQuantity(product)}
        </p>

        {product.accepting_orders === false && (
          <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-xs font-bold text-amber-700">
            Tạm ngừng nhận đơn
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            <p
              title={finalPriceText || "Chưa cập nhật giá"}
              className="truncate text-lg font-black text-green-700"
            >
              {finalPriceText || "Chưa cập nhật giá"}
            </p>

            {oldPriceText && (
              <p
                title={`Giá gốc ${oldPriceText}`}
                className="truncate text-xs font-semibold text-slate-400 line-through"
              >
                {oldPriceText}
              </p>
            )}
          </div>

          <button
            type="button"
            title={product.accepting_orders === false ? (product.order_unavailable_reason || "Gian hàng tạm ngừng nhận đơn") : `Thêm ${product.name} vào giỏ hàng`}
            aria-label={`Thêm ${product.name} vào giỏ hàng`}
            disabled={adding || product.accepting_orders === false}
            onClick={() => addToCart(product)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-green-200 text-green-700 transition hover:bg-green-700 hover:text-white disabled:cursor-not-allowed disabled:border-amber-200 disabled:bg-amber-50 disabled:text-amber-700 disabled:opacity-70"
          >
            <ShoppingCart size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

function SaleBanner() {
  return (
    <section
      aria-label="Ưu đãi đặc biệt"
      title="Ưu đãi đặc biệt giảm đến 30%"
      className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm"
    >
      <div className="grid items-center gap-6 bg-linear-to-r from-[#f2fae9] to-[#dff1cf] px-8 py-7 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="mb-1 text-sm font-black text-green-700">
            Ưu đãi đặc biệt
          </p>

          <h2 className="text-4xl font-black text-green-800">Giảm đến 30%</h2>

          <p className="mt-2 font-medium text-slate-600">
            Áp dụng cho các sản phẩm rau củ quả sạch trong ngày.
          </p>
        </div>

        <Link
          to="/products?type=sale&sort=latest"
          title="Xem các sản phẩm đang khuyến mãi"
          aria-label="Xem các sản phẩm đang khuyến mãi"
          className="w-fit rounded-xl bg-green-700 px-7 py-3 text-sm font-black text-white transition hover:bg-green-800"
        >
          Mua ngay
        </Link>
      </div>
    </section>
  );
}

function FarmSection({ farms = [] }) {
  if (!farms.length) {
    return null;
  }

  return (
    <section aria-label="Nông trại nổi bật" title="Nông trại nổi bật">
      <SectionTitle
        title="Nông trại nổi bật"
        description="Khám phá các nông trại đang hoạt động trên hệ thống."
        link="/farms"
        linkTitle="Xem tất cả nông trại"
      />

      <HorizontalCarousel
        ariaLabel="Danh sách nông trại nổi bật"
        itemCount={farms.length}
      >
        {farms.map((farm) => {
          const rating = getFarmRating(farm);
          const coverImage = farm.cover_image_url || farm.cover_image || "";
          const logoImage = farm.logo_url || farm.logo || "";
          const productCount = farm.product_count ?? farm.products_count ?? 0;
          const sellerName = farm.seller?.name || "Chủ nông trại";
          const address = farm.address || "Chưa cập nhật địa chỉ";
          const farmUrl = farm.slug ? `/farms/${farm.slug}` : "/farms";
          const farmTitle = `Xem nông trại ${farm.name}`;

          return (
            <div key={farm.slug || farm.id} className={farmCarouselItemClass}>
              <Link
                to={farmUrl}
                title={farmTitle}
                aria-label={farmTitle}
                className="group block h-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative h-32 overflow-hidden bg-green-50 sm:h-44">
                  {coverImage ? (
                    <img
                      src={getImageUrl(coverImage)}
                      alt={`Ảnh bìa nông trại ${farm.name}`}
                      title={`Ảnh bìa nông trại ${farm.name}`}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      role="img"
                      aria-label={`Nông trại ${farm.name} chưa có ảnh bìa`}
                      title={`Nông trại ${farm.name} chưa có ảnh bìa`}
                      className="flex h-full items-center justify-center text-green-300"
                    >
                      <Store size={52} aria-hidden="true" />
                    </div>
                  )}

                  <div
                    title={`Logo nông trại ${farm.name}`}
                    className="absolute bottom-2 left-2 flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white shadow-md sm:bottom-4 sm:left-4 sm:h-16 sm:w-16 sm:rounded-2xl sm:border-4"
                  >
                    {logoImage ? (
                      <img
                        src={getImageUrl(logoImage)}
                        alt={`Logo nông trại ${farm.name}`}
                        title={`Logo nông trại ${farm.name}`}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <Store
                        size={22}
                        className="text-green-600 sm:h-7 sm:w-7"
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  <div
                    title={
                      rating.total > 0
                        ? `${rating.average.toFixed(1)}/5 từ ${rating.total} đánh giá`
                        : "Nông trại chưa có đánh giá"
                    }
                    className="absolute right-2 top-2 inline-flex max-w-[calc(100%-3rem)] items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[10px] font-extrabold text-amber-600 shadow-sm backdrop-blur sm:right-4 sm:top-4 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-sm"
                  >
                    <Star
                      size={13}
                      className="shrink-0 fill-amber-400 text-amber-400 sm:h-4 sm:w-4"
                      aria-hidden="true"
                    />

                    <span>
                      {rating.total > 0 ? rating.average.toFixed(1) : "Chưa có"}
                    </span>
                  </div>
                </div>

                <div className="min-w-0 p-3 sm:p-5">
                  <h3
                    title={farm.name}
                    className="whitespace-normal wrap-break-word text-sm font-extrabold leading-5 text-slate-900 transition-colors group-hover:text-green-700 sm:text-lg sm:leading-7"
                  >
                    {farm.name}
                  </h3>

                  <div className="mt-2 flex min-w-0 items-start gap-1.5 text-xs text-slate-500 sm:mt-3 sm:gap-2 sm:text-sm">
                    <MapPin
                      size={15}
                      className="mt-0.5 shrink-0 sm:h-4.25 sm:w-4.25"
                      aria-hidden="true"
                    />

                    <span
                      title={address}
                      className="whitespace-normal wrap-break-word"
                    >
                      {address}
                    </span>
                  </div>

                  <div className="mt-3 flex min-w-0 flex-col gap-2 border-t border-slate-100 pt-3 sm:mt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-4">
                    <div className="min-w-0">
                      <p
                        title={`Chủ nông trại: ${sellerName}`}
                        className="whitespace-normal wrap-break-word text-xs font-semibold text-slate-600 sm:text-sm"
                      >
                        {sellerName}
                      </p>

                      <div
                        title={
                          rating.total > 0
                            ? `${rating.average.toFixed(1)}/5 từ ${rating.total} đánh giá`
                            : "Nông trại chưa có đánh giá"
                        }
                        className="mt-1 flex min-w-0 flex-wrap items-center gap-1 text-[10px] text-slate-500 sm:text-xs"
                      >
                        <Star
                          size={14}
                          className="shrink-0 fill-amber-400 text-amber-400"
                          aria-hidden="true"
                        />

                        {rating.total > 0 ? (
                          <>
                            <span className="shrink-0 font-bold text-slate-700">
                              {rating.average.toFixed(1)}
                            </span>

                            <span className="whitespace-normal wrap-break-word">
                              ({rating.total} đánh giá)
                            </span>
                          </>
                        ) : (
                          <span className="whitespace-normal wrap-break-word">
                            Chưa có đánh giá
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      title={`${productCount} sản phẩm đang bán`}
                      className="flex w-fit shrink-0 items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 sm:px-3 sm:text-sm"
                    >
                      <Package size={15} aria-hidden="true" />
                      {productCount}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </HorizontalCarousel>
    </section>
  );
}

function AboutSection({ stats }) {
  const items = [
    {
      icon: Store,
      value: `${stats?.farms_count ?? 0}+`,
      label: "Nông trại hợp tác",
    },
    {
      icon: PackageCheck,
      value: `${stats?.products_count ?? 0}+`,
      label: "Sản phẩm chất lượng",
    },
    {
      icon: CheckCircle2,
      value:
        stats?.customer_count != null
          ? `${stats.customer_count}+`
          : "Đang cập nhật",
      label: "Khách hàng tin dùng",
    },
    {
      icon: BadgePercent,
      value:
        stats?.satisfaction_rate != null
          ? `${stats.satisfaction_rate}%`
          : "Đang cập nhật",
      label: "Hài lòng & quay lại",
    },
  ];

  return (
    <section
      aria-label="Giới thiệu Organic Farm"
      title="Về Organic Farm"
      className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]"
    >
      <article className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
        <h2
          title="Về Organic Farm"
          className="text-xl font-black text-green-800"
        >
          VỀ ORGANIC FARM
        </h2>

        <p
          title="Cam kết của Organic Farm"
          className="mt-3 font-medium leading-7 text-slate-600"
        >
          Chúng tôi cam kết mang đến những sản phẩm nông sản sạch, an toàn và
          được kiểm soát nguồn gốc rõ ràng từ các nông trại uy tín.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            "Nông sản sạch 100%",
            "Nguồn gốc rõ ràng",
            "Hỗ trợ nông dân Việt",
            "Kiểm định chất lượng",
          ].map((item) => (
            <div
              key={item}
              title={item}
              className="flex items-center gap-2 font-bold text-slate-700"
            >
              <CheckCircle2
                size={18}
                className="text-green-700"
                aria-hidden="true"
              />
              {item}
            </div>
          ))}
        </div>
      </article>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.label}
              title={`${item.value} ${item.label}`}
              className="rounded-2xl border border-green-100 bg-white p-5 text-center shadow-sm"
            >
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-green-50 text-green-700">
                <Icon size={24} aria-hidden="true" />
              </div>

              <p className="mt-3 text-2xl font-black text-green-800">
                {item.value}
              </p>

              <p className="mt-1 text-sm font-bold text-slate-500">
                {item.label}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SectionTitle({ title, description, link, linkTitle }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2
          title={title}
          className="flex items-center gap-2 text-2xl font-black text-slate-950"
        >
          <Leaf size={22} className="text-green-700" aria-hidden="true" />
          {title}
        </h2>

        {description && (
          <p
            title={description}
            className="mt-1 text-sm font-medium text-slate-500"
          >
            {description}
          </p>
        )}
      </div>

      {link && (
        <Link
          to={link}
          title={linkTitle || `Xem tất cả ${title}`}
          aria-label={linkTitle || `Xem tất cả ${title}`}
          className="flex shrink-0 items-center gap-1 text-sm font-black text-green-700 hover:text-green-900"
        >
          Xem tất cả
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function HorizontalCarousel({
  children,
  itemCount = 0,
  ariaLabel,
  resetKey = "default",
}) {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const element = trackRef.current;

    if (!element) {
      return;
    }

    const maxScrollLeft = Math.max(
      0,
      element.scrollWidth - element.clientWidth,
    );

    setCanScrollLeft(element.scrollLeft > 4);
    setCanScrollRight(element.scrollLeft < maxScrollLeft - 4);
  }, []);

  useEffect(() => {
    const element = trackRef.current;

    if (!element) {
      return undefined;
    }

    element.scrollTo({ left: 0, behavior: "auto" });

    const frame = window.requestAnimationFrame(updateScrollState);

    element.addEventListener("scroll", updateScrollState, {
      passive: true,
    });
    window.addEventListener("resize", updateScrollState);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateScrollState)
        : null;

    resizeObserver?.observe(element);

    return () => {
      window.cancelAnimationFrame(frame);
      element.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
      resizeObserver?.disconnect();
    };
  }, [itemCount, resetKey, updateScrollState]);

  const scroll = (direction) => {
    const element = trackRef.current;

    if (!element) {
      return;
    }

    element.scrollBy({
      left: direction * Math.max(element.clientWidth * 0.85, 240),
      behavior: "smooth",
    });
  };

  return (
    <div className="relative min-w-0 max-w-full overflow-hidden px-1">
      <button
        type="button"
        title={`Lướt sang trái: ${ariaLabel}`}
        aria-label={`Lướt sang trái: ${ariaLabel}`}
        disabled={!canScrollLeft}
        onClick={() => scroll(-1)}
        className="absolute left-1 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 sm:h-10 sm:w-10 place-items-center rounded-full border border-green-100 bg-white text-green-700 shadow-md transition hover:bg-green-700 hover:text-white disabled:pointer-events-none disabled:opacity-0"
      >
        <ChevronLeft size={22} aria-hidden="true" />
      </button>

      <div
        ref={trackRef}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        className="flex min-w-0 max-w-full snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <button
        type="button"
        title={`Lướt sang phải: ${ariaLabel}`}
        aria-label={`Lướt sang phải: ${ariaLabel}`}
        disabled={!canScrollRight}
        onClick={() => scroll(1)}
        className="absolute right-1 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 sm:h-10 sm:w-10 place-items-center rounded-full border border-green-100 bg-white text-green-700 shadow-md transition hover:bg-green-700 hover:text-white disabled:pointer-events-none disabled:opacity-0"
      >
        <ChevronRight size={22} aria-hidden="true" />
      </button>
    </div>
  );
}
