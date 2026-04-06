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
  if (state.morfine.administrationMode === "continuous_infusion") {
    if (!hasText(state.morfine.continueDoseMgPer24h)) {
      errors.push("Continue dosering morfine ontbreekt.");
    }
    if (!hasText(state.morfine.bolusMg)) {
      errors.push("Bolusdosis (morfine) ontbreekt.");
    }
    if (!hasText(state.morfine.lockoutHours)) {
      errors.push("Lockout (morfine) ontbreekt.");
    }
  }
  if (state.morfine.administrationMode === "intermittent_injection") {
    if (!state.morfine.intermittentOpioidDosingApplied) {
      errors.push("Neem eerst de richtlijn of omrekening over voor intermitterende injecties (morfine).");
    } else {
      if (!hasText(state.morfine.scheduledInjectionDoseMg)) {
        errors.push("Dosis per geplande injectie (morfine) ontbreekt.");
      }
      if (!hasText(state.morfine.scheduledInjectionIntervalHours)) {
        errors.push("Interval geplande injecties (morfine) ontbreekt.");
      }
      if (!state.morfine.extraDosisGelijkScheduled && !hasText(state.morfine.bolusMg)) {
        errors.push("Extra dosis (morfine) ontbreekt.");
      }
      if (!hasText(state.morfine.lockoutHours)) {
        errors.push("Minimaal interval tussen doses (morfine) ontbreekt.");
      }
      if (!hasText(state.morfine.maxDosesPer24h)) {
        errors.push("Max. doses per 24 uur (morfine) ontbreekt.");
      }
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

  if (!state.midazolam.deliveryMode) {
    errors.push("Kies injecties of pomp/continue infusie (midazolam).");
  }

  if (state.midazolam.sedationMode === "continuous") {
    if (state.midazolam.deliveryMode === "pump_infusion") {
      if (!hasText(state.midazolam.continueDoseMgPer24h)) {
        errors.push("Continue dosering midazolam ontbreekt.");
      }
      if (!hasText(state.midazolam.bolusMg)) {
        errors.push("Bolusdosering midazolam ontbreekt.");
      }
      if (!hasText(state.midazolam.lockoutHours)) {
        errors.push("Lockouttijd (midazolam) ontbreekt.");
      }
      if (!hasText(state.midazolam.maxExtraDosesPer24h)) {
        errors.push("Max. extra doses per 24 uur (midazolam) ontbreekt.");
      }
    } else if (state.midazolam.deliveryMode === "injections") {
      if (!hasText(state.midazolam.scheduledInjectionDoseMg)) {
        errors.push("Dosis per injectie (midazolam) ontbreekt.");
      }
      if (!hasText(state.midazolam.scheduledInjectionIntervalHours)) {
        errors.push("Elke (uur) voor midazolam ontbreekt.");
      }
      if (!state.midazolam.extraDosisGelijkScheduled && !hasText(state.midazolam.bolusMg)) {
        errors.push("Zo nodig extra dosis (midazolam) ontbreekt.");
      }
      if (!hasText(state.midazolam.lockoutHours)) {
        errors.push("Minimale tijd tussen extra doses (midazolam) ontbreekt.");
      }
      if (!hasText(state.midazolam.maxExtraDosesPer24h)) {
        errors.push("Totaal max. doses per 24 uur (midazolam) ontbreekt.");
      }
    }
  }

  if (state.midazolam.sedationMode === "intermittent") {
    if (state.midazolam.deliveryMode === "pump_infusion") {
      if (!hasText(state.midazolam.loadingDoseMg)) {
        errors.push("Oplaaddosis (midazolam) ontbreekt.");
      }
      if (!hasText(state.midazolam.intermittentPumpMaintenanceMgPerHour)) {
        errors.push("Onderhoudsdosis (mg/uur) midazolam ontbreekt.");
      }
      if (!hasText(state.midazolam.bolusMg)) {
        errors.push("Bolusdosering midazolam ontbreekt.");
      }
      if (!hasText(state.midazolam.lockoutHours)) {
        errors.push("Lockouttijd (midazolam) ontbreekt.");
      }
      if (!hasText(state.midazolam.maxExtraDosesPer24h)) {
        errors.push("Max. extra doses per 24 uur (midazolam) ontbreekt.");
      }
      if (!hasText(state.midazolam.intermittentPumpStartTime)) {
        errors.push("Starttijd (midazolam, intermitterende pomp) ontbreekt.");
      }
      if (!hasText(state.midazolam.intermittentPumpStopTime)) {
        errors.push("Stoptijd onderhoud (midazolam, intermitterende pomp) ontbreekt.");
      }
    } else if (state.midazolam.deliveryMode === "injections") {
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
      if (!hasText(state.midazolam.maxExtraDosesPer24h)) {
        errors.push("Max. extra doses per 24 uur (midazolam) ontbreekt.");
      }
    }
  }
  return { valid: errors.length === 0, errors };
}
