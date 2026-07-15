import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import toast from "react-hot-toast";
import {
  BadgeCheck,
  ChevronRight,
  Clock,
  Flame,
  Grid2X2,
  Leaf,
  RotateCcw,
  ShoppingCart,
  Star,
  Tag,
} from "lucide-react";
import productService from "../../services/productService";
import Pagination from "../../components/common/Pagination";
import ResponsiveSelect from "../../components/common/ResponsiveSelect";
import useAddToCart from "@/hooks/useAddToCart";
const emptyMeta = {
  total: 0,
  per_page: 24,
  current_page: 1,
  last_page: 1,
};

const typeTabs = [
  {
    value: "featured",
    label: "Nổi bật",
    icon: Star,
    title: "Tất cả sản phẩm nổi bật",
  },
  {
    value: "best_selling",
    label: "Bán chạy",
    icon: Flame,
    title: "Tất cả sản phẩm bán chạy",
  },
  {
    value: "sale",
    label: "Khuyến mãi",
    icon: Tag,
    title: "Tất cả sản phẩm khuyến mãi",
  },
  {
    value: "latest",
    label: "Mới nhất",
    icon: Clock,
    title: "Tất cả sản phẩm",
  },
];

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

function getStateFromSearch(searchParams) {
  const rawSort = searchParams.get("sort") || "latest";
  let type = searchParams.get("type") || "";

  let sort = rawSort;

  // Hỗ trợ link cũ từ HomePage: /products?sort=featured
  if (
    !type &&
    ["featured", "sale", "best_selling", "latest"].includes(rawSort)
  ) {
    type = rawSort;
    sort = rawSort === "best_selling" ? "best_selling" : "latest";
  }

  if (!type) type = "latest";

  return {
    keyword: searchParams.get("keyword") || "",
    category_slug: searchParams.get("category_slug") || "",
    category_id: searchParams.get("category_id") || "",
    vendor_id: searchParams.get("vendor_id") || "",
    certification_id: searchParams.get("certification_id") || "",
    min_price: searchParams.get("min_price") || "",
    max_price: searchParams.get("max_price") || "",
    type,
    sort,
    page: Number(searchParams.get("page") || 1),
    limit: Number(searchParams.get("limit") || 12),
  };
}

