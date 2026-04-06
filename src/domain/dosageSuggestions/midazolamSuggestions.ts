import { buildMidazolamAdviceSummary, suggestMidazolamSettings } from "../guidelineLogic/midazolamLogic";
import { MidazolamFormData } from "../../types/models";

export function computeMidazolamSuggestionBundle(form: MidazolamFormData) {
  const guidelineInput = {
    currentContinueDoseMgPer24h: form.continueDoseMgPer24h
      ? Number(form.continueDoseMgPer24h)
      : undefined,
    ageOver60: form.ageOver60,
    weightUnder60Kg: form.weightUnder60Kg,
    severeRenalOrHepaticImpairment: form.severeRenalOrHepaticImpairment,
    cyp3aInhibitorComedication: form.cyp3aInhibitorComedication,
    lowSerumAlbumin: form.lowSerumAlbumin,
    valproicAcidUse: form.valproicAcidUse,
    severeDelirium: form.severeDelirium,
    rapidMetabolism: form.rapidMetabolism,
    smoking: form.smoking,
    longTermBenzodiazepineTolerance: form.longTermBenzodiazepineTolerance,
    cyp3aInducerComedication: form.cyp3aInducerComedication
  };
  const suggestions = suggestMidazolamSettings(guidelineInput);
  const adviceSummary = buildMidazolamAdviceSummary(guidelineInput);
  return { suggestions, adviceSummary, warnings: [] as string[] };
}
