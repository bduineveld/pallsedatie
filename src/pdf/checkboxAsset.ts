import checkboxSvgRaw from "./checkbox.svg?raw";

export interface CheckboxSvgData {
  viewBox: { minX: number; minY: number; width: number; height: number };
  pathD: string;
  fillHex: string;
  strokeHex: string;
  /** Stroke-width in dezelfde eenheden als het pad / viewBox */
  strokeWidth: number;
  /** Optioneel: gestreepte rand (SVG stroke-dasharray) */
  borderDashArray?: number[];
  borderDashPhase?: number;
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

function readStyleProperty(style: string | null, name: string): string | null {
  if (!style) {
    return null;
  }
  const entry = style
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.toLowerCase().startsWith(`${name}:`));
  if (!entry) {
    return null;
  }
  return (entry.split(":").slice(1).join(":") ?? "").trim();
}

function resolveElementFill(el: Element, fallback: string): string {
  const attr = normalizeHexColor(el.getAttribute("fill") ?? "");
  if (attr) {
    return attr;
  }
  const fromStyle = normalizeHexColor(readStyleProperty(el.getAttribute("style"), "fill") ?? "");
  return fromStyle ?? fallback;
}

function resolveElementStroke(el: Element, fallback: string): string {
  const attr = normalizeHexColor(el.getAttribute("stroke") ?? "");
  if (attr) {
    return attr;
  }
  const fromStyle = normalizeHexColor(readStyleProperty(el.getAttribute("style"), "stroke") ?? "");
  return fromStyle ?? fallback;
}

function resolveStrokeWidth(el: Element, fallback: number): number {
  const attr = el.getAttribute("stroke-width")?.trim();
  if (attr) {
    const n = Number.parseFloat(attr.replace(/px$/i, ""));
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
  }
  const fromStyle = readStyleProperty(el.getAttribute("style"), "stroke-width");
  if (fromStyle) {
    const n = Number.parseFloat(fromStyle.replace(/px$/i, ""));
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
  }
  return fallback;
}

function parseTranslateSum(transform: string | null): { tx: number; ty: number } {
  if (!transform) {
    return { tx: 0, ty: 0 };
  }
  let tx = 0;
  let ty = 0;
  const re = /translate\s*\(\s*([^,)]+)\s*(?:,\s*([^)]+))?\s*\)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(transform)) !== null) {
    tx += Number.parseFloat(m[1]);
    ty += m[2] !== undefined ? Number.parseFloat(m[2]) : 0;
  }
  return { tx, ty };
}

/** Zet lokale (x,y) van een element om naar root-SVG-coördinaten via parent-<g> translate(). */
function rootSvgXY(el: Element, localX: number, localY: number, svgRoot: Element): { x: number; y: number } {
  let x = localX;
  let y = localY;
  let node: Element | null = el.parentElement;
  while (node && node !== svgRoot) {
    const { tx, ty } = parseTranslateSum(node.getAttribute("transform"));
    x += tx;
    y += ty;
    node = node.parentElement;
  }
  return { x, y };
}

/** Afgeronde rechthoek in SVG-coördinaten (y naar beneden), compatibel met pdf-lib drawSvgPath. */
function roundedRectToPathD(x: number, y: number, w: number, h: number, rxIn: number, ryIn?: number): string {
  const r = Math.max(0, Math.min(rxIn, ryIn ?? rxIn, w / 2, h / 2));
  if (r <= 0) {
    return [`M ${x} ${y}`, `L ${x + w} ${y}`, `L ${x + w} ${y + h}`, `L ${x} ${y + h}`, "Z"].join(" ");
  }
  const c = r * 0.5522847498;
  return [
    `M ${x + r} ${y}`,
    `L ${x + w - r} ${y}`,
    `C ${x + w - r + c} ${y} ${x + w} ${y + r - c} ${x + w} ${y + r}`,
    `L ${x + w} ${y + h - r}`,
    `C ${x + w} ${y + h - r + c} ${x + w - r + c} ${y + h} ${x + w - r} ${y + h}`,
    `L ${x + r} ${y + h}`,
    `C ${x + r - c} ${y + h} ${x} ${y + h - r + c} ${x} ${y + h - r}`,
    `L ${x} ${y + r}`,
    `C ${x} ${y + r - c} ${x + r - c} ${y} ${x + r} ${y}`,
    "Z"
  ].join(" ");
}

