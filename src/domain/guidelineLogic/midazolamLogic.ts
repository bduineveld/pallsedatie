import { MidazolamSuggestions } from "../../types/domain";

export interface MidazolamGuidelineInput {
  currentContinueDoseMgPer24h?: number;
  ageOver60?: boolean;
  weightUnder60Kg?: boolean;
  severeRenalOrHepaticImpairment?: boolean;
  cyp3aInhibitorComedication?: boolean;
  lowSerumAlbumin?: boolean;
  valproicAcidUse?: boolean;
  severeDelirium?: boolean;
  rapidMetabolism?: boolean;
  smoking?: boolean;
  longTermBenzodiazepineTolerance?: boolean;
  cyp3aInducerComedication?: boolean;
}

export interface MidazolamAdviceOption {
  buttonLabel: string;
  loadingDoseMg: number;
  continueDoseMgPer24h: number;
  bolusMg: number;
  lockoutHours: number;
}

export interface MidazolamAdviceBlock {
  id: "base" | "lower" | "higher" | "special_lower";
  heading: string;
  adviceLine: string;
  options: [MidazolamAdviceOption, MidazolamAdviceOption];
}

export interface MidazolamAdviceSummary {
  hasAnyRiskFactor: boolean;
  isMixedRisk: boolean;
  /** Standaard indicatie lagere dosering (v.l.n.r. in UI). */
  selectedStandardLowerFactors: string[];
  /** Albumine / valproïnezuur (ander doseeradvies). */
  selectedSpecialLowerFactors: string[];
  /** Alle lagere factoren (standaard + speciaal), voor gemengde waarschuwing. */
  selectedLowerFactors: string[];
  selectedHigherFactors: string[];
  combinedSelectionLine: string;
  blocks: MidazolamAdviceBlock[];
}

const standardLowerFactorDefinitions: Array<{
  label: string;
  isChecked: (input: MidazolamGuidelineInput) => boolean;
}> = [
  { label: "Leeftijd >60 jaar", isChecked: (input) => Boolean(input.ageOver60) },
  { label: "Gewicht <60 kg", isChecked: (input) => Boolean(input.weightUnder60Kg) },
  {
    label: "Ernstige nier- of leverfunctiestoornissen",
    isChecked: (input) => Boolean(input.severeRenalOrHepaticImpairment)
  },
  {
    label: "Comedicatie met CYP3A remmend effect",
    isChecked: (input) => Boolean(input.cyp3aInhibitorComedication)
  }
];

const specialLowerFactorDefinitions: Array<{
  label: string;
  isChecked: (input: MidazolamGuidelineInput) => boolean;
}> = [
  { label: "Sterk verlaagd serumalbumine", isChecked: (input) => Boolean(input.lowSerumAlbumin) },
  { label: "Gelijktijdig gebruik valproïnezuur", isChecked: (input) => Boolean(input.valproicAcidUse) }
];

const higherFactorDefinitions: Array<{
  label: string;
  isChecked: (input: MidazolamGuidelineInput) => boolean;
}> = [
  { label: "Ernstig delier", isChecked: (input) => Boolean(input.severeDelirium) },
  { label: "Snelle metabolisering", isChecked: (input) => Boolean(input.rapidMetabolism) },
  { label: "Roken", isChecked: (input) => Boolean(input.smoking) },
  {
    label: "Eerder langdurig benzodiazepine gebruik met tolerantie als gevolg",
    isChecked: (input) => Boolean(input.longTermBenzodiazepineTolerance)
  },
  {
    label: "Comedicatie met CYP3A inducerend effect",
    isChecked: (input) => Boolean(input.cyp3aInducerComedication)
  }
];

/** Continue/bolus/lockout voor UI-knoppen (albumine / valproïnezuur), zelfde als `specialLowerBlock`. */
export const MIDAZOLAM_SPECIAL_LOWER_PRESET_MILD: MidazolamAdviceOption = {
  buttonLabel: "Lagere dosering (1,5 → 1,0 mg/uur), korter bolus-interval (2 → 1 uur)",
  loadingDoseMg: 3,
  continueDoseMgPer24h: 24,
  bolusMg: 3,
  lockoutHours: 1
};

export const MIDAZOLAM_SPECIAL_LOWER_PRESET_STRONG: MidazolamAdviceOption = {
  buttonLabel: "Lagere dosering (1,5 → 0,5 mg/uur), korter bolus-interval (2 → 0,5 uur)",
  loadingDoseMg: 2.5,
  continueDoseMgPer24h: 12,
  bolusMg: 2.5,
  lockoutHours: 0.5
};

function joinWithEn(items: string[]): string {
  if (items.length === 0) {
    return "";
  }
  if (items.length === 1) {
    return items[0];
  }
  if (items.length === 2) {
    return `${items[0]} en ${items[1]}`;
  }
  return `${items.slice(0, -1).join(", ")} en ${items[items.length - 1]}`;
}

