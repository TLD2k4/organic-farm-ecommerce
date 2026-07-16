import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import SellerLayout from "../layouts/SellerLayout";
import AdminLayout from "../layouts/AdminLayout";

import ProtectedRoute from "./ProtectedRoute";

const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const HomePage = lazy(() => import("../pages/customer/HomePage"));
const ProfilePage = lazy(() => import("../pages/customer/ProfilePage"));
const CheckoutPage = lazy(() => import("../pages/customer/CheckoutPage"));
const CartPage = lazy(() => import("../pages/customer/CartPage"));
const OrderSuccessPage = lazy(
  () => import("../pages/customer/OrderSuccessPage"),
);
const FarmsPage = lazy(() => import("../pages/customer/FarmsPage"));
const FarmDetailPage = lazy(() => import("../pages/customer/FarmDetailPage"));
const FarmApplicationPage = lazy(
  () => import("../pages/customer/FarmApplicationPage"),
);
const ProductsPage = lazy(() => import("../pages/customer/ProductsPage"));
const ProductDetailPage = lazy(
  () => import("../pages/customer/ProductDetailPage"),
);
const SellerPolicyPage = lazy(() => import("../pages/customer/SellerPolicyPage"));
const SellerDashboard = lazy(() => import("../pages/seller/SellerDashboard"));
const SellerProducts = lazy(() => import("../pages/seller/SellerProducts"));
const SellerOrders = lazy(() => import("../pages/seller/SellerOrders"));
const SellerHarvestLots = lazy(
  () => import("../pages/seller/SellerHarvestLots"),
);
const SellerFarmPage = lazy(() => import("../pages/seller/SellerFarmPage"));
const SellerReviews = lazy(() => import("../pages/seller/SellerReviews"));
const SellerRevenue = lazy(() => import("../pages/seller/SellerRevenue"));
const AdminDashboardPage = lazy(
  () => import("../pages/admin/AdminDashboardPage"),
);
const AdminUsers = lazy(() => import("../pages/admin/UsersPage"));
const AdminCategories = lazy(() => import("../pages/admin/CategoriesPage"));
const AdminCertifications = lazy(
  () => import("../pages/admin/CertificationsPage"),
);
const AdminFarms = lazy(() => import("../pages/admin/FarmsPage"));
const AdminProductsPage = lazy(
  () => import("../pages/admin/AdminProductsPage"),
);
const AdminOrdersPage = lazy(
  () => import("../pages/admin/AdminOrdersPage"),
);
const AdminReports = lazy(() => import("../pages/admin/ReportsPage"));
const AdminReviews = lazy(() => import("../pages/admin/ReviewsPage"));
const AdminSettings = lazy(() => import("../pages/admin/SettingsPage"));
const AdminSellerPolicies = lazy(() => import("../pages/admin/SellerPoliciesPage"));

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
    <Suspense fallback={<RouteSkeleton />}>
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
        <Route path="/seller-policy" element={<SellerPolicyPage />} />

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
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="seller-policies" element={<AdminSellerPolicies />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function RouteSkeleton() {
  return (
    <div className="min-h-96 space-y-4 p-4 sm:p-6" aria-busy="true">
      <div className="h-8 w-56 animate-pulse rounded-xl bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}
