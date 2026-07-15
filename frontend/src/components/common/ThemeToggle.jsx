import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import {
  getPreferences,
  getResolvedTheme,
  savePreferences,
} from "../../utils/preferences";
import DraggableFloatingButton from "./DraggableFloatingButton";

export default function ThemeToggle() {
  const [preferences, setPreferences] = useState(() => getPreferences());
  const resolvedTheme = getResolvedTheme(preferences);
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncPreferences = (event) => {
      setPreferences(event?.detail || getPreferences());
    };
    const syncSystemTheme = () => setPreferences(getPreferences());

    window.addEventListener("preferences:updated", syncPreferences);
    window.addEventListener("storage", syncPreferences);
    media.addEventListener("change", syncSystemTheme);

    return () => {
      window.removeEventListener("preferences:updated", syncPreferences);
      window.removeEventListener("storage", syncPreferences);
      media.removeEventListener("change", syncSystemTheme);
    };
  }, []);

  const toggleTheme = () => {
    const next = savePreferences({
      ...getPreferences(),
      theme: isDark ? "light" : "dark",
    });

    setPreferences(next);
  };

  const label = isDark
    ? "Chuyển sang giao diện sáng"
    : "Chuyển sang giao diện tối";

  return (
    <DraggableFloatingButton
      storageKey="organic_farm_theme_button_position_v2"
      defaultSide="left"
      size={44}
      onClick={toggleTheme}
      aria-label={label}
      title={`${label} · Kéo để đổi vị trí`}
      className="z-90 grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:scale-105 hover:border-green-300 hover:text-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 dark:border-slate-700 dark:bg-slate-900 dark:text-amber-300"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </DraggableFloatingButton>
  );
}
