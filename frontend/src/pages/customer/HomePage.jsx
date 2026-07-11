import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowRight,
  BadgePercent,
  CheckCircle2,
  Leaf,
  MapPin,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Truck,
} from "lucide-react";
import homeService from "../../services/homeService";

const emptyHomeData = {
  hero: null,
  categories: [],
  featured_products: [],
  new_products: [],
  sale_products: [],
  featured_farms: [],
  stats: null,
};

function getHomePayload(res) {
  return res?.data?.data || res?.data || res || emptyHomeData;
}

function getImage(item) {
  return item?.thumbnail_url || item?.thumbnail || item?.image_url || item?.image || "";
}

export default function HomePage() {
  const [homeData, setHomeData] = useState(emptyHomeData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHome = async () => {
      try {
        setLoading(true);

        const res = await homeService.getHome({
          category_limit: 8,
          product_limit: 6,
          farm_limit: 5,
        });

        const data = getHomePayload(res);

        setHomeData({
          ...emptyHomeData,
          ...data,
        });
      } catch (error) {
        console.log("FETCH HOME ERROR:", error);
        toast.error("Không thể tải dữ liệu trang chủ");
      } finally {
        setLoading(false);
      }
    };

    fetchHome();
  }, []);

  const featuredProducts = useMemo(() => {
    if (homeData.featured_products?.length) return homeData.featured_products;
    return homeData.new_products || [];
  }, [homeData]);

  const saleProducts = useMemo(() => {
    return homeData.sale_products || [];
  }, [homeData.sale_products]);

  if (loading) {
    return (
      <main className="bg-[#f7fbf3] py-8">
        <div className="container-main">
          <div className="h-[360px] animate-pulse rounded-3xl bg-white shadow-sm" />
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#f7fbf3] pb-10">
      <div className="container-main space-y-8 py-6">
        <HeroBanner hero={homeData.hero} products={featuredProducts} />

        <ServiceStrip />

        <CategorySection categories={homeData.categories} />

        <ProductTabsSection homeData={homeData} />

        <SaleBanner />

        <ProductSection
          title="Ưu đãi hôm nay"
          products={saleProducts}
          isSale
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

  return (
    <section className="overflow-hidden rounded-[28px] border border-green-100 bg-white shadow-sm">
      <div className="grid min-h-[360px] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-center px-8 py-10 lg:px-12">
          <div className="mb-5 flex w-fit items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-700">
            <Leaf size={16} />
            Thực phẩm hữu cơ
          </div>

          <h1 className="max-w-xl text-4xl font-black leading-tight text-slate-950 lg:text-5xl">
            {hero?.title || "Nông sản sạch cho cuộc sống xanh"}
          </h1>

          <p className="mt-4 max-w-xl text-base font-medium leading-7 text-slate-600">
            {hero?.subtitle ||
              "Từ nông trại hữu cơ đến bàn ăn gia đình bạn, an toàn và minh bạch nguồn gốc."}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/products"
              className="rounded-xl bg-green-700 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-green-800"
            >
              {hero?.primary_button || "Mua ngay"}
            </Link>

            <Link
              to="/products"
              className="rounded-xl border border-green-200 bg-white px-6 py-3 text-sm font-black text-green-700 transition hover:bg-green-50"
            >
              Xem sản phẩm
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            {(hero?.badges || []).slice(0, 3).map((badge, index) => (
              <div
                key={index}
                className="rounded-2xl border border-green-100 bg-[#f8fcf5] px-4 py-3"
              >
                <p className="text-lg font-black text-green-700">
                  {badge.label}
                </p>
                <p className="text-xs font-bold text-slate-500">
                  {badge.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center bg-gradient-to-br from-[#edf8e7] to-[#dcefcf] p-8">
          {heroImage ? (
            <img
              src={heroImage}
              alt={firstProduct?.name || "Nông sản sạch"}
              className="h-[300px] w-full max-w-[520px] rounded-[26px] object-cover shadow-lg"
            />
          ) : (
            <div className="grid h-[300px] w-full max-w-[520px] place-items-center rounded-[26px] bg-white text-center shadow-sm">
              <div>
                <Leaf className="mx-auto text-green-700" size={60} />
                <p className="mt-3 text-xl font-black text-green-800">
                  Organic Farm
                </p>
              </div>
            </div>
          )}

          <div className="absolute right-7 top-7 rounded-full bg-white px-5 py-4 text-center shadow-md">
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
      desc: "Giao tận nơi toàn quốc",
    },
    {
      icon: RefreshCw,
      title: "Đổi trả dễ dàng",
      desc: "Đổi trả trong 7 ngày",
    },
    {
      icon: PackageCheck,
      title: "Thanh toán tiện lợi",
      desc: "Nhiều hình thức thanh toán",
    },
    {
      icon: ShieldCheck,
      title: "Cam kết chất lượng",
      desc: "Nông sản sạch 100%",
    },
  ];

  return (
    <section className="grid rounded-2xl border border-green-100 bg-white shadow-sm md:grid-cols-2 lg:grid-cols-4">
      {services.map((item, index) => {
        const Icon = item.icon;

        return (
          <div
            key={item.title}
            className={`flex items-center gap-4 px-6 py-5 ${
              index !== services.length - 1 ? "lg:border-r lg:border-green-100" : ""
            }`}
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-green-50 text-green-700">
              <Icon size={23} />
            </div>

            <div>
              <p className="font-black text-slate-900">{item.title}</p>
              <p className="text-sm font-medium text-slate-500">{item.desc}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function CategorySection({ categories = [] }) {
  if (!categories.length) return null;

  return (
    <section>
      <SectionTitle title="DANH MỤC SẢN PHẨM" link="/products" />

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {categories.map((category) => {
          const image = getImage(category);

          return (
            <Link
              key={category.id}
              to={`/products?category_id=${category.id}`}
              className="group rounded-2xl border border-green-100 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mx-auto grid h-24 w-full place-items-center overflow-hidden rounded-xl bg-[#f4faef]">
                {image ? (
                  <img
                    src={image}
                    alt={category.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-green-100 text-2xl font-black text-green-700">
                    {category.name?.charAt(0)}
                  </div>
                )}
              </div>

              <h3 className="mt-3 font-black text-slate-900 group-hover:text-green-700">
                {category.name}
              </h3>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                {category.children?.length || 0} nhóm sản phẩm
              </p>

              <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-green-700">
                Xem tất cả <ArrowRight size={13} />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ProductSection({ title, products = [], showTabs = false }) {
  if (!products.length) return null;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-black text-slate-950">
            <Leaf size={22} className="text-green-700" />
            {title}
          </h2>

          {showTabs && (
            <div className="mt-3 flex flex-wrap gap-2">
              {["Bán chạy", "Nổi bật", "Khuyến mãi", "Mới nhất"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-green-100 bg-white px-3 py-1 text-xs font-bold text-slate-600"
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>

        <Link
          to="/products"
          className="flex items-center gap-1 text-sm font-black text-green-700 hover:text-green-900"
        >
          Xem tất cả <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {products.slice(0, 6).map((product) => (
          <ProductCard key={`${title}-${product.id}`} product={product} />
        ))}
      </div>
    </section>
  );
}

function ProductCard({ product }) {
  const image = getImage(product);

  return (
    <div className="group overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative h-44 bg-[#f4faef]">
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-green-700">
              <Leaf size={46} />
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
        <Link to={`/products/${product.id}`}>
          <h3 className="min-h-[42px] font-black leading-5 text-slate-900 hover:text-green-700">
            {product.name}
          </h3>
        </Link>

        <p className="mt-1 truncate text-xs font-semibold text-slate-500">
          {product.farm?.name || "Organic Farm"}
        </p>

        <div className="mt-2 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Star size={14} className="fill-amber-400 text-amber-400" />

            {product.review_count > 0 && product.rating ? (
              <>
                <span className="font-black text-slate-700">
                  {Number(product.rating).toFixed(1)}
                </span>

                <span className="text-slate-400">
                  ({product.review_count} đánh giá)
                </span>
              </>
            ) : (
              <span className="font-bold text-slate-400">
                Chưa có đánh giá
              </span>
            )}
          </div>
        </div>

        <p className="mt-1 text-xs font-bold text-slate-400">
          {formatSoldQuantity(product)}
        </p>

        <div className="mt-2">
          <p className="text-lg font-black text-green-700">
            {product.final_price_text || product.price_text}
          </p>

          {product.sale_price && (
            <p className="text-xs font-semibold text-slate-400 line-through">
              {product.price_text}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => toast.success("Đã chọn sản phẩm")}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 px-3 py-2 text-sm font-black text-white transition hover:bg-green-800"
        >
          <ShoppingCart size={16} />
          Thêm vào giỏ
        </button>
      </div>
    </div>
  );
}

function SaleBanner() {
  return (
    <section className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm">
      <div className="grid items-center gap-6 bg-gradient-to-r from-[#f2fae9] to-[#dff1cf] px-8 py-7 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="mb-1 text-sm font-black text-green-700">
            Ưu đãi đặc biệt
          </p>

          <h2 className="text-4xl font-black text-green-800">
            Giảm đến 30%
          </h2>

          <p className="mt-2 font-medium text-slate-600">
            Áp dụng cho các sản phẩm rau củ quả sạch trong ngày.
          </p>
        </div>

        <Link
          to="/products"
          className="w-fit rounded-xl bg-green-700 px-7 py-3 text-sm font-black text-white transition hover:bg-green-800"
        >
          Mua ngay
        </Link>
      </div>
    </section>
  );
}

function FarmSection({ farms = [] }) {
  if (!farms.length) return null;

  return (
    <section>
      <SectionTitle title="Nông trại nổi bật" link="/farms" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {farms.map((farm) => (
          <Link
            key={farm.id}
            to={`/farms/${farm.slug}`}
            className="group overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="relative h-32 bg-[#eef8e8]">
              {farm.cover_image_url ? (
                <img
                  src={farm.cover_image_url}
                  alt={farm.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center">
                  <Store size={42} className="text-green-700" />
                </div>
              )}

              <div className="absolute -bottom-6 left-4 grid h-12 w-12 place-items-center rounded-full border-4 border-white bg-green-700 text-white">
                {farm.logo_url ? (
                  <img
                    src={farm.logo_url}
                    alt={farm.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <Leaf size={22} />
                )}
              </div>
            </div>

            <div className="p-4 pt-8">
              <h3 className="font-black text-slate-900 group-hover:text-green-700">
                {farm.name}
              </h3>

              <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-slate-500">
                <MapPin size={14} />
                {farm.address || "Đang cập nhật"}
              </p>

              <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                {farm.review_count > 0 && farm.rating ? (
                  <span className="flex items-center gap-1 font-black text-amber-500">
                    <Star size={14} className="fill-amber-400" />
                    {Number(farm.rating).toFixed(1)}
                    <span className="text-xs font-bold text-slate-400">
                      ({farm.review_count})
                    </span>
                  </span>
                ) : (
                  <span className="font-bold text-slate-400">
                    Chưa có đánh giá
                  </span>
                )}

                <span className="font-bold text-green-700">
                  {farm.products_count || 0} sản phẩm
                </span>
              </div>

              <div className="mt-3 rounded-lg border border-green-100 py-2 text-center text-xs font-black text-green-700">
                Xem gian hàng
              </div>
            </div>
          </Link>
        ))}
      </div>
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
      <section className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
        <div className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-green-800">
            VỀ ORGANIC FARM
          </h2>

          <p className="mt-3 font-medium leading-7 text-slate-600">
            Chúng tôi cam kết mang đến những sản phẩm nông sản sạch, an toàn
            và được kiểm soát nguồn gốc rõ ràng từ các nông trại uy tín.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              "Nông sản sạch 100%",
              "Nguồn gốc rõ ràng",
              "Hỗ trợ nông dân Việt",
              "Kiểm định chất lượng",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 font-bold text-slate-700">
                <CheckCircle2 size={18} className="text-green-700" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-green-100 bg-white p-5 text-center shadow-sm"
              >
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-green-50 text-green-700">
                  <Icon size={24} />
                </div>

                <p className="mt-3 text-2xl font-black text-green-800">
                  {item.value}
                </p>

                <p className="mt-1 text-sm font-bold text-slate-500">
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

function SectionTitle({ title, link }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="flex items-center gap-2 text-2xl font-black text-slate-950">
        <Leaf size={22} className="text-green-700" />
        {title}
      </h2>

      {link && (
        <Link
          to={link}
          className="flex items-center gap-1 text-sm font-black text-green-700 hover:text-green-900"
        >
          Xem tất cả <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
const productTabs = [
  {
    key: "best_selling",
    label: "Bán chạy",
    sort: "best_selling",
  },
  {
    key: "featured",
    label: "Nổi bật",
    sort: "featured",
  },
  {
    key: "sale",
    label: "Khuyến mãi",
    sort: "sale",
  },
  {
    key: "latest",
    label: "Mới nhất",
    sort: "latest",
  },
];

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
    (tab) => (productMap[tab.key] || []).length > 0
  );

  if (!hasAnyProducts) return null;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-black text-slate-950">
            <Leaf size={22} className="text-green-700" />
            Sản phẩm nổi bật
          </h2>

          <div className="mt-3 flex flex-wrap gap-2">
            {productTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
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
            currentTab?.key === "best_selling" ? "best_selling" : "latest"
          }`}
          className="flex items-center gap-1 text-sm font-black text-green-700 hover:text-green-900"
        >
          Xem tất cả <ArrowRight size={16} />
        </Link>
      </div>

      {products.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          {products.slice(0, 6).map((product) => (
            <ProductCard key={`${activeTab}-${product.id}`} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-green-100 bg-white p-6 text-center text-sm font-bold text-slate-500">
          Chưa có sản phẩm phù hợp
        </div>
      )}
    </section>
  );
}

function formatSoldQuantity(product) {
  const quantity = Number(product.sold_quantity ?? 0);
  const unit = product.unit || "";

  if (!quantity) {
    return "Chưa bán";
  }

  const displayQuantity = Number.isInteger(quantity)
    ? quantity
    : quantity.toFixed(1).replace(".0", "");

  return `Đã bán ${displayQuantity}${unit ? ` ${unit}` : ""}`;
}