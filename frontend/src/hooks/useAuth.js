// src\hooks\useAuth.js

import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function useAuth() {
  const navigate = useNavigate();

  const {
    user,
    token,
    loading,
    login,
    register,
    logout,
    logoutAll,
    getProfile,
    changePassword,
  } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleLogoutAll = async () => {
    await logoutAll();
    navigate("/login");
  };

  return {
    user,
    token,
    loading,

    isAuthenticated: !!token,

    login,
    register,

    logout: handleLogout,
    logoutAll: handleLogoutAll,

    getProfile,
    changePassword,
  };
}