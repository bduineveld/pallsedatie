import { MorfineSuggestions } from "../../types/domain";

export interface MorfineGuidelineInput {
  advice75PercentMgPer24h: number;
  ageOver70: boolean;
  egfrUnder30: boolean;
}

export function buildMorfineWarnings(input: MorfineGuidelineInput): string[] {
  const warnings: string[] = [];
  if (input.ageOver70) {
    warnings.push("Patiënt >70 jaar: Overweeg lagere startdosering dan advies en strakkere evaluatie.");
  }
  if (input.egfrUnder30) {
    warnings.push("Verminderde nierfunctie: monitor stapeling en bijwerkingen extra zorgvuldig.");
  }
  return warnings;
}

export function suggestMorfineSettings(input: MorfineGuidelineInput): MorfineSuggestions {
  // Richtlijnonderdeel: toon 75% omzettingsadvies als veiliger startpunt bij opioïdrotatie.
  const continueDoseMgPer24h = input.advice75PercentMgPer24h;

  // Lokale afleiding voor startwaarden in dit hulpmiddel:
  // - startbolus = 2x uurdosis
  // - bolus = 1x uurdosis
  // Deze regel is transparant en overschrijfbaar in UI.
  const continueDoseMgPerHour = continueDoseMgPer24h / 24;
  const startBolusMg = continueDoseMgPerHour * 2;
  const bolusMg = continueDoseMgPerHour;

  return {
    continueDoseMgPer24h,
    startBolusMg,
    bolusMg,
    lockoutHours: 0.33,
    explanation:
      "Aanbevolen op basis van 75% morfine-equivalent per 24 uur. Start-/bolusverhouding is lokale afleiding en blijft aanpasbaar."
  };
}
