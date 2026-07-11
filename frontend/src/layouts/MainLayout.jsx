import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import { useAuthStore } from "@/store/authStore";
import useCategory from "@/hooks/useCategory";

import MainLayoutSkeleton from "@/components/skeleton/MainLayoutSkeleton";

import TopBar from "@/components/layout/customer/TopBar";
import Header from "@/components/layout/customer/Header";
import Navbar from "@/components/layout/customer/Navbar";
import Footer from "@/components/layout/customer/Footer";

export default function MainLayout() {
  const { token, user, initialLoading } = useAuthStore();

  const { publicCategories, publicLoading, getAll } = useCategory();

  useEffect(() => {
    getAll({
      page: 1,
      limit: 50,
    }).catch(() => {
      // API lỗi thì không làm vỡ toàn bộ layout
    });
  }, [getAll]);

  if (token && initialLoading && !user) {
    return <MainLayoutSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#f8faf5]">
      <TopBar />

      <Header categories={publicCategories} categoriesLoading={publicLoading} />

      <Navbar categories={publicCategories} categoriesLoading={publicLoading} />

      <main className="container-main py-2 sm:py-3 lg:py-5">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
