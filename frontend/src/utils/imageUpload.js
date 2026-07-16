const IMAGE_PROFILES = {
  user_avatar: { maxDimension: 1200, quality: 0.84 },
  farm_logo: { maxDimension: 1400, quality: 0.86 },
  farm_cover: { maxDimension: 2048, quality: 0.86 },
  product_thumbnail: { maxDimension: 1600, quality: 0.84 },
  product_detail: { maxDimension: 2048, quality: 0.86 },
  category_image: { maxDimension: 1600, quality: 0.84 },
  certificate_file: { maxDimension: 2560, quality: 0.9 },
  register_avatar: { maxDimension: 1200, quality: 0.84 },
};

export async function optimizeImageForUpload(file, type) {
  if (
    !(file instanceof File) ||
    !file.type.startsWith("image/") ||
    ["image/gif", "image/svg+xml"].includes(file.type) ||
    file.size <= 350 * 1024 ||
    typeof createImageBitmap !== "function"
  ) {
    return file;
  }

  try {
    const profile = IMAGE_PROFILES[type] || {
      maxDimension: 1920,
      quality: 0.85,
    };
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    const scale = Math.min(
      1,
      profile.maxDimension / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", { alpha: true });
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/webp", profile.quality);
    });

    if (!blob || blob.size >= file.size) {
      return file;
    }

    const fileName = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${fileName}.webp`, {
      type: blob.type,
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}
