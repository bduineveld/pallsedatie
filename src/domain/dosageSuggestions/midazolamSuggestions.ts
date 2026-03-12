import { buildMidazolamAdviceSummary, suggestMidazolamSettings } from "../guidelineLogic/midazolamLogic";
import { MidazolamFormData } from "../../types/models";

export function computeMidazolamSuggestionBundle(form: MidazolamFormData) {
  const guidelineInput = {
    currentContinueDoseMgPer24h: form.continueDoseMgPer24h
      ? Number(form.continueDoseMgPer24h)
      : undefined,
    ageOver70: form.ageOver70,
    egfrUnder30: form.egfrUnder30,
    hepaticImpairment: form.hepaticImpairment,
    cachexiaOrFrailty: form.cachexiaOrFrailty,
    chronicBenzodiazepineUse: form.chronicBenzodiazepineUse,
    alcoholUse: form.alcoholUse,
    severeAgitationDelirium: form.severeAgitationDelirium,
    severeDyspneaAnxiety: form.severeDyspneaAnxiety
  };
  const suggestions = suggestMidazolamSettings(guidelineInput);
  const adviceSummary = buildMidazolamAdviceSummary(guidelineInput);
  return { suggestions, adviceSummary, warnings: [] as string[] };
}
