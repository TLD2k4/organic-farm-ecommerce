// src\utils\image.js

export function getImageUrl(path) {
  if (!path) return null;

  return path.startsWith("http")
    ? path
    : `http://localhost:8000/storage/${path}`;
}