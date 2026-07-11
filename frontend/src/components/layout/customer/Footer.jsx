// src/components/layout/customer/Footer.jsx

import { Mail, MapPin, Phone } from "lucide-react";

import { FaFacebookF, FaInstagram, FaYoutube, FaTiktok } from "react-icons/fa";

import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerColumns = [
    {
      title: "Về chúng tôi",

      links: [
        {
          label: "Giới thiệu",
          path: "/about",
        },

        {
          label: "Nông trại",
          path: "/farms",
        },

        {
          label: "Tin tức",
          path: "/news",
        },

        {
          label: "Tuyển dụng",
          path: "/careers",
        },

        {
          label: "Liên hệ",
          path: "/contact",
        },
      ],
    },

    {
      title: "Chính sách",

      links: [
        {
          label: "Bảo mật",
          path: "/privacy-policy",
        },

        {
          label: "Đổi trả",
          path: "/return-policy",
        },

        {
          label: "Vận chuyển",
          path: "/shipping-policy",
        },

        {
          label: "Điều khoản",
          path: "/terms",
        },
      ],
    },

    {
      title: "Hỗ trợ khách hàng",

      links: [
        {
          label: "Hướng dẫn mua hàng",
          path: "/shopping-guide",
        },

        {
          label: "Thanh toán",
          path: "/payment-guide",
        },

        {
          label: "FAQ",
          path: "/faq",
        },

        {
          label: "Liên hệ hỗ trợ",
          path: "/support",
        },
      ],
    },
  ];

  const socials = [
    {
      icon: <FaFacebookF size={14} />,
      className: "bg-[#1877F2]",
      link: "https://facebook.com",
    },

    {
      icon: <FaInstagram size={14} />,
      className: "bg-gradient-to-tr from-[#f9ce34] to-[#ee2a7b]",
      link: "https://instagram.com",
    },

    {
      icon: <FaYoutube size={14} />,
      className: "bg-[#FF0000]",
      link: "https://youtube.com",
    },

    {
      icon: <FaTiktok size={14} />,
      className: "bg-black",
      link: "https://tiktok.com",
    },
  ];

  return (
    <footer
      className="
        mt-6
        lg:mt-8

        border-t
        border-[#e5e7e1]

        bg-[#f6f8f3]
      "
    >
      {/* MAIN */}
      <div
        className="
          container-main

          pt-5
          sm:pt-6
          lg:pt-7

          pb-4
        "
      >
        {/* GRID */}
        <div
          className="
            grid

            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-10

            gap-y-6
            gap-x-8
            lg:gap-x-10
            xl:gap-x-14

            sm:justify-items-center
          "
        >
          {/* LEFT */}
          <div
            className="
              lg:col-span-4

              flex
              flex-col

              items-center
              text-center

              sm:items-start
              sm:text-left

              sm:justify-self-start

              sm:ml-4
              md:ml-8
              lg:ml-0
            "
          >
            {/* LOGO */}
            <Link
              to="/"
              className="
                flex
                items-center

                gap-3
              "
            >
              <div
                className="
                  w-8.5
                  h-8.5

                  sm:w-9
                  sm:h-9

                  md:w-9.5
                  md:h-9.5

                  lg:w-10
                  lg:h-10

                  xl:w-10.5
                  xl:h-10.5

                  rounded-full

                  bg-[#6BAE4F]

                  flex
                  items-center
                  justify-center

                  text-[20px]
                  sm:text-[22px]
                  lg:text-[25px]

                  text-white

                  shadow-sm
                "
              >
                🌿
              </div>

              <div>
                <h2
                  className="
                    text-[18px]
                    sm:text-[20px]
                    lg:text-[24px]

                    font-bold

                    leading-none

                    text-[#2d5d1f]
                  "
                >
                  Organic Farm
                </h2>

                <p
                  className="
                    mt-0.5

                    text-[12px]
                    sm:text-[13px]
                    lg:text-[14px]

                    text-[#777]
                  "
                >
                  Nông sản sạch cho mọi nhà
                </p>
              </div>
            </Link>

            {/* DESC */}
            <p
              className="
                mt-3

                max-w-85

                text-[12px]
                sm:text-[13px]
                lg:text-[14px]

                leading-[1.7]

                text-[#666]
              "
            >
              Chuyên cung cấp thực phẩm organic, nông sản sạch và sản phẩm tự
              nhiên chất lượng cao cho gia đình Việt.
            </p>

            {/* SOCIAL */}
            <div
              className="
                mt-4

                flex
                items-center

                gap-2
              "
            >
              {socials.map((item, index) => (
                <a
                  key={index}
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className={`
                    w-8
                    h-8

                    sm:w-8.5
                    sm:h-8.5

                    rounded-full

                    flex
                    items-center
                    justify-center

                    text-white

                    hover:scale-105

                    transition-all
                    duration-200

                    ${item.className}
                  `}
                >
                  {item.icon}
                </a>
              ))}
            </div>

            {/* CONTACT */}
            <div
              className="
                mt-4

                flex
                flex-col

                gap-2
              "
            >
              <a
                href="tel:18001800"
                className="
                  flex
                  items-center

                  gap-2

                  hover:text-[#6BAE4F]

                  transition-colors
                "
              >
                <Phone size={15} className="text-[#6BAE4F]" />

                <p
                  className="
                    text-[13px]
                    sm:text-[14px]
                    lg:text-[15px]

                    text-[#555]
                  "
                >
                  Hotline: 1800 1800
                </p>
              </a>

              <a
                href="mailto:support@organicfarm.vn"
                className="
                  flex
                  items-center

                  gap-2

                  hover:text-[#6BAE4F]

                  transition-colors
                "
              >
                <Mail size={15} className="text-[#6BAE4F]" />

                <p
                  className="
                    text-[13px]
                    sm:text-[14px]
                    lg:text-[15px]

                    text-[#555]
                  "
                >
                  support@organicfarm.vn
                </p>
              </a>

              <div
                className="
                  flex
                  items-start

                  gap-2
                "
              >
                <MapPin
                  size={15}
                  className="
                    mt-0.5

                    text-[#6BAE4F]
                  "
                />

                <p
                  className="
                    text-[13px]
                    sm:text-[14px]
                    lg:text-[15px]

                    leading-[1.6]

                    text-[#555]
                  "
                >
                  125 Đường Lê Lợi, Q.1, TP.HCM
                </p>
              </div>
            </div>
          </div>

          {/* COLUMNS */}
          {footerColumns.map((column, index) => (
            <div
              key={index}
              className="
                lg:col-span-2

                lg:justify-self-center
              "
            >
              <h3
                className="
                  text-[14px]
                  lg:text-[16px]

                  font-bold

                  uppercase

                  tracking-wide

                  text-[#2d5d1f]
                "
              >
                {column.title}
              </h3>

              <div
                className="
                  mt-3

                  flex
                  flex-col

                  gap-1.75
                "
              >
                {column.links.map((link, i) => (
                  <Link
                    key={i}
                    to={link.path}
                    className="
                      text-[13px]
                    sm:text-[14px]
                    lg:text-[15px]

                      text-[#666]

                      hover:text-[#6BAE4F]
                      hover:-translate-y-px
                      transition-colors
                    "
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* NEWSLETTER */}
        <div
          className="
            mt-7

            flex
            flex-col

            items-start
            text-left

            sm:items-center
            sm:text-center
          "
        >
          <h3
            className="
              text-[14px]
              lg:text-[16px]

              font-bold

              uppercase

              tracking-wide

              text-[#2d5d1f]
            "
          >
            Đăng ký nhận tin
          </h3>

          <p
            className="
              mt-2

              max-w-[320px]

              text-[13px]
              sm:text-[14px]
              lg:text-[15px]

              leading-[1.6]

              text-[#666]
            "
          >
            Nhận thông tin khuyến mãi mới nhất từ Organic Farm
          </p>

          {/* FORM */}
          <div
            className="
              mt-3

              flex

              w-full
              max-w-90

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
              type="email"
              placeholder="Nhập email..."
              className="
                flex-1

                h-10
                lg:h-11

                px-3
                lg:px-4

                text-[13px]
                sm:text-[14px]
                lg:text-[15px]

                outline-none
              "
            />

            <button
              className="
                px-4
                lg:px-5

                bg-[#6BAE4F]
                hover:bg-[#5d9446]

                text-white

                text-[13px]
                sm:text-[14px]
                lg:text-[15px]

                font-semibold
rounded-[8px]
                transition-all
              "
            >
              Đăng ký
            </button>
          </div>

          {/* PAYMENT */}
          <div
            className="
              mt-4

              flex
              flex-wrap

              gap-2
            "
          >
            {["VISA", "MASTER", "MOMO", "ZALOPAY", "VNPAY"].map(
              (item, index) => (
                <div
                  key={index}
                  className="
                  h-6
                  lg:h-7

                  px-3

                  rounded-[6px]

                  border
                  border-[#e5e7e1]

                  bg-white

                  flex
                  items-center
                  justify-center

                  text-[10px]
                  lg:text-[11px]

                  font-bold

                  text-[#555]
                "
                >
                  {item}
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM */}
      <div
        className="
          border-t
          border-[#e5e7e1]

          bg-[#eef2e7]
        "
      >
        <div
          className="
            container-main

            h-8.5
            sm:h-9.5

            flex
            items-center
            justify-center
          "
        >
          <p
            className="
              text-[12px]
              sm:text-[13px]

              text-[#666]
            "
          >
            © {currentYear} Organic Farm. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
