import { convertOpioidsToMorphineScIv } from "../conversions/opioidConversion";
import {
  morfineNaiveCautionDefaults,
  morfineNaiveStandardDefaults
} from "../../data/morfineDefaults";
import { buildMorfineWarnings, suggestMorfineSettings } from "../guidelineLogic/morfineLogic";
import { MorfineFormData } from "../../types/models";
import { MorfineConversionSummary } from "../../types/domain";

export function computeMorfineSuggestionBundle(form: MorfineFormData) {
  if (form.opioidInputMode === "naive") {
    const cautiousNaiveStart = form.ageOver70 || form.egfrUnder30;
    const defaults = cautiousNaiveStart
      ? morfineNaiveCautionDefaults
      : morfineNaiveStandardDefaults;

    const conversion: MorfineConversionSummary = {
      items: [],
      totalMorphineScIvMgPer24h: defaults.continueDoseMgPer24h,
      advice100PercentMgPer24h: defaults.continueDoseMgPer24h,
      advice75PercentMgPer24h: defaults.continueDoseMgPer24h,
      warnings: []
    };

    const warnings = buildMorfineWarnings({
      advice75PercentMgPer24h: defaults.continueDoseMgPer24h,
      ageOver70: form.ageOver70,
      egfrUnder30: form.egfrUnder30
    });

    return {
      conversion,
      suggestions: {
        continueDoseMgPer24h: defaults.continueDoseMgPer24h,
        startBolusMg: defaults.startDoseMg,
        bolusMg: defaults.bolusMg,
        lockoutHours: defaults.lockoutHours,
        explanation:
          "Aanbevolen op basis van opioïd-naïef richtlijnstart. Bij >70 jaar en/of eGFR <30 wordt de lage startdosis gebruikt."
      },
      warnings
    };
  }

  const conversion = convertOpioidsToMorphineScIv(form.existingOpioids);
  const suggestions = suggestMorfineSettings({
    advice75PercentMgPer24h: conversion.advice75PercentMgPer24h,
    ageOver70: form.ageOver70,
    egfrUnder30: form.egfrUnder30
  });
  const warnings = [...conversion.warnings, ...buildMorfineWarnings({
    advice75PercentMgPer24h: conversion.advice75PercentMgPer24h,
    ageOver70: form.ageOver70,
    egfrUnder30: form.egfrUnder30
  })];

  return { conversion, suggestions, warnings };
}
