import { OpioidKind } from "./models";

export interface OpioidConversionResult {
  opioid: OpioidKind;
  sourceDose: number;
  sourceUnit: string;
  morphineScIvMgPer24h: number;
  usedInterpolation: boolean;
  interpolationNote?: string;
}

/** Waarschuwingen in de morfine-bundel: bullets in één lijst, of een vrije tekstblok (bijv. met link). */
export type MorfineWarningItem =
  | { kind: "bullet"; text: string }
  | { kind: "block"; html: string };

export interface MorfineConversionSummary {
  items: OpioidConversionResult[];
  totalMorphineScIvMgPer24h: number;
  advice100PercentMgPer24h: number;
  advice75PercentMgPer24h: number;
  warnings: string[];
}

export interface MorfineSuggestions {
  continueDoseMgPer24h: number;
  lockoutHours: number;
  explanation: string;
}

export interface MidazolamSuggestions {
  loadingDoseMg: number;
  continueDoseMgPer24h: number;
  bolusMg: number;
  lockoutHours: number;
  explanation: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface PdfReadiness {
  morfineReady: ValidationResult;
  midazolamReady: ValidationResult;
}

export interface AdviceBlock {
  title: string;
  lines: string[];
}
