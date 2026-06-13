/**
 * 업로드 이미지를 캔버스로 다운스케일·재인코딩해 blob 용량을 줄인다.
 * 큰 사진을 그대로 IndexedDB에 넣으면 저장공간이 빠르게 찬다.
 */

const MAX_EDGE = 1920;
const QUALITY = 0.85;

function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }
  // 폴백: <img> 디코딩.
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 읽을 수 없습니다."));
    };
    img.src = url;
  });
}

export async function downscaleImage(file: File): Promise<Blob> {
  const bitmap = await loadBitmap(file);
  const w = (bitmap as ImageBitmap).width;
  const h = (bitmap as ImageBitmap).height;

  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  const targetW = Math.round(w * scale);
  const targetH = Math.round(h * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지 처리를 초기화할 수 없습니다.");
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, targetW, targetH);
  if ("close" in bitmap) (bitmap as ImageBitmap).close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("이미지 변환에 실패했습니다."));
      },
      "image/webp",
      QUALITY
    );
  });
}
