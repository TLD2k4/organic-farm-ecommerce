const STORAGE_KEY = "organic_farm_ui_preferences";

export const defaultPreferences = {
  theme: "system",
  fontScale: 100,
  density: "comfortable",
};

export function getPreferences() {
  try {
    return {
      ...defaultPreferences,
      ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"),
    };
  } catch {
    return defaultPreferences;
  }
}

export function getResolvedTheme(preferences = getPreferences()) {
  const resolved = { ...defaultPreferences, ...preferences };
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  return resolved.theme === "dark" ||
    (resolved.theme === "system" && prefersDark)
    ? "dark"
    : "light";
}

export function applyPreferences(preferences) {
  const resolved = { ...defaultPreferences, ...preferences };
  const dark = getResolvedTheme(resolved) === "dark";

  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.classList.toggle(
    "density-compact",
    resolved.density === "compact",
  );
  document.documentElement.style.fontSize = `${Number(resolved.fontScale)}%`;
  document.documentElement.style.colorScheme = dark ? "dark" : "light";

  return resolved;
}

export function savePreferences(preferences) {
  const resolved = applyPreferences(preferences);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(resolved));
  window.dispatchEvent(
    new CustomEvent("preferences:updated", { detail: resolved }),
  );
  return resolved;
}
