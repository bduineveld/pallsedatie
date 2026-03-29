/**
 * Bolusdosis als deel van de 24-uursdosering: opties voor dropdown/autocomplete.
 * Standaard is altijd 1/6 van de 24-uursdosering; aanbevolen zijn delen tussen 1/10 en 1/6 (grenzen inclusief).
 */

export interface MorfineBolusFractionOption {
  /** Exacte bolus in mg (D / noemer) */
  bolusMg: number;
  /** Noemer n zodat bolus = D / n */
  denominator: number;
  /** Weergave van de breuk als leesbare tekst, bv. 1/12 */
  fractionDisplay: string;
  recommended: boolean;
  /** Standaardkeuze: 1/6 */
  isDefault: boolean;
  /** Volledige regel voor in de lijst, bv. "4mg (1/6, meest aanbevolen)" */
  listLabel: string;
}

const NL = "nl-NL";

/** Zichtbare boluswaarde voor formulier/PDF (komma als decimaalteken waar nodig). */
export function formatMorfineBolusMgString(mg: number): string {
  if (!Number.isFinite(mg) || mg < 0) {
    return "";
  }
  if (Math.abs(mg - Math.round(mg)) < 1e-9) {
    return String(Math.round(mg));
  }
  return new Intl.NumberFormat(NL, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(mg);
}

function fractionDisplayForDenominator(n: number): string {
  return `1/${n}`;
}

/** 1/10 ≤ 1/n ≤ 1/6 (dus 6 ≤ n ≤ 10). */
function isRecommendedDenominator(n: number): boolean {
  return n >= 6 && n <= 10;
}

/** Van kleinste bolus (1/24) tot 1/4 van D; grotere delen niet in de standaardlijst. */
const DENOMINATORS_DESC = [24, 12, 11, 10, 9, 8, 7, 6, 5, 4];

/**
 * Bouwt gesorteerde opties (oplopende bolus = aflopende noemer) voor gegeven 24-uursdosis D mg.
 */
export function buildMorfineBolusFractionOptions(continueMgPer24h: number): MorfineBolusFractionOption[] {
  if (!Number.isFinite(continueMgPer24h) || continueMgPer24h <= 0) {
    return [];
  }

  const D = continueMgPer24h;
  const options: MorfineBolusFractionOption[] = [];

  for (const n of DENOMINATORS_DESC) {
    const bolusMg = D / n;
    const recommended = isRecommendedDenominator(n);
    const isDefault = n === 6;
    const fractionDisplay = fractionDisplayForDenominator(n);
    const mgStr = formatMorfineBolusMgString(bolusMg);
    const suffix =
      n === 6 ? ", meest aanbevolen" : recommended ? ", aanbevolen" : "";
    const listLabel = `${mgStr}mg (${fractionDisplay}${suffix})`;

    options.push({
      bolusMg,
      denominator: n,
      fractionDisplay,
      recommended,
      isDefault,
      listLabel
    });
  }

  options.sort((a, b) => a.bolusMg - b.bolusMg);
  return options;
}

/** Parseert "4" / "4,2" / "2,4" naar getal. */
export function parseMorfineBolusMgInput(raw: string): number {
  const t = raw.trim().replace(",", ".");
  if (t === "") {
    return Number.NaN;
  }
  return Number.parseFloat(t);
}

/** Vergelijkbare weergave voor string-match (komma/punt). */
function normalizeBolusDisplayKey(raw: string): string {
  return raw.trim().replace(/\s/g, "").replace(/\./g, ",");
}

/**
 * Vindt optie bij ingevoerde bolus.
 * Eerst canonieke string: zelfde als {@link formatMorfineBolusMgString} (1 decimaal), want dat staat in het formulier na keuze uit de lijst.
 * Daarna numeriek op exacte bolusMg (handmatige invoer met meer cijfers).
 */
export function matchBolusOptionToInput(
  options: MorfineBolusFractionOption[],
  rawInput: string
): MorfineBolusFractionOption | undefined {
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
