/**
 * Vaste bolusopties voor midazolam (geen breuk t.o.v. 24u-dosis, zoals bij morfine).
 */

import { formatMorfineBolusMgString, parseMorfineBolusMgInput } from "./morfineBolusFractionOptions";

export interface MidazolamBolusFixedOption {
  bolusMg: number;
  listLabel: string;
  isDefault: boolean;
}

function normalizeBolusDisplayKey(raw: string): string {
  return raw.trim().replace(/\s/g, "").replace(/\./g, ",");
}

/**
 * Vaste lijst (oplopend mg); 5 mg is de richtlijn-default.
 */
export function buildMidazolamBolusFixedOptions(): MidazolamBolusFixedOption[] {
  return [
    { bolusMg: 1.5, listLabel: "1,5 mg", isDefault: false },
    { bolusMg: 2.5, listLabel: "2,5 mg", isDefault: false },
    { bolusMg: 3, listLabel: "3 mg", isDefault: false },
    { bolusMg: 4, listLabel: "4 mg", isDefault: false },
    { bolusMg: 5, listLabel: "5 mg (richtlijn)", isDefault: true },
    { bolusMg: 7.5, listLabel: "7,5 mg", isDefault: false },
    {
      bolusMg: 10,
      listLabel: "10 mg (vanaf 120 mg/24u = 5 mg/uur)",
      isDefault: false
    },
    { bolusMg: 12.5, listLabel: "12,5 mg", isDefault: false },
    {
      bolusMg: 15,
      listLabel: "15 mg (vanaf 240 mg/24u = 10 mg/uur)",
      isDefault: false
    }
  ];
}

export function matchMidazolamBolusOptionToInput(
  options: MidazolamBolusFixedOption[],
  rawInput: string
): MidazolamBolusFixedOption | undefined {
  const key = normalizeBolusDisplayKey(rawInput);
  if (key === "") {
    return undefined;
  }

  const byCanonicalString = options.find(
    (o) => normalizeBolusDisplayKey(formatMorfineBolusMgString(o.bolusMg)) === key
  );
  if (byCanonicalString) {
    return byCanonicalString;
  }

  const v = parseMorfineBolusMgInput(rawInput);
  if (!Number.isFinite(v)) {
    return undefined;
  }
  const tol = 1e-6;
  return options.find((o) => Math.abs(o.bolusMg - v) < tol);
}