export function buildMidazolamAdviceSummary(input: MidazolamGuidelineInput): MidazolamAdviceSummary {
  const selectedStandardLowerFactors = standardLowerFactorDefinitions
    .filter((definition) => definition.isChecked(input))
    .map((definition) => definition.label);
  const selectedSpecialLowerFactors = specialLowerFactorDefinitions
    .filter((definition) => definition.isChecked(input))
    .map((definition) => definition.label);
  const selectedHigherFactors = higherFactorDefinitions
    .filter((definition) => definition.isChecked(input))
    .map((definition) => definition.label);

  const selectedLowerFactors = [...selectedStandardLowerFactors, ...selectedSpecialLowerFactors];

  const hasStandardLower = selectedStandardLowerFactors.length > 0;
  const hasSpecialLower = selectedSpecialLowerFactors.length > 0;
  const hasLowerFactors = hasStandardLower || hasSpecialLower;
  const hasHigherFactors = selectedHigherFactors.length > 0;
  const hasAnyRiskFactor = hasLowerFactors || hasHigherFactors;
  const isMixedRisk = hasLowerFactors && hasHigherFactors;

  const combinedSelectionLine = !hasAnyRiskFactor
    ? "Geen risicofactoren."
    : isMixedRisk
      ? `${joinWithEn(selectedLowerFactors)}, maar tevens ${joinWithEn(selectedHigherFactors)}. Op basis van klinische inschatting zelf een afweging maken en extra evalueren. Men kan desgewenst ook met een palliatief team of consulent palliatieve zorg overleggen.`
      : `${joinWithEn(hasLowerFactors ? selectedLowerFactors : selectedHigherFactors)}.`;

  const baseBlock: MidazolamAdviceBlock = {
    id: "base",
    heading: "Geen risicofactoren",
    adviceLine: "Advies: Oplaaddosis 5-10mg, continue dosis 36mg/24u, bolus 5mg, lockout 2uur.",
    options: [
      {
        buttonLabel: "Advies overnemen laag (5mg oplaad)",
        loadingDoseMg: 5,
        continueDoseMgPer24h: 36,
        bolusMg: 5,
        lockoutHours: 2
      },
      {
        buttonLabel: "Advies overnemen hoog (10mg oplaad)",
        loadingDoseMg: 10,
        continueDoseMgPer24h: 36,
        bolusMg: 5,
        lockoutHours: 2
      }
    ]
  };

  const lowerBlock: MidazolamAdviceBlock = {
    id: "lower",
    heading: "Advies bij indicatie lagere dosering",
    adviceLine: "Advies: Oplaaddosis 5mg, continue dosis 12-24mg/24u, bolus 5mg, lockout 2uur.",
    options: [
      {
        buttonLabel: "Advies overnemen laag (12mg/24u)",
        loadingDoseMg: 5,
        continueDoseMgPer24h: 12,
        bolusMg: 5,
        lockoutHours: 2
      },
      {
        buttonLabel: "Advies overnemen hoog (24mg/24u)",
        loadingDoseMg: 5,
        continueDoseMgPer24h: 24,
        bolusMg: 5,
        lockoutHours: 2
      }
    ]
  };

  const specialLowerBlock: MidazolamAdviceBlock = {
    id: "special_lower",
    heading: "Advies bij albumine / valproïnezuur",
    adviceLine: "Lagere onderhoudsdosering, lagere bolus, korter bolus-interval.",
    options: [MIDAZOLAM_SPECIAL_LOWER_PRESET_MILD, MIDAZOLAM_SPECIAL_LOWER_PRESET_STRONG]
  };

  const higherBlock: MidazolamAdviceBlock = {
    id: "higher",
    heading: "Advies bij indicatie hogere dosering",
    adviceLine: "Advies: Oplaaddosis 10mg, continue dosis 48-60mg/24u, bolus 10mg, lockout 2uur.",
    options: [
      {
        buttonLabel: "Advies overnemen laag (48mg/24u)",
        loadingDoseMg: 10,
        continueDoseMgPer24h: 48,
        bolusMg: 10,
        lockoutHours: 2
      },
      {
        buttonLabel: "Advies overnemen hoog (60mg/24u)",
        loadingDoseMg: 10,
        continueDoseMgPer24h: 60,
        bolusMg: 10,
        lockoutHours: 2
      }
    ]
  };

  const blocks: MidazolamAdviceBlock[] = [];
  if (!hasAnyRiskFactor) {
    blocks.push(baseBlock);
  } else if (isMixedRisk) {
    if (hasStandardLower) {
      blocks.push(lowerBlock);
    }
    if (hasSpecialLower) {
      blocks.push(specialLowerBlock);
    }
    blocks.push(higherBlock);
  } else if (hasStandardLower && hasSpecialLower) {
    blocks.push(lowerBlock, specialLowerBlock);
  } else if (hasStandardLower) {
    blocks.push(lowerBlock);
  } else if (hasSpecialLower) {
    blocks.push(specialLowerBlock);
  } else if (hasHigherFactors) {
    blocks.push(higherBlock);
  }

  return {
    hasAnyRiskFactor,
    isMixedRisk,
    selectedStandardLowerFactors,
    selectedSpecialLowerFactors,
    selectedLowerFactors,
    selectedHigherFactors,
    combinedSelectionLine,
    blocks
  };
}

export function suggestMidazolamSettings(input: MidazolamGuidelineInput): MidazolamSuggestions {
  const adviceSummary = buildMidazolamAdviceSummary(input);
  const firstBlock = adviceSummary.blocks[0];
  const firstOption = firstBlock ? firstBlock.options[0] : undefined;
  return {
    loadingDoseMg: firstOption?.loadingDoseMg ?? 5,
    continueDoseMgPer24h: input.currentContinueDoseMgPer24h ?? firstOption?.continueDoseMgPer24h ?? 36,
    bolusMg: firstOption?.bolusMg ?? 5,
    lockoutHours: firstOption?.lockoutHours ?? 2,
    explanation: ""
  };
}
