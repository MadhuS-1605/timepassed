// Image helpers for Memory Marker: load a picked/captured file, downscale it
// (phones produce 4000px+ photos we don't need), and produce both a full-res
// blob for the share card and a tiny thumbnail dataURL for the timeline list.

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawScaled(img, maxDim) {
  const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(img, 0, 0, w, h);
  return canvas;
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      type,
      quality,
    );
  });
}

/**
 * Process a File from an <input type="file">.
 * Returns { blob, thumb, width, height }:
 *   - blob:  downscaled full-res JPEG (max 1440px) for the memory card
 *   - thumb: ~320px JPEG dataURL for the in-app timeline
 */
export async function processPhotoFile(file, { maxDim = 1440, thumbDim = 320 } = {}) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const fullCanvas = drawScaled(img, maxDim);
    const blob = await canvasToBlob(fullCanvas, "image/jpeg", 0.85);
    const thumbCanvas = drawScaled(img, thumbDim);
    const thumb = thumbCanvas.toDataURL("image/jpeg", 0.7);
    return { blob, thumb, width: fullCanvas.width, height: fullCanvas.height };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function blobToImage(blob) {
  const url = URL.createObjectURL(blob);
  try {
    return await loadImage(url);
  } finally {
    // revoke after a tick so the decoded image is retained
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
