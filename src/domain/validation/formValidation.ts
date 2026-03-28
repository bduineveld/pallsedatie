import { AppFormState } from "../../types/models";
import { ValidationResult } from "../../types/domain";

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

export function validateSharedForPdf(state: AppFormState): string[] {
  const errors: string[] = [];
  if (!hasText(state.general.physician.fullName)) {
    errors.push("Voorschrijver naam is verplicht.");
  }
  return errors;
}

export function validateMorfineForm(state: AppFormState): ValidationResult {
  const errors = validateSharedForPdf(state);
  if (!hasText(state.morfine.indication)) {
    errors.push("Indicatie (morfine) is verplicht.");
  }
  if (!hasText(state.morfine.diagnosis)) {
    errors.push("Diagnose/ziektebeeld (morfine) is verplicht.");
  }
  if (!state.morfine.opioidInputMode) {
    errors.push("Kies opioïd-naïef of reken om vanuit bestaande dosering.");
  }
  if (state.morfine.opioidInputMode === "existing" && state.morfine.existingOpioids.length === 0) {
    errors.push("Voeg minimaal één bestaand opioïd toe.");
  }
  if (!hasText(state.morfine.continueDoseMgPer24h)) {
    errors.push("Continue dosering morfine ontbreekt.");
  }
  return { valid: errors.length === 0, errors };
}

export function validateMidazolamForm(state: AppFormState): ValidationResult {
  const errors = validateSharedForPdf(state);
  if (!hasText(state.midazolam.indication)) {
    errors.push("Indicatie/refractair symptoom (midazolam) is verplicht.");
  }
  if (!hasText(state.midazolam.diagnosis)) {
    errors.push("Diagnose/ziektebeeld (midazolam) is verplicht.");
  }
  if (!hasText(state.midazolam.continueDoseMgPer24h)) {
    errors.push("Continue dosering midazolam ontbreekt.");
  }
  if (!hasText(state.midazolam.bolusMg)) {
    errors.push("Bolusdosering midazolam ontbreekt.");
  }
  return { valid: errors.length === 0, errors };
}
