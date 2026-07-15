// src/routes/ProtectedRoute.jsx

import { Navigate } from "react-router-dom";

import { useAuthStore } from "../store/authStore";

import { canAccessSellerDashboard } from "@/utils/farm";

export default function ProtectedRoute({
  children,
  roles = [],
  requireSellerFarm = false,
}) {
  const { token, user, initialLoading } = useAuthStore();

  if (initialLoading) {
    return (
      <div className="min-h-80 space-y-4 p-4 sm:p-6" aria-busy="true">
        <div className="h-8 w-52 animate-pulse rounded-xl bg-slate-200" />
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

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.some((role) => user.roles?.includes(role))) {
    return <Navigate to="/" replace />;
  }

  if (requireSellerFarm && !canAccessSellerDashboard(user)) {
    return <Navigate to="/seller/register" replace />;
  }

  return children;
}