function buildQuery(nextState) {
  const params = new URLSearchParams();

  Object.entries(nextState).forEach(([key, value]) => {
    if (value === "" || value === null || value === undefined) return;
    if (key === "page" && Number(value) === 1) return;
    if (key === "limit" && Number(value) === 12) return;
    if (key === "type" && value === "latest") return;
    if (key === "sort" && value === "latest") return;

    params.set(key, String(value));
  });

  return params;
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(emptyMeta);
  const [filters, setFilters] = useState(() =>
    getStateFromSearch(searchParams),
  );

  const [options, setOptions] = useState({
    categories: [],
    farms: [],
    certifications: [],
  });

  const [loading, setLoading] = useState(true);

  const queryString = searchParams.toString();

  const currentType =
    typeTabs.find((item) => item.value === filters.type) || typeTabs[3];

  const parentCategories = useMemo(() => {
    return options.categories || [];
  }, [options.categories]);

  const allCategoryOptions = useMemo(() => {
    const result = [];

    parentCategories.forEach((parent) => {
      result.push({
        ...parent,
        is_parent: true,
      });

      (parent.children || []).forEach((child) => {
        result.push({
          ...child,
          is_parent: false,
          parent_id: parent.id,
          parent_name: parent.name,
        });
      });
    });

    return result;
  }, [parentCategories]);

  const selectedCategory = allCategoryOptions.find((item) => {
    if (filters.category_slug) {
      return String(item.slug) === String(filters.category_slug);
    }

    return String(item.id) === String(filters.category_id);
  });

  const selectedParentCategory = useMemo(() => {
    const categorySlug = String(filters.category_slug || "");
    const categoryId = String(filters.category_id || "");

    if (!categorySlug && !categoryId) return null;

    return parentCategories.find((parent) => {
      if (categorySlug && String(parent.slug) === categorySlug) return true;
      if (!categorySlug && String(parent.id) === categoryId) return true;

      return (parent.children || []).some((child) => {
        if (categorySlug) {
          return String(child.slug) === categorySlug;
        }

        return String(child.id) === categoryId;
      });
    });
  }, [filters.category_slug, filters.category_id, parentCategories]);

  const childCategories = selectedParentCategory?.children || [];

  const selectedFarm = (options.farms || []).find(
    (item) => String(item.id) === String(filters.vendor_id),
  );

  const selectedCertification = (options.certifications || []).find(
    (item) => String(item.id) === String(filters.certification_id),
  );

  const activeChips = [
    filters.type !== "latest"
      ? {
          key: "type",
          label: currentType.label,
          clear: {
            type: "latest",
            sort: "latest",
          },
        }
      : null,

    selectedCategory
      ? {
          key: "category_slug",
          label: selectedCategory.name,
          clear: {
            category_slug: "",
            category_id: "",
          },
        }
      : null,

    selectedFarm
      ? {
          key: "vendor_id",
          label: selectedFarm.name,
          clear: {
            vendor_id: "",
          },
        }
      : null,

    selectedCertification
      ? {
          key: "certification_id",
          label: selectedCertification.name,
          clear: {
            certification_id: "",
          },
        }
      : null,

    filters.min_price || filters.max_price
      ? {
          key: "price",
          label: `Giá ${filters.min_price ? money(filters.min_price) : "0đ"} - ${
            filters.max_price ? money(filters.max_price) : "∞"
          }`,
          clear: {
            min_price: "",
            max_price: "",
          },
        }
      : null,

    filters.keyword
      ? {
          key: "keyword",
          label: `Từ khóa: ${filters.keyword}`,
          clear: {
            keyword: "",
          },
        }
      : null,
  ].filter(Boolean);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const res = await productService.getFilterOptions();
        const payload = getPayload(res);

        setOptions({
          categories: payload?.data?.categories || [],
          farms: payload?.data?.farms || [],
          certifications: payload?.data?.certifications || [],
        });
      } catch (error) {
        console.log("LOAD PRODUCT FILTER OPTIONS ERROR:", error);
      }
    };

    loadOptions();
  }, []);

  useEffect(() => {
    const nextFilters = getStateFromSearch(searchParams);
    setFilters(nextFilters);

    const fetchProducts = async () => {
      try {
        setLoading(true);

        const apiParams = {
          keyword: nextFilters.keyword,
          category_slug: nextFilters.category_slug,
          category_id: nextFilters.category_id,
          vendor_id: nextFilters.vendor_id,
          certification_id: nextFilters.certification_id,
          min_price: nextFilters.min_price,
          max_price: nextFilters.max_price,
          type: nextFilters.type,
          sort: nextFilters.sort,
          page: nextFilters.page,
          limit: nextFilters.limit,
        };

        Object.keys(apiParams).forEach((key) => {
          if (
            apiParams[key] === "" ||
            apiParams[key] === null ||
            apiParams[key] === undefined
          ) {
            delete apiParams[key];
          }
        });

        const res = await productService.getProducts(apiParams);
        const payload = getPayload(res);

        setProducts(payload?.data || []);
        setMeta(payload?.meta || emptyMeta);
      } catch (error) {
        console.log("LOAD PRODUCTS ERROR:", error);
        toast.error("Không thể tải danh sách sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [queryString]);

  const pushQuery = (nextState) => {
    setSearchParams(buildQuery(nextState));
  };

  const selectCategory = (categorySlug) => {
    const nextCategorySlug =
      String(filters.category_slug) === String(categorySlug)
        ? ""
        : String(categorySlug);

    pushQuery({
      ...filters,
      category_slug: nextCategorySlug,
      category_id: "",
      page: 1,
    });
  };

  const applyFilters = () => {
    pushQuery({
      ...filters,
      page: 1,
    });
  };

  const clearFilters = () => {
    pushQuery({
      type: "latest",
      sort: "latest",
      page: 1,
      limit: filters.limit || 12,
    });
  };

  const changeType = (type) => {
    const nextSort = type === "best_selling" ? "best_selling" : "latest";

    pushQuery({
      ...filters,
      type,
      sort: nextSort,
      page: 1,
    });
  };

  const changePage = (page) => {
    pushQuery({
      ...filters,
      page,
    });
  };

  const removeChip = (chip) => {
    pushQuery({
      ...filters,
      ...chip.clear,
      page: 1,
    });
  };

  return (
    <main className="bg-[#f7fbf3] py-6">
      <div className="container-main">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-500">
          <Link to="/" className="hover:text-green-700">
            Trang chủ
          </Link>
          <ChevronRight size={15} />
          <span>Sản phẩm</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-4">
            <div className="rounded-2xl border border-green-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <h3 className="font-black text-slate-900">Danh mục sản phẩm</h3>
              </div>

              <div className="p-3">
                {parentCategories.map((category) => {
                  const isActiveParent =
                    String(filters.category_slug) === String(category.slug) ||
                    String(selectedParentCategory?.slug) ===
                      String(category.slug);

                  const totalProducts =
                    Number(category.products_count || 0) +
                    (category.children || []).reduce((sum, child) => {
                      return sum + Number(child.products_count || 0);
                    }, 0);

                  const image = getImage(category);

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => selectCategory(category.slug)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-bold transition ${
                        isActiveParent
                          ? "bg-green-50 text-green-700"
                          : "text-slate-600 hover:bg-green-50 hover:text-green-700"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {image ? (
                          <img
                            src={image}
                            alt={category.name}
                            className="h-7 w-7 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="grid h-7 w-7 place-items-center rounded-lg bg-green-50 text-green-700">
                            <Leaf size={15} />
                          </span>
                        )}

                        {category.name}
                      </span>

                      <span className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">
                          {totalProducts}
                        </span>
                        <ChevronRight size={15} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-green-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <h3 className="font-black text-slate-900">Bộ lọc sản phẩm</h3>
              </div>

              <div className="space-y-5 p-4">
                <div>
                  <p className="mb-3 text-sm font-black text-slate-900">
                    Khoảng giá
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="Từ"
                      value={filters.min_price}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          min_price: e.target.value,
                        }))
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-green-600"
                    />

                    <input
                      type="number"
                      min="0"
                      placeholder="Đến"
                      value={filters.max_price}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          max_price: e.target.value,
                        }))
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-green-600"
                    />
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {[
                      { label: "Dưới 50k", min_price: "", max_price: "50000" },
                      {
                        label: "50k - 100k",
                        min_price: "50000",
                        max_price: "100000",
                      },
                      {
                        label: "100k - 200k",
                        min_price: "100000",
                        max_price: "200000",
                      },
                      {
                        label: "Trên 200k",
                        min_price: "200000",
                        max_price: "",
                      },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            min_price: item.min_price,
                            max_price: item.max_price,
                          }))
                        }
                        className="rounded-lg border border-green-100 px-2 py-1.5 text-xs font-bold text-slate-600 hover:bg-green-50 hover:text-green-700"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-black text-slate-900">
                    Nông trại / Xuất xứ
                  </p>

                  <div className="space-y-2">
                    {(options.farms || []).slice(0, 8).map((farm) => (
                      <label
                        key={farm.id}
                        className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-slate-600"
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={
                              String(filters.vendor_id) === String(farm.id)
                            }
                            onChange={() =>
                              setFilters((prev) => ({
                                ...prev,
                                vendor_id:
                                  String(prev.vendor_id) === String(farm.id)
                                    ? ""
                                    : String(farm.id),
                              }))
                            }
                            className="h-4 w-4 accent-green-700"
                          />
                          {farm.name}
                        </span>

                        <span className="text-xs text-slate-400">
                          {farm.products_count || 0}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-black text-slate-900">
                    Chứng nhận chất lượng
                  </p>

                  <div className="space-y-2">
                    {(options.certifications || []).map((cert) => (
                      <label
                        key={cert.id}
                        className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600"
                      >
                        <input
                          type="checkbox"
                          checked={
                            String(filters.certification_id) === String(cert.id)
                          }
                          onChange={() =>
                            setFilters((prev) => ({
                              ...prev,
                              certification_id:
                                String(prev.certification_id) ===
                                String(cert.id)
                                  ? ""
                                  : String(cert.id),
                            }))
                          }
                          className="h-4 w-4 accent-green-700"
                        />
                        {cert.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={applyFilters}
                    className="rounded-xl bg-green-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-green-800"
                  >
                    Áp dụng
                  </button>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                  >
                    <RotateCcw size={15} />
                    Xóa lọc
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <section>
            <div className="mb-5">
              <h1 className="flex items-center gap-2 text-3xl font-black text-slate-950">
                <Leaf size={27} className="text-green-700" />
                {currentType.title}
              </h1>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                Khám phá tất cả nông sản sạch, chất lượng từ Organic Farm
              </p>
            </div>

            {selectedParentCategory && childCategories.length > 0 && (
              <div className="mb-4 rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      Khám phá theo danh mục
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {selectedParentCategory.name}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => selectCategory(selectedParentCategory.slug)}
                    className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                      String(filters.category_slug) ===
                      String(selectedParentCategory.slug)
                        ? "border-green-700 bg-green-700 text-white"
                        : "border-green-100 bg-white text-green-700 hover:bg-green-50"
                    }`}
                  >
                    Tất cả
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                  {childCategories.map((child) => {
                    const image = getImage(child);
                    const active =
                      String(filters.category_slug) === String(child.slug);

                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => selectCategory(child.slug)}
                        className={`group rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                          active
                            ? "border-green-700 bg-green-50"
                            : "border-green-100 bg-white"
                        }`}
                      >
                        <div className="grid h-24 place-items-center overflow-hidden rounded-xl bg-[#f4faef]">
                          {image ? (
                            <img
                              src={image}
                              alt={child.name}
                              className="h-full w-full object-cover transition group-hover:scale-105"
                            />
                          ) : (
                            <Leaf size={34} className="text-green-700" />
                          )}
                        </div>

                        <p className="mt-3 font-black text-slate-900 group-hover:text-green-700">
                          {child.name}
                        </p>

                        <p className="mt-1 text-xs font-bold text-slate-400">
                          {child.products_count || 0} sản phẩm
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mb-4 rounded-2xl border border-green-100 bg-white p-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {typeTabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = filters.type === tab.value;

                    return (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => changeType(tab.value)}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-black transition ${
                          active
                            ? "border-green-700 bg-green-700 text-white"
                            : "border-green-100 bg-white text-slate-600 hover:border-green-300 hover:text-green-700"
                        }`}
                      >
                        <Icon size={16} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-44 max-w-full">
                    <ResponsiveSelect
                      value={filters.sort}
                      onChange={(sort) => {
                        pushQuery({
                          ...filters,
                          sort,
                          page: 1,
                        });
                      }}
                      options={[
                        { value: "latest", label: "Mới nhất" },
                        { value: "best_selling", label: "Bán chạy" },
                        { value: "price_asc", label: "Giá thấp đến cao" },
                        { value: "price_desc", label: "Giá cao đến thấp" },
                      ]}
                    />
                  </div>

                  <div className="w-40 max-w-full">
                    <ResponsiveSelect
                      value={filters.limit}
                      onChange={(value) => {
                        pushQuery({
                          ...filters,
                          limit: Number(value),
                          page: 1,
                        });
                      }}
                      options={[
                        { value: 12, label: "12 sản phẩm" },
                        { value: 24, label: "24 sản phẩm" },
                        { value: 36, label: "36 sản phẩm" },
                      ]}
                    />
                  </div>

                  <button className="grid h-10 w-10 place-items-center rounded-xl bg-green-700 text-white">
                    <Grid2X2 size={18} />
                  </button>
                </div>
              </div>
            </div>

            {activeChips.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-black text-green-800">
                    Đang lọc:
                  </span>

                  {activeChips.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => removeChip(chip)}
                      className="rounded-full border border-green-200 bg-white px-3 py-1 text-xs font-black text-green-700"
                    >
                      {chip.label} ×
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-black text-green-800 hover:text-red-500"
                >
                  Xóa tất cả
                </button>
              </div>
            )}

            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-slate-500">
                Hiển thị {products.length} / {meta.total || 0} sản phẩm
              </p>
            </div>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-82.5 animate-pulse rounded-2xl bg-white shadow-sm"
                  />
                ))}
              </div>
            ) : products.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-green-100 bg-white p-10 text-center">
                <BadgeCheck size={46} className="mx-auto text-green-700" />

                <p className="mt-3 text-lg font-black text-slate-900">
                  Không có sản phẩm phù hợp
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Thử thay đổi khoảng giá, nông trại hoặc chứng nhận chất lượng.
                </p>
              </div>
            )}
            <Pagination
              currentPage={meta.current_page || 1}
              lastPage={meta.last_page || 1}
              onPageChange={changePage}
            />
          </section>
        </div>
      </div>
    </main>
  );
}

