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
    return null;
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
