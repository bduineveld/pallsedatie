let logoPngBytesPromise: Promise<Uint8Array> | null = null;

async function svgToPngBytes(svgText: string, width = 600, height = 180): Promise<Uint8Array> {
  const blob = new Blob([svgText], { type: "image/svg+xml" });
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Kon pallsedatie-logo.svg niet laden."));
      img.src = objectUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Kon canvascontext niet initialiseren voor logo.");
    }
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1] ?? "";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function getPallsedatieLogoPngBytes(): Promise<Uint8Array> {
  if (!logoPngBytesPromise) {
    logoPngBytesPromise = (async () => {
      const response = await fetch("/pallsedatie-logo.svg");
      if (!response.ok) {
        throw new Error("Kon pallsedatie-logo.svg niet ophalen.");
      }
      const svgText = await response.text();
      return svgToPngBytes(svgText);
    })();
  }
  return logoPngBytesPromise;
}
