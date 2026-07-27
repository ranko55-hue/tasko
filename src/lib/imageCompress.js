// דחיסת תמונה בצד לקוח: מקס 1600px, JPEG ~0.8, תיקון סיבוב EXIF.
export async function compressImage(file, maxDim = 1600, quality = 0.8) {
  // imageOrientation:'from-image' מיישר לפי EXIF
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const { width, height } = bitmap;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob = await new Promise((res) =>
    canvas.toBlob(res, 'image/jpeg', quality)
  );
  return blob;
}
