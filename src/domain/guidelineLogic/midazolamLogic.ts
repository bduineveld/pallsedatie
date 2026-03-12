import { MidazolamSuggestions } from "../../types/domain";

export interface MidazolamGuidelineInput {
  currentContinueDoseMgPer24h?: number;
  ageOver70?: boolean;
  egfrUnder30?: boolean;
  hepaticImpairment?: boolean;
  cachexiaOrFrailty?: boolean;
  chronicBenzodiazepineUse?: boolean;
  alcoholUse?: boolean;
  severeAgitationDelirium?: boolean;
  severeDyspneaAnxiety?: boolean;
}

export interface MidazolamAdviceOption {
  buttonLabel: string;
  loadingDoseMg: number;
  continueDoseMgPer24h: number;
  bolusMg: number;
  lockoutHours: number;
}

export interface MidazolamAdviceBlock {
  id: "base" | "lower" | "higher";
  heading: string;
  adviceLine: string;
  options: [MidazolamAdviceOption, MidazolamAdviceOption];
}

export interface MidazolamAdviceSummary {
  hasAnyRiskFactor: boolean;
  isMixedRisk: boolean;
  selectedLowerFactors: string[];
  selectedHigherFactors: string[];
  combinedSelectionLine: string;
  blocks: MidazolamAdviceBlock[];
}

const lowerFactorDefinitions: Array<{ label: string; isChecked: (input: MidazolamGuidelineInput) => boolean }> = [
  { label: ">70jr", isChecked: (input) => Boolean(input.ageOver70) },
  { label: "Slechte nierfunctie (eGFR <30)", isChecked: (input) => Boolean(input.egfrUnder30) },
  { label: "leverfunctiestoornis (cirrose/leverfalen)", isChecked: (input) => Boolean(input.hepaticImpairment) },
  { label: "cachexie of fragiele patient", isChecked: (input) => Boolean(input.cachexiaOrFrailty) }
];

const higherFactorDefinitions: Array<{ label: string; isChecked: (input: MidazolamGuidelineInput) => boolean }> = [
  { label: "chronisch benzodiazepinegebruik", isChecked: (input) => Boolean(input.chronicBenzodiazepineUse) },
  { label: "alcoholgebruik", isChecked: (input) => Boolean(input.alcoholUse) },
  { label: "ernstige agitatie/delier", isChecked: (input) => Boolean(input.severeAgitationDelirium) },
  { label: "ernstige dyspnoe of angst", isChecked: (input) => Boolean(input.severeDyspneaAnxiety) }
];

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
  const selectedLowerFactors = lowerFactorDefinitions
    .filter((definition) => definition.isChecked(input))
    .map((definition) => definition.label);
  const selectedHigherFactors = higherFactorDefinitions
    .filter((definition) => definition.isChecked(input))
    .map((definition) => definition.label);

  const hasLowerFactors = selectedLowerFactors.length > 0;
  const hasHigherFactors = selectedHigherFactors.length > 0;
  const hasAnyRiskFactor = hasLowerFactors || hasHigherFactors;
  const isMixedRisk = hasLowerFactors && hasHigherFactors;

  const combinedSelectionLine = !hasAnyRiskFactor
    ? "Geen risicofactoren."
    : isMixedRisk
      ? `${joinWithEn(selectedLowerFactors)}, maar tevens ${joinWithEn(selectedHigherFactors)}. Op basis van klinische inschatting zelf een afweging maken en extra evalueren.`
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
  } else {
    if (isMixedRisk) {
      blocks.push(lowerBlock, baseBlock, higherBlock);
    } else if (hasLowerFactors) {
      blocks.push(lowerBlock);
    } else if (hasHigherFactors) {
      blocks.push(higherBlock);
    }
  }

  return {
    hasAnyRiskFactor,
    isMixedRisk,
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
    explanation:
      "Gebruik het adviesvenster voor lage/hoge scenario's. Waarden worden in mg/24u getoond en lockout staat op 2 uur."
  };
}
