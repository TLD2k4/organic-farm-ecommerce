// src/components/layout/customer/TopBar.jsx

import { Phone, Truck, TicketPercent } from "lucide-react";

import { Link } from "react-router-dom";

const TopBar = () => {
  const topBarItems = [
    {
      icon: Phone,
      text: "Hotline: 1900 1880",
      link: "tel:19001880",
      isExternal: true,
    },

    {
      icon: Truck,
      text: "Miễn phí giao hàng toàn quốc",
      link: "/shipping-policy",
      isExternal: false,
    },

    {
      icon: TicketPercent,
      text: "Giảm 10% cho đơn đầu tiên",
      link: "/promotions",
      isExternal: false,
    },
  ];

  return (
    <div
      className="
        hidden
        sm:block

        bg-[#f7f9f4]

        shadow-[0_1px_0_rgba(0,0,0,0.03)]
      "
    >
      <div className="container-main">
        <div
          className="
            h-11.5

            flex
            items-center
            justify-between

            gap-4
            md:gap-6
            lg:gap-10

            text-[13px]
            text-[#555]
          "
        >
          {topBarItems.map((item, index) => {
            const Icon = item.icon;

            const Content = (
              <div
                className="
                  flex-1

                  flex
                  items-center
                  justify-center

                  gap-2.5

                  whitespace-nowrap

                  hover:text-[#3e6d2b]

                  transition-colors
                  duration-200
                "
              >
                <Icon
                  size={15}
                  className="
                    text-[#6BAE4F]
                    shrink-0
                  "
                />

                <span className="font-medium">{item.text}</span>
              </div>
            );

            return item.isExternal ? (
              <a key={index} href={item.link} className="flex-1 min-w-0">
                {Content}
              </a>
            ) : (
              <Link key={index} to={item.link} className="flex-1 min-w-0">
                {Content}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
