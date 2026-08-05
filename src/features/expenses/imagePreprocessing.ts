// Real phone camera photos carry EXIF orientation metadata and very high
// resolution. The <img> preview respects EXIF for display (so the receipt
// looks right-side-up on screen), but OCR engines commonly read the raw,
// still-rotated pixel grid underneath — so Tesseract can end up reading a
// sideways or upside-down receipt even though the preview looks correct,
// producing garbled text with no recognizable vendor/amount/date. Re-render
// through a canvas (which does respect EXIF via `imageOrientation`) so OCR
// sees the same correctly-oriented image the user sees. Downscaling also
// keeps Tesseract fast on mobile and, empirically, more accurate — very
// large images don't help OCR quality.
const MAX_DIMENSION = 2000;

export async function normalizeImageForOcr(image: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(image, {
    imageOrientation: "from-image",
  });

  try {
    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      return image;
    }
    context.drawImage(bitmap, 0, 0, width, height);

    const normalized = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );
    return normalized ?? image;
  } finally {
    bitmap.close();
  }
}
