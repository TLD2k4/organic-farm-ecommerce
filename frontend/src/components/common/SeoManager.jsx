import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const DEFAULT_META = {
  title: "Organic Farm | Nông sản sạch cho mọi nhà",
  description:
    "Organic Farm kết nối người tiêu dùng với nông sản sạch, có nguồn gốc rõ ràng từ các nông trại uy tín.",
};

const PUBLIC_ROUTES = [
  {
    match: (path) => path === "/",
    ...DEFAULT_META,
  },
  {
    match: (path) => path === "/products",
    title: "Sản phẩm nông sản sạch | Organic Farm",
    description: "Khám phá nông sản sạch, chất lượng và có nguồn gốc rõ ràng trên Organic Farm.",
  },
  {
    match: (path) => path.startsWith("/products/"),
    title: "Chi tiết sản phẩm | Organic Farm",
    description: "Xem thông tin, chứng nhận và nguồn gốc sản phẩm tại Organic Farm.",
  },
  {
    match: (path) => path === "/farms",
    title: "Nông trại uy tín | Organic Farm",
    description: "Khám phá các nông trại uy tín cung cấp nông sản sạch trên Organic Farm.",
  },
  {
    match: (path) => path.startsWith("/farms/"),
    title: "Chi tiết nông trại | Organic Farm",
    description: "Xem hồ sơ, chứng nhận và sản phẩm của nông trại trên Organic Farm.",
  },
  {
    match: (path) => path === "/seller-policy",
    title: "Chính sách người bán | Organic Farm",
    description: "Chính sách dành cho người bán và nông trại tham gia Organic Farm.",
  },
];

const PRIVATE_TITLES = [
  [/^\/login$/, "Đăng nhập | Organic Farm"],
  [/^\/register$/, "Đăng ký | Organic Farm"],
  [/^\/cart$/, "Giỏ hàng | Organic Farm"],
  [/^\/checkout$/, "Thanh toán | Organic Farm"],
  [/^\/order-success$/, "Đơn hàng | Organic Farm"],
  [/^\/profile/, "Hồ sơ của tôi | Organic Farm"],
  [/^\/seller/, "Quản trị gian hàng | Organic Farm"],
  [/^\/admin/, "Quản trị hệ thống | Organic Farm"],
];

export default function SeoManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const publicMeta = PUBLIC_ROUTES.find((item) => item.match(pathname));
    const privateTitle = PRIVATE_TITLES.find(([pattern]) => pattern.test(pathname));
    const meta = publicMeta || {
      ...DEFAULT_META,
      title: privateTitle?.[1] || DEFAULT_META.title,
    };
    const isPublic = Boolean(publicMeta);

    document.title = meta.title;
    setMeta("name", "description", meta.description);
    setMeta("name", "robots", isPublic ? "index, follow" : "noindex, nofollow");
    setMeta("property", "og:title", meta.title);
    setMeta("property", "og:description", meta.description);
    setMeta("name", "twitter:title", meta.title);
    setMeta("name", "twitter:description", meta.description);
  }, [pathname]);

  return null;
}

function setMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}
