/**
 * Start- en stoptijd voor intermitterende midazolam via pomp (formulier + matching).
 */

export interface MidazolamIntermittentPumpTimingOption {
  token: string;
  listLabel: string;
  isDefault: boolean;
}

export const INTERMITTENT_PUMP_START_DEFAULT = "inslaaptijd";
export const INTERMITTENT_PUMP_STOP_DEFAULT = "2u voor gewenst ontwaken";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** 20:00 … 23:30 en 00:00, stappen van 30 minuten. */
export function buildEveningClockTokens(): string[] {
  const out: string[] = [];
  for (let h = 20; h <= 23; h += 1) {
    out.push(`${pad2(h)}:00`);
    out.push(`${pad2(h)}:30`);
  }
  out.push("00:00");
  return out;
}

/** 05:00 … 09:30 en 10:00, stappen van 30 minuten. */
export function buildMorningClockTokens(): string[] {
  const out: string[] = [];
  for (let h = 5; h <= 9; h += 1) {
    out.push(`${pad2(h)}:00`);
    out.push(`${pad2(h)}:30`);
  }
  out.push("10:00");
  return out;
}

export function buildIntermittentPumpStartTimingOptions(): MidazolamIntermittentPumpTimingOption[] {
  const special: MidazolamIntermittentPumpTimingOption = {
    token: INTERMITTENT_PUMP_START_DEFAULT,
    listLabel: INTERMITTENT_PUMP_START_DEFAULT,
    isDefault: true
  };
  const clocks = buildEveningClockTokens().map((token) => ({
    token,
    listLabel: token,
    isDefault: false
  }));
  return [special, ...clocks];
}

export function buildIntermittentPumpStopTimingOptions(): MidazolamIntermittentPumpTimingOption[] {
  const special: MidazolamIntermittentPumpTimingOption = {
    token: INTERMITTENT_PUMP_STOP_DEFAULT,
    listLabel: INTERMITTENT_PUMP_STOP_DEFAULT,
    isDefault: true
  };
  const clocks = buildMorningClockTokens().map((token) => ({
    token,
    listLabel: token,
    isDefault: false
  }));
  return [special, ...clocks];
}

function normKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function matchIntermittentPumpTimingOption(
  options: MidazolamIntermittentPumpTimingOption[],
  rawInput: string
): MidazolamIntermittentPumpTimingOption | undefined {
  const t = rawInput.trim();
  if (t === "") {
    return undefined;
  }
  const key = normKey(t);
  const byExact = options.find((o) => normKey(o.token) === key || normKey(o.listLabel) === key);
  if (byExact) {
    return byExact;
  }
  const hhmm = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (hhmm) {
    const h = Number(hhmm[1]);
    const m = Number(hhmm[2]);
    if (Number.isFinite(h) && Number.isFinite(m) && m >= 0 && m < 60) {
      const normalized = `${pad2(h)}:${pad2(m)}`;
      return options.find((o) => o.token === normalized);
    }
  }
  return undefined;
}

export function normalizeIntermittentPumpTimingStoredValue(
  raw: string,
  options: MidazolamIntermittentPumpTimingOption[]
): string {
  const t = raw.trim();
  if (t === "") {
    return "";
  }
  const matched = matchIntermittentPumpTimingOption(options, raw);
  if (matched) {
    return matched.token;
  }
  return t;
}
