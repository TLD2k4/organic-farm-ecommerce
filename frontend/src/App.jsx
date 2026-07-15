// src/App.jsx

import { BrowserRouter } from "react-router-dom";

import { Toaster } from "react-hot-toast";

import { useEffect } from "react";

import AppRoutes from "./routes/index.jsx";

import { useAuthStore } from "./store/authStore";
import { applyPreferences, getPreferences } from "./utils/preferences";
import NotificationCenter from "./components/common/NotificationCenter";
import ThemeToggle from "./components/common/ThemeToggle";

function App() {
  const token = useAuthStore((state) => state.token);

  const user = useAuthStore((state) => state.user);

  const getProfile = useAuthStore((state) => state.getProfile);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => applyPreferences(getPreferences());

    apply();
    media.addEventListener("change", apply);

    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (token && !user) {
      getProfile().catch((error) => {
        console.error("LOAD PROFILE ERROR:", error);
      });
    }
  }, [token, user, getProfile]);

  return (
    <BrowserRouter>
      <AppRoutes />
      <ThemeToggle />
      <NotificationCenter />

      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 2500,

          style: {
            fontWeight: 700,
            fontSize: "14px",
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