function ProductCard({ product }) {
  const { addToCart, adding } = useAddToCart();
  const image = getImage(product);

  const finalPriceText =
    product.final_price_text ||
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
              className="h-full w-full object-contain p-3 transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-green-700">
              <Leaf size={44} />
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
          <h3 className="min-h-10.5 font-black leading-5 text-slate-900 hover:text-green-700">
            {product.name}
          </h3>
        </Link>

        <p className="mt-1 truncate text-xs font-semibold text-slate-500">
          {product.farm?.name || "Organic Farm"}
        </p>

        <div className="mt-2 flex items-center gap-1 text-xs">
          {product.review_count > 0 && product.rating ? (
            <>
              <Star size={14} className="fill-amber-400 text-amber-400" />

              <span className="font-black text-slate-700">
                {Number(product.rating).toFixed(1)}
              </span>

              <span className="text-slate-400">
                ({product.review_count} đánh giá)
              </span>
            </>
          ) : (
            <span className="font-bold text-slate-400">Chưa có đánh giá</span>
          )}
        </div>

        <p className="mt-1 text-xs font-bold text-slate-400">
          {formatSoldQuantity(product)}
        </p>

        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-black text-green-700">
              {finalPriceText}
            </p>

            {oldPriceText && (
              <p className="text-xs font-semibold text-slate-400 line-through">
                {oldPriceText}
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={adding}
            onClick={() => addToCart(product)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-green-200 text-green-700 transition hover:bg-green-700 hover:text-white disabled:cursor-wait disabled:opacity-60"
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function formatSoldQuantity(product) {
  const quantity = Number(product.sold_quantity ?? 0);
  const unit = product.unit || "";

  if (!quantity) return "Chưa bán";

  const displayQuantity = Number.isInteger(quantity)
    ? quantity
    : quantity.toFixed(1).replace(".0", "");

  return `Đã bán ${displayQuantity}${unit ? ` ${unit}` : ""}`;
}
