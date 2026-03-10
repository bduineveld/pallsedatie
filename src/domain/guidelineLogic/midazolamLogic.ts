import { MidazolamSuggestions } from "../../types/domain";

export interface MidazolamGuidelineInput {
  currentContinueDoseMgPer24h?: number;
}

export function suggestMidazolamSettings(input: MidazolamGuidelineInput): MidazolamSuggestions {
  // TODO medisch review: onderstaande waarden zijn als expliciete startdefaults opgenomen
  // totdat lokale implementatie 1-op-1 met de volledige richtlijntekst gevalideerd is.
  // Ze blijven volledig aanpasbaar in de UI en worden als suggestie gelabeld.
  const continueDoseMgPer24h = input.currentContinueDoseMgPer24h ?? 48;
  const loadingDoseMg = 10;

  // Geen generieke 1/6-regel toegepast.
  // Lokale, expliciete keuze: bolus 2.5 mg als startadvies, lockout 20 min.
  return {
    loadingDoseMg,
    continueDoseMgPer24h,
    bolusMg: 2.5,
    lockoutHours: 1,
    explanation:
      "Suggestie gebaseerd op Pallialine/Palliaweb sedatiekader met lokale startdefaults; bolusregel is expliciet en niet gebaseerd op een generieke 1/6-formule."
  };
}
