import { suggestMidazolamSettings } from "../guidelineLogic/midazolamLogic";
import { MidazolamFormData } from "../../types/models";

export function computeMidazolamSuggestionBundle(form: MidazolamFormData) {
  const suggestions = suggestMidazolamSettings({
    currentContinueDoseMgPer24h: form.continueDoseMgPer24h
      ? Number(form.continueDoseMgPer24h)
      : undefined
  });
  return { suggestions, warnings: [] as string[] };
}
