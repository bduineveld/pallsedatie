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
  if (!state.morfine.administrationMode) {
    errors.push("Kies continue infusie of intermitterende injecties (morfine).");
  }
  if (!state.morfine.opioidInputMode) {
    errors.push("Kies opioïd-naïef of reken om vanuit bestaande dosering.");
  }
  if (state.morfine.opioidInputMode === "existing" && state.morfine.existingOpioids.length === 0) {
    errors.push("Voeg minimaal één bestaand opioïd toe.");
  }
  if (!hasText(state.morfine.maxExtraDosesPer24h)) {
    errors.push("Max. extra doses per 24 uur (morfine) ontbreekt.");
  }
  if (state.morfine.administrationMode === "continuous_infusion") {
    if (!hasText(state.morfine.continueDoseMgPer24h)) {
      errors.push("Continue dosering morfine ontbreekt.");
    }
  }
  if (state.morfine.administrationMode === "intermittent_injection") {
    if (!hasText(state.morfine.scheduledInjectionDoseMg)) {
      errors.push("Dosis per geplande injectie (morfine) ontbreekt.");
    }
    if (!hasText(state.morfine.scheduledInjectionIntervalHours)) {
      errors.push("Interval geplande injecties (morfine) ontbreekt.");
    }
    if (!hasText(state.morfine.bolusMg)) {
      errors.push("Extra dosis (morfine) ontbreekt.");
    }
    if (!hasText(state.morfine.lockoutHours)) {
      errors.push("Interval tussen extra doses (morfine) ontbreekt.");
    }
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
  if (!state.midazolam.sedationMode) {
    errors.push("Kies continue of intermitterende sedatie (midazolam).");
  }
  if (!hasText(state.midazolam.maxExtraDosesPer24h)) {
    errors.push("Max. extra doses per 24 uur (midazolam) ontbreekt.");
  }
  if (state.midazolam.sedationMode === "continuous") {
    if (!hasText(state.midazolam.continueDoseMgPer24h)) {
      errors.push("Continue dosering midazolam ontbreekt.");
    }
    if (!hasText(state.midazolam.bolusMg)) {
      errors.push("Bolusdosering midazolam ontbreekt.");
    }
  }
  if (state.midazolam.sedationMode === "intermittent") {
    if (!hasText(state.midazolam.scheduledInjectionDoseMg)) {
      errors.push("Dosis per geplande injectie (midazolam) ontbreekt.");
    }
    if (!hasText(state.midazolam.scheduledInjectionIntervalHours)) {
      errors.push("Interval geplande injecties (midazolam) ontbreekt.");
    }
    if (!hasText(state.midazolam.bolusMg)) {
      errors.push("Extra dosis (midazolam) ontbreekt.");
    }
    if (!hasText(state.midazolam.lockoutHours)) {
      errors.push("Interval tussen extra doses (midazolam) ontbreekt.");
    }
  }
  return { valid: errors.length === 0, errors };
}
