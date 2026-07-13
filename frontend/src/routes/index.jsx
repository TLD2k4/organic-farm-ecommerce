import { Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import SellerLayout from "../layouts/SellerLayout";
import AdminLayout from "../layouts/AdminLayout";

import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

import HomePage from "../pages/customer/HomePage";
import ProfilePage from "../pages/customer/ProfilePage";
import CheckoutPage from "../pages/customer/CheckoutPage";
import CartPage from "../pages/customer/CartPage";
import OrderSuccessPage from "../pages/customer/OrderSuccessPage";

import FarmsPage from "../pages/customer/FarmsPage";
import FarmDetailPage from "../pages/customer/FarmDetailPage";
import FarmApplicationPage from "../pages/customer/FarmApplicationPage";

import SellerDashboard from "../pages/seller/SellerDashboard";
import SellerProducts from "../pages/seller/SellerProducts";
import SellerOrders from "../pages/seller/SellerOrders";
import SellerHarvestLots from "../pages/seller/SellerHarvestLots";
import SellerFarmPage from "../pages/seller/SellerFarmPage";
import SellerReviews from "../pages/seller/SellerReviews";
import SellerRevenue from "../pages/seller/SellerRevenue";

import ProductsPage from "../pages/customer/ProductsPage";
import ProductDetailPage from "../pages/customer/ProductDetailPage";

import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminUsers from "../pages/admin/UsersPage";
import AdminCategories from "../pages/admin/CategoriesPage";
import AdminCertifications from "../pages/admin/CertificationsPage";
import AdminFarms from "../pages/admin/FarmsPage";
import AdminProductsPage from "../pages/admin/AdminProductsPage";
import AdminOrdersPage from "../pages/admin/AdminOrdersPage";
import AdminReports from "../pages/admin/ReportsPage";

import ProtectedRoute from "./ProtectedRoute";

function ComingSoon({ title }) {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-extrabold text-slate-900">{title}</h2>

      <p className="mt-2 text-slate-500">Trang này sẽ được phát triển sau.</p>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC / CUSTOMER */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />

        {/* AUTH */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* PUBLIC FARMS */}
        <Route path="/farms" element={<FarmsPage />} />
        <Route path="/farms/:slug" element={<FarmDetailPage />} />

        {/* PUBLIC PRODUCTS */}
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />

        {/* FARM APPLICATION */}
        <Route
          path="/seller/register"
          element={
            <ProtectedRoute>
              <FarmApplicationPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/order-success"
          element={
            <ProtectedRoute>
              <OrderSuccessPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* SELLER */}
      <Route
        path="/seller"
        element={
          <ProtectedRoute roles={["seller", "admin"]} requireSellerFarm>
            <SellerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<SellerDashboard />} />
        <Route path="products" element={<SellerProducts />} />
        <Route path="orders" element={<SellerOrders />} />
        <Route path="harvest-lots" element={<SellerHarvestLots />} />
        <Route path="reviews" element={<SellerReviews />} />
        <Route path="revenue" element={<SellerRevenue />} />
        <Route path="farm" element={<SellerFarmPage />} />

        <Route
          path="reports"
          element={<ComingSoon title="Báo cáo & Thống kê" />}
        />

        <Route
          path="settings"
          element={<ComingSoon title="Cài đặt gian hàng" />}
        />
      </Route>

      {/* ADMIN */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="farms" element={<AdminFarms />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="certifications" element={<AdminCertifications />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
