/**
 * Max. doses / 24 uur bij intermitterende morfine; "anders" = vrij geheel getal.
 */

export interface MaxDosesPer24Option {
  preset: number;
  label: string;
  isDefault: boolean;
}

const PRESET_COUNTS = [6, 8, 10, 12, 16, 20] as const;
const PRESET_SET = new Set<number>(PRESET_COUNTS);

export function buildMaxDosesPer24Options(): MaxDosesPer24Option[] {
  return PRESET_COUNTS.map((n) => ({
    preset: n,
    label: String(n),
    isDefault: n === 12
  }));
}

function normalizeKey(raw: string): string {
  return raw.trim().replace(/\s/g, "");
}

export function parseMaxDosesPer24Input(raw: string): number {
  const t = raw.trim().replace(",", ".");
  if (t === "") {
    return Number.NaN;
  }
  return Number.parseFloat(t);
}

export function matchMaxDosesPer24Preset(value: string): number | undefined {
  const t = normalizeKey(value);
  if (!/^\d+$/.test(t)) {
    return undefined;
  }
  const n = Number.parseInt(t, 10);
  return PRESET_SET.has(n) ? n : undefined;
}

export function isCustomMaxDosesPer24(value: string): boolean {
  const t = value.trim();
  if (t === "") {
    return false;
  }
  return matchMaxDosesPer24Preset(value) === undefined;
}
