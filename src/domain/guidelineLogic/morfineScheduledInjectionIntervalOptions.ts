/**
 * Geplande injectie-interval (uur) bij intermitterende morfine; "anders" = vrij urengetal.
 */

export interface ScheduledInjectionIntervalOption {
  hours: number;
  displayLine: string;
  /** Visueel benadrukken in het menu (richtlijn: 4 en 6 uur). */
  emphasized: boolean;
  /** Bij lege focus: scroll naar deze optie (richtlijn 4 uur). */
  isDefaultScroll: boolean;
}

const PRESETS: Omit<ScheduledInjectionIntervalOption, "isDefaultScroll">[] = [
  { hours: 2, displayLine: "2 uur (12x/dag)", emphasized: false },
  { hours: 3, displayLine: "3 uur (8x/dag)", emphasized: false },
  { hours: 4, displayLine: "4 uur (6x/dag)", emphasized: true },
  { hours: 6, displayLine: "6 uur (4x/dag)", emphasized: true },
  { hours: 8, displayLine: "8 uur (3x/dag)", emphasized: false },
  { hours: 12, displayLine: "12 uur (2x/dag)", emphasized: false }
];

const BUILT_OPTIONS: ScheduledInjectionIntervalOption[] = PRESETS.map((p) => ({
  ...p,
  isDefaultScroll: p.hours === 4
}));

export function buildScheduledInjectionIntervalOptions(): ScheduledInjectionIntervalOption[] {
  return BUILT_OPTIONS;
}

export function parseHoursFromStoredValue(raw: string): number {
  const t = raw.trim().replace(",", ".");
  if (t === "") {
    return Number.NaN;
  }
  return Number.parseFloat(t);
}

export function findPresetByHours(hours: number): ScheduledInjectionIntervalOption | undefined {
  if (!Number.isFinite(hours)) {
    return undefined;
  }
  return BUILT_OPTIONS.find((o) => Math.abs(o.hours - hours) < 1e-6);
}

/** Weergave in het ingeklapte veld: alleen urengetal; volledige «uur (…x/dag)» alleen in het menu. */
export function formatScheduledIntervalInputDisplay(storedHours: string): string {
  const t = storedHours.trim();
  if (t === "") {
    return "";
  }
  const n = parseHoursFromStoredValue(t);
  if (!Number.isFinite(n) || n <= 0) {
    return storedHours;
  }
  const preset = findPresetByHours(n);
  if (preset) {
    return String(preset.hours);
  }
  return formatCustomHoursDisplay(n);
}

function formatCustomHoursDisplay(h: number): string {
  if (Math.abs(h - Math.round(h)) < 1e-9) {
    return String(Math.round(h));
  }
  return new Intl.NumberFormat("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(h);
}

function normalizeKey(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Na blur: bewaar alleen uren als string (compatibel met PDF/advies). */
export function normalizeScheduledIntervalInputToStored(raw: string): string {
  const t = raw.trim();
  if (t === "") {
    return "";
  }
  const key = normalizeKey(t);
  const byLine = BUILT_OPTIONS.find((o) => normalizeKey(o.displayLine) === key);
  if (byLine) {
    return String(byLine.hours);
  }
  const n = parseHoursFromStoredValue(t);
  if (Number.isFinite(n) && n > 0) {
    const preset = findPresetByHours(n);
    if (preset) {
      return String(preset.hours);
    }
    if (Math.abs(n - Math.round(n)) < 1e-9) {
      return String(Math.round(n));
    }
    return String(n);
  }
  return "";
}

export function matchPresetFromStored(stored: string): ScheduledInjectionIntervalOption | undefined {
  const n = parseHoursFromStoredValue(stored);
  if (!Number.isFinite(n)) {
    return undefined;
  }
  return findPresetByHours(n);
}
