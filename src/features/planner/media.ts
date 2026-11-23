/** Decode an image File into a blob URL and natural dimensions. */
export function loadImageFile(file: File): Promise<{ url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ url, width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };
    img.src = url;
  });
}

/** Grab a still frame from a video File for use as a Reel cover. */
export function extractVideoFrame(file: File, timeSeconds = 0.1): Promise<{ blob: Blob; url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    const cleanup = () => URL.revokeObjectURL(url);

    video.onloadeddata = () => {
      const seek = Math.min(timeSeconds, Math.max(0, (video.duration || 1) - 0.05));
      video.currentTime = seek;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas unavailable");
        ctx.drawImage(video, 0, 0);
        canvas.toBlob(
          (blob) => {
            cleanup();
            if (!blob) {
              reject(new Error("Could not capture a frame."));
              return;
            }
            resolve({
              blob,
              url: URL.createObjectURL(blob),
              width: canvas.width,
              height: canvas.height,
            });
          },
          "image/jpeg",
          0.92,
        );
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Could not read that video."));
    };
  });
}

/** object-position for a 3:4 cover crop given a focal point in 0–1 space. */
export function focusToObjectPosition(focusX = 0.5, focusY = 0.5): string {
  return `${Math.round(focusX * 100)}% ${Math.round(focusY * 100)}%`;
}
