/**
 * Onderhoud (mg/uur) bij intermitterende midazolam via pomp — vaste range 0,5–2,5 mg/uur.
 */

export interface MidazolamIntermittentPumpMaintenanceOption {
  mgPerHour: number;
  /** Opgeslagen in formulier (bijv. "1,5"). */
  inputToken: string;
  /** Weergave in het uitklapmenu. */
  listLabel: string;
  isDefault: boolean;
}

const PRESET_MG_PER_HOUR = [0.5, 1, 1.5, 2, 2.5] as const;

const NL = "nl-NL";

export function formatIntermittentPumpMaintenanceInputToken(mgPerHour: number): string {
  if (!Number.isFinite(mgPerHour) || mgPerHour < 0) {
    return "";
  }
  return new Intl.NumberFormat(NL, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(mgPerHour);
}

export function buildMidazolamIntermittentPumpMaintenanceOptions(): MidazolamIntermittentPumpMaintenanceOption[] {
  return PRESET_MG_PER_HOUR.map((mgPerHour) => ({
    mgPerHour,
    inputToken: formatIntermittentPumpMaintenanceInputToken(mgPerHour),
    listLabel: `${formatIntermittentPumpMaintenanceInputToken(mgPerHour)} mg/uur`,
    isDefault: mgPerHour === 1.5
  }));
}

function normalizeMaintenanceKey(raw: string): string {
  return raw.trim().replace(/\s/g, "").replace(/\./g, ",");
}

export function parseIntermittentPumpMaintenanceMgPerHour(raw: string): number {
  const t = raw.trim().replace(",", ".");
  if (t === "") {
    return Number.NaN;
  }
  return Number.parseFloat(t);
}

export function matchIntermittentPumpMaintenanceOption(
  options: MidazolamIntermittentPumpMaintenanceOption[],
  rawInput: string
): MidazolamIntermittentPumpMaintenanceOption | undefined {
  const key = normalizeMaintenanceKey(rawInput);
  if (key === "") {
    return undefined;
  }
  const byToken = options.find((o) => normalizeMaintenanceKey(o.inputToken) === key);
  if (byToken) {
    return byToken;
  }
  const byList = options.find((o) => normalizeMaintenanceKey(o.listLabel) === key);
  if (byList) {
    return byList;
  }
  const v = parseIntermittentPumpMaintenanceMgPerHour(rawInput);
  if (!Number.isFinite(v)) {
    return undefined;
  }
  const tol = 1e-6;
  return options.find((o) => Math.abs(o.mgPerHour - v) < tol);
}

export function normalizeIntermittentPumpMaintenanceStoredValue(
  raw: string,
  options: MidazolamIntermittentPumpMaintenanceOption[]
): string {
  const t = raw.trim();
  if (t === "") {
    return "";
  }
  const matched = matchIntermittentPumpMaintenanceOption(options, raw);
  if (matched) {
    return matched.inputToken;
  }
  const v = parseIntermittentPumpMaintenanceMgPerHour(raw);
  if (Number.isFinite(v) && v >= 0) {
    return formatIntermittentPumpMaintenanceInputToken(v);
  }
  return t;
}
