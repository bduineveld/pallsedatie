import { MorfineSuggestions, MorfineWarningItem } from "../../types/domain";

export interface MorfineGuidelineInput {
  advice75PercentMgPer24h: number;
  ageOver70: boolean;
  egfrUnder30: boolean;
}

const PALLIAWEB_NIER_RICHTLIJN =
  "https://palliaweb.nl/richtlijnen-palliatieve-zorg/richtlijn/pijn-bij-patienten-met-kanker/speciale-patientengroepen/patienten-met-nierfunctiestoornissen";

export function buildMorfineWarnings(input: MorfineGuidelineInput): MorfineWarningItem[] {
  const warnings: MorfineWarningItem[] = [];
  if (input.ageOver70) {
    warnings.push({
      kind: "bullet",
      text: "Patiënt >70 jaar: Overweeg lagere oplaaddosis dan advies en strakkere evaluatie."
    });
  }
  if (input.egfrUnder30) {
    warnings.push({
      kind: "block",
      html: `In verband met het risico op stapeling van morfine bij verminderde nierfunctie, heeft fentanyl de voorkeur als sterk opioïd. Indien desondanks wordt gekozen voor morfine in een pomp, wordt geadviseerd een lage continue dosering te hanteren, met voldoende mogelijkheid tot bolustoediening, zodat titratie op geleide van pijn en/of dyspnoe mogelijk is. Zie ook de <a href="${PALLIAWEB_NIER_RICHTLIJN}" target="_blank" rel="noopener noreferrer">richtlijntekst</a>.`
    });
  }
  return warnings;
}

export function suggestMorfineSettings(input: MorfineGuidelineInput): MorfineSuggestions {
  // Richtlijnonderdeel: 75% omzettingsadvies als veiliger startpunt bij opioïdrotatie (alleen continue dosis).
  const continueDoseMgPer24h = input.advice75PercentMgPer24h;
  const lockoutHours = input.ageOver70 || input.egfrUnder30 ? 6 : 4;

  return {
    continueDoseMgPer24h,
    lockoutHours,
    explanation:
      "Aanbevolen op basis van 75% morfine-equivalent per 24 uur. Bolusdosis kiest u afzonderlijk (standaardadvies 1/6 van de 24-uursdosering)."
  };
}
