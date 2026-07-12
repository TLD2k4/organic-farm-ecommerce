// src\utils\image.js

export function getImageUrl(path) {
  if (!path) return null;

  return path.startsWith("http")
    ? path
    : `${import.meta.env.VITE_API_BASE_URL}/storage/${path}`;
}