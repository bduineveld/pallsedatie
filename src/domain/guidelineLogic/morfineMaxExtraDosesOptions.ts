/**
 * Vaste opties voor max. extra doses / 24 uur (morfine); "anders" = vrij getal.
 */

export interface MaxExtraDoseOption {
  preset: number;
  label: string;
  isDefault: boolean;
}

const PRESET_COUNTS = [4, 6, 8, 10, 12] as const;
const PRESET_SET = new Set<number>(PRESET_COUNTS);

export function buildMaxExtraDoseOptions(): MaxExtraDoseOption[] {
  return PRESET_COUNTS.map((n) => ({
    preset: n,
    label: String(n),
    isDefault: n === 6
  }));
}

function normalizeKey(raw: string): string {
  return raw.trim().replace(/\s/g, "");
}

export function parseMaxExtraDosesInput(raw: string): number {
  const t = raw.trim().replace(",", ".");
  if (t === "") {
    return Number.NaN;
  }
  return Number.parseFloat(t);
}

/** Exacte preset (4/6/8/10/12) als de invoer alleen dat geheel getal is. */
export function matchMaxExtraPreset(value: string): number | undefined {
  const t = normalizeKey(value);
  if (!/^\d+$/.test(t)) {
    return undefined;
  }
  const n = Number.parseInt(t, 10);
  return PRESET_SET.has(n) ? n : undefined;
}

export function isCustomMaxExtraDose(value: string): boolean {
  const t = value.trim();
  if (t === "") {
    return false;
  }
  return matchMaxExtraPreset(value) === undefined;
}
