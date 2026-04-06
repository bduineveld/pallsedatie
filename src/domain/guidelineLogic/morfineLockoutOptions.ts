/**
 * Vaste lockout-opties (uur) voor morfine-pomp / intermitterend; vrije invoer blijft mogelijk.
 */

export interface LockoutHourOption {
  hours: number;
  label: string;
  isDefault: boolean;
}

const NL = "nl-NL";

const LOCKOUT_PRESET_HOURS = [0.5, 1, 2, 4, 6] as const;

export function formatLockoutHoursString(h: number): string {
  if (!Number.isFinite(h) || h < 0) {
    return "";
  }
  if (Math.abs(h - Math.round(h)) < 1e-9) {
    return String(Math.round(h));
  }
  return new Intl.NumberFormat(NL, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(h);
}

export function buildLockoutHourOptions(): LockoutHourOption[] {
  return LOCKOUT_PRESET_HOURS.map((hours) => ({
    hours,
    label: formatLockoutHoursString(hours),
    isDefault: hours === 2
  }));
}

function normalizeLockoutDisplayKey(raw: string): string {
  return raw.trim().replace(/\s/g, "").replace(/\./g, ",");
}

export function parseLockoutHoursInput(raw: string): number {
  const t = raw.trim().replace(",", ".");
  if (t === "") {
    return Number.NaN;
  }
  return Number.parseFloat(t);
}

export function matchLockoutToPresetOption(
  options: LockoutHourOption[],
  rawInput: string
): LockoutHourOption | undefined {
  const key = normalizeLockoutDisplayKey(rawInput);
  if (key === "") {
    return undefined;
  }
  const byLabel = options.find((o) => normalizeLockoutDisplayKey(o.label) === key);
  if (byLabel) {
    return byLabel;
  }
  const v = parseLockoutHoursInput(rawInput);
  if (!Number.isFinite(v)) {
    return undefined;
  }
  const tol = 1e-6;
  return options.find((o) => Math.abs(o.hours - v) < tol);
}
