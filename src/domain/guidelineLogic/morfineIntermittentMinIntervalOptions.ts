/**
 * Minimaal interval tussen doses (uur) bij intermitterende morfine-injecties;
 * "anders" = vrij getal.
 */

export interface IntermittentMinIntervalOption {
  hours: number;
  label: string;
  isDefault: boolean;
}

const NL = "nl-NL";

const PRESET_HOURS = [0.5, 1, 2, 3, 4] as const;

export function formatIntermittentIntervalHoursString(h: number): string {
  if (!Number.isFinite(h) || h < 0) {
    return "";
  }
  if (Math.abs(h - Math.round(h)) < 1e-9) {
    return String(Math.round(h));
  }
  return new Intl.NumberFormat(NL, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(h);
}

export function buildIntermittentMinIntervalOptions(): IntermittentMinIntervalOption[] {
  return PRESET_HOURS.map((hours) => ({
    hours,
    label: formatIntermittentIntervalHoursString(hours),
    isDefault: hours === 2
  }));
}

function normalizeDisplayKey(raw: string): string {
  return raw.trim().replace(/\s/g, "").replace(/\./g, ",");
}

export function parseIntermittentIntervalHoursInput(raw: string): number {
  const t = raw.trim().replace(",", ".");
  if (t === "") {
    return Number.NaN;
  }
  return Number.parseFloat(t);
}

export function matchIntermittentIntervalToPreset(
  options: IntermittentMinIntervalOption[],
  rawInput: string
): IntermittentMinIntervalOption | undefined {
  const key = normalizeDisplayKey(rawInput);
  if (key === "") {
    return undefined;
  }
  const byLabel = options.find((o) => normalizeDisplayKey(o.label) === key);
  if (byLabel) {
    return byLabel;
  }
  const v = parseIntermittentIntervalHoursInput(rawInput);
  if (!Number.isFinite(v)) {
    return undefined;
  }
  const tol = 1e-6;
  return options.find((o) => Math.abs(o.hours - v) < tol);
}
