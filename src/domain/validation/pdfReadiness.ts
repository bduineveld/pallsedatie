import { PdfReadiness } from "../../types/domain";
import { AppFormState } from "../../types/models";
import { validateMidazolamForm, validateMorfineForm } from "./formValidation";

export function getPdfReadiness(state: AppFormState): PdfReadiness {
  return {
    morfineReady: validateMorfineForm(state),
    midazolamReady: validateMidazolamForm(state)
  };
}
