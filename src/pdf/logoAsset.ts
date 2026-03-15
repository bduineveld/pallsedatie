let logoPngBytesPromise: Promise<Uint8Array> | null = null;
let logoSvgPathsPromise: Promise<LogoSvgData> | null = null;

interface LogoSvgPath {
  d: string;
  fillHex: string;
}

interface LogoSvgData {
  viewBox: { minX: number; minY: number; width: number; height: number };
  paths: LogoSvgPath[];
}

function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed === "none" || trimmed === "transparent") {
    return null;
  }
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    const [r, g, b] = trimmed.slice(1).split("");
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

function readFillFromStyle(style: string | null): string | null {
  if (!style) {
    return null;
  }
  const fillEntry = style
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("fill:"));
  if (!fillEntry) {
    return null;
  }
  const value = fillEntry.split(":")[1] ?? "";
  return normalizeHexColor(value);
}

function resolvePathFill(pathElement: Element, fallback = "#1f2a44"): string {
  let current: Element | null = pathElement;
  while (current) {
    const directFill = normalizeHexColor(current.getAttribute("fill") ?? "");
    if (directFill) {
      return directFill;
    }
    const styleFill = readFillFromStyle(current.getAttribute("style"));
    if (styleFill) {
      return styleFill;
    }
    current = current.parentElement;
  }
  return fallback;
}

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

export async function getPallsedatieLogoSvgData(): Promise<LogoSvgData> {
  if (!logoSvgPathsPromise) {
    logoSvgPathsPromise = (async () => {
      const response = await fetch("/pallsedatie-logo.svg");
      if (!response.ok) {
        throw new Error("Kon pallsedatie-logo.svg niet ophalen.");
      }
      const svgText = await response.text();
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
      const svgRoot = svgDoc.documentElement;
      const viewBoxRaw = svgRoot.getAttribute("viewBox") ?? "";
      const parts = viewBoxRaw
        .trim()
        .split(/\s+/)
        .map((value) => Number(value));
      if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) {
        throw new Error("pallsedatie-logo.svg heeft geen geldige viewBox.");
      }
      const [minX, minY, width, height] = parts;
      const pathElements = Array.from(svgRoot.querySelectorAll("path"));
      const paths = pathElements
        .map((pathElement) => {
          const d = pathElement.getAttribute("d")?.trim() ?? "";
          if (!d) {
            return null;
          }
          return {
            d,
            fillHex: resolvePathFill(pathElement)
          };
        })
        .filter((path): path is LogoSvgPath => path !== null);
      if (paths.length === 0) {
        throw new Error("pallsedatie-logo.svg bevat geen tekenbare paden.");
      }
      return { viewBox: { minX, minY, width, height }, paths };
    })();
  }
  return logoSvgPathsPromise;
}
