// src/components/common/SearchBar.jsx

import { useEffect, useRef, useState } from "react";
import { Search, X, Leaf } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import productService from "../../services/productService";

function getPayload(res) {
  return res?.data?.success !== undefined
    ? res.data
    : res?.success !== undefined
    ? res
    : res?.data || res;
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

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

const SearchBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const wrapperRef = useRef(null);

  const [keyword, setKeyword] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [openSuggest, setOpenSuggest] = useState(false);
  const [loading, setLoading] = useState(false);

  const trimmedKeyword = keyword.trim();

  useEffect(() => {
    if (location.pathname === "/products") {
      const params = new URLSearchParams(location.search);
      setKeyword(params.get("keyword") || "");
    } else {
      setKeyword("");
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!wrapperRef.current?.contains(e.target)) {
        setOpenSuggest(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    if (trimmedKeyword.length < 2) {
      setSuggestions([]);
      setOpenSuggest(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const baseParams =
          location.pathname === "/products"
            ? Object.fromEntries(new URLSearchParams(location.search))
            : {};

        delete baseParams.page;

        const res = await productService.getProducts({
          ...baseParams,
          keyword: trimmedKeyword,
          limit: 6,
        });

        const payload = getPayload(res);

        if (!ignore) {
          setSuggestions(payload?.data || []);
          setOpenSuggest(true);
        }
      } catch (error) {
        console.log("SEARCH SUGGEST ERROR:", error);

        if (!ignore) {
          setSuggestions([]);
          setOpenSuggest(true);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [trimmedKeyword, location.pathname, location.search]);

  const goToSearchPage = () => {
    const value = keyword.trim();

    const params = new URLSearchParams(
      location.pathname === "/products" ? location.search : ""
    );

    if (value) {
      params.set("keyword", value);
    } else {
      params.delete("keyword");
    }

    params.delete("page");

    const queryString = params.toString();

    setOpenSuggest(false);

    navigate(queryString ? `/products?${queryString}` : "/products");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    goToSearchPage();
  };

  const clearKeyword = () => {
    setKeyword("");
    setSuggestions([]);
    setOpenSuggest(false);

    if (location.pathname === "/products") {
      const params = new URLSearchParams(location.search);
      params.delete("keyword");
      params.delete("page");

      const queryString = params.toString();
      navigate(queryString ? `/products?${queryString}` : "/products");
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form
        onSubmit={handleSubmit}
        className="
          flex
          w-full
          overflow-hidden
          rounded-[12px]
          border
          border-[#dfe5d8]
          bg-white
          shadow-sm
          transition-all
          duration-300
          focus-within:border-[#6BAE4F]
          focus-within:shadow-md
        "
      >
        <input
          type="text"
          value={keyword}
          onFocus={() => {
            if (trimmedKeyword.length >= 2) {
              setOpenSuggest(true);
            }
          }}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm kiếm sản phẩm..."
          className="
            flex-1
            min-w-0
            h-9
            md:h-9.5
            lg:h-10
            xl:h-11
            bg-transparent
            pl-3
            md:pl-4
            xl:pl-5
            pr-2
            text-[12px]
            md:text-[13px]
            xl:text-[14px]
            text-[#333]
            placeholder:text-[#999]
            outline-none
          "
        />

        {keyword && (
          <button
            type="button"
            onClick={clearKeyword}
            className="
              grid
              h-9
              md:h-9.5
              lg:h-10
              xl:h-11
              w-9
              place-items-center
              text-slate-400
              hover:text-red-500
            "
          >
            <X size={16} />
          </button>
        )}

        <button
          type="submit"
          className="
            h-9
            md:h-9.5
            lg:h-10
            xl:h-11
            w-11
            md:w-12
            lg:w-12.5
            xl:w-13.5
            shrink-0
            bg-[#6BAE4F]
            flex
            items-center
            justify-center
            rounded-[8px]
            text-white
            transition-colors
            duration-200
            hover:bg-[#5D9446]
          "
        >
          <Search size={18} />
        </button>
      </form>

      {openSuggest && trimmedKeyword.length >= 2 && (
        <div
          className="
            absolute
            left-0
            right-0
            top-[calc(100%+10px)]
            z-80
            overflow-hidden
            rounded-2xl
            border
            border-green-100
            bg-white
            shadow-[0_18px_50px_rgba(0,0,0,0.12)]
          "
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-black text-slate-900">
              Kết quả tìm kiếm
            </p>

            <p className="mt-0.5 text-xs font-semibold text-slate-400">
              Từ khóa: “{trimmedKeyword}”
            </p>
          </div>

          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-14 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : suggestions.length ? (
            <div className="max-h-90 overflow-y-auto p-2">
              {suggestions.map((product) => {
                const image = getImage(product);

                const priceText =
                  product.final_price_text ||
                  product.price_text ||
                  formatMoney(product.final_price ?? product.price);

                return (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    onClick={() => setOpenSuggest(false)}
                    className="
                      flex
                      items-center
                      gap-3
                      rounded-xl
                      p-2
                      transition
                      hover:bg-green-50
                    "
                  >
                    <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#f4faef]">
                      {image ? (
                        <img
                          src={image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Leaf size={24} className="text-green-700" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-900">
                        {product.name}
                      </p>

                      <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                        {product.farm?.name || "Organic Farm"}
                      </p>

                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm font-black text-green-700">
                          {priceText}
                        </span>

                        {product.review_count > 0 && product.rating && (
                          <span className="text-xs font-bold text-amber-500">
                            ★ {Number(product.rating).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="p-5 text-center">
              <p className="text-sm font-black text-slate-700">
                Không tìm thấy sản phẩm phù hợp
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-400">
                Thử nhập từ khóa khác hoặc xóa bớt bộ lọc.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={goToSearchPage}
            className="
              flex
              w-full
              items-center
              justify-center
              gap-2
              border-t
              border-slate-100
              bg-green-50
              px-4
              py-3
              text-sm
              font-black
              text-green-700
              transition
              hover:bg-green-100
            "
          >
            Xem tất cả kết quả cho “{trimmedKeyword}”
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;