function parseStrokeDashArray(el: Element): number[] | undefined {
  const fromStyle = readStyleProperty(el.getAttribute("style"), "stroke-dasharray");
  if (!fromStyle || fromStyle.toLowerCase() === "none") {
    return undefined;
  }
  const parts = fromStyle
    .split(/[\s,]+/)
    .map((s) => Number.parseFloat(s.trim()))
    .filter((n) => Number.isFinite(n) && n >= 0);
  return parts.length > 0 ? parts : undefined;
}

function parseStrokeDashOffset(el: Element): number | undefined {
  const fromStyle = readStyleProperty(el.getAttribute("style"), "stroke-dashoffset");
  if (!fromStyle) {
    return undefined;
  }
  const n = Number.parseFloat(fromStyle);
  return Number.isFinite(n) ? n : undefined;
}

function parseCheckboxSvg(svgText: string): CheckboxSvgData {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
  const svgRoot = svgDoc.documentElement;
  if (svgRoot.querySelector("parsererror")) {
    throw new Error("checkbox.svg kon niet worden geparsed.");
  }
  const viewBoxRaw = svgRoot.getAttribute("viewBox") ?? "";
  const parts = viewBoxRaw
    .trim()
    .split(/\s+/)
    .map((value) => Number(value));
  if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) {
    throw new Error("checkbox.svg heeft geen geldige viewBox.");
  }
  const [minX, minY, width, height] = parts;

  const pathElement = svgRoot.querySelector("path");
  const rectElement = svgRoot.querySelector("rect");

  let pathD: string;
  let styleSource: Element;

  if (pathElement) {
    pathD = pathElement.getAttribute("d")?.trim() ?? "";
    if (!pathD) {
      throw new Error("checkbox.svg <path> heeft geen d-attribuut.");
    }
    styleSource = pathElement;
  } else if (rectElement) {
    const rw = Number.parseFloat(rectElement.getAttribute("width") ?? "0");
    const rh = Number.parseFloat(rectElement.getAttribute("height") ?? "0");
    const lx = Number.parseFloat(rectElement.getAttribute("x") ?? "0");
    const ly = Number.parseFloat(rectElement.getAttribute("y") ?? "0");
    const rx = Number.parseFloat(rectElement.getAttribute("rx") ?? "0");
    const ryAttr = rectElement.getAttribute("ry");
    const ry = ryAttr != null ? Number.parseFloat(ryAttr) : rx;
    if (!Number.isFinite(rw) || !Number.isFinite(rh) || rw <= 0 || rh <= 0) {
      throw new Error("checkbox.svg <rect> heeft geen geldige width/height.");
    }
    const { x, y } = rootSvgXY(rectElement, lx, ly, svgRoot);
    pathD = roundedRectToPathD(x, y, rw, rh, Number.isFinite(rx) ? rx : 0, Number.isFinite(ry) ? ry : rx);
    styleSource = rectElement;
  } else {
    throw new Error("checkbox.svg bevat geen <path> of <rect>.");
  }

  const dash = parseStrokeDashArray(styleSource);
  const dashPhase = parseStrokeDashOffset(styleSource);

  return {
    viewBox: { minX, minY, width, height },
    pathD,
    fillHex: resolveElementFill(styleSource, "#f9fbff"),
    strokeHex: resolveElementStroke(styleSource, "#bfd1e8"),
    strokeWidth: resolveStrokeWidth(styleSource, 0.264583),
    ...(dash?.length ? { borderDashArray: dash, borderDashPhase: dashPhase ?? 0 } : {})
  };
}

/** Geparste checkbox-SVG (pad of afgeleid van <rect>, viewBox → schaal in PDF). */
export const checkboxSvgData: CheckboxSvgData = parseCheckboxSvg(checkboxSvgRaw);
