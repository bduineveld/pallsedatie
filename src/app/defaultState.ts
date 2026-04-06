import {
  INTERMITTENT_PUMP_START_DEFAULT,
  INTERMITTENT_PUMP_STOP_DEFAULT
} from "../domain/guidelineLogic/midazolamIntermittentPumpTimingOptions";
import { AppFormState } from "../types/models";

export function getLocalDateIso(inputDate = new Date()): string {
  const date = new Date(inputDate);
  const offset = date.getTimezoneOffset();
  date.setMinutes(date.getMinutes() - offset);
  return date.toISOString().slice(0, 10);
}

export function createDefaultState(today = getLocalDateIso()): AppFormState {
  return {
    general: {
      mode: "combination",
      patient: {
        fullName: "",
        birthDate: "",
        bsn: "",
        gender: "",
        address: "",
        city: "",
        contactPhone: "",
        insurance: ""
      },
      usePatientSticker: false,
      physician: {
        role: "huisarts",
        fullName: "",
        practice: "",
        place: "",
        practiceAddress: "",
        date: today,
        phone: "",
        anwPhone: ""
      },
      organization: "",
      organizationPhone: "",
      organizationSecureEmail: "",
      pharmacy: "",
      pharmacyPhone: "",
      showMlPerHour: false,
      hideMlPerHourOnPdf: false,
      hideBetaWarningOnPdf: false,
      hideLogoOnPdf: false
    },
    morfine: {
      administrationMode: "",
      opioidDosingApplied: false,
      intermittentOpioidDosingApplied: false,
      extraDosisGelijkScheduled: true,
      startBolusEqualsBolus: true,
      opioidInputMode: "",
      diagnosis: "",
      indication: "",
      startDate: today,
      existingOpioids: [],
      concentrationMgPerMl: 10,
      continueDoseMgPer24h: "",
      scheduledInjectionDoseMg: "",
      scheduledInjectionIntervalHours: "",
      maxExtraDosesPer24h: "",
      maxDosesPer24h: "",
      startBolusMg: "",
      bolusMg: "",
      lockoutHours: "4",
      escalation50PercentAgreement: false,
      continuationAdvice: "",
      remarks: "",
      sideEffects: "",
      ageOver70: false,
      egfrUnder30: false
    },
    midazolam: {
      sedationMode: "",
      deliveryMode: "",
      startBolusEqualsBolus: true,
      extraDosisGelijkScheduled: true,
      diagnosis: "",
      indication: "",
      startDate: today,
      ageOver60: false,
      weightUnder60Kg: false,
      severeRenalOrHepaticImpairment: false,
      cyp3aInhibitorComedication: false,
      lowSerumAlbumin: false,
      valproicAcidUse: false,
      severeDelirium: false,
      rapidMetabolism: false,
      smoking: false,
      longTermBenzodiazepineTolerance: false,
      cyp3aInducerComedication: false,
      palliativeTeamConsultAlcoholAbuse: false,
      palliativeTeamConsultDrugUse: false,
      palliativeTeamConsultHighPsychopharmaca: false,
      concentrationMgPerMl: 5,
      loadingDoseMg: "",
      intermittentPumpMaintenanceMgPerHour: "",
      intermittentPumpStartTime: INTERMITTENT_PUMP_START_DEFAULT,
      intermittentPumpStopTime: INTERMITTENT_PUMP_STOP_DEFAULT,
      continueDoseMgPer24h: "",
      scheduledInjectionDoseMg: "",
      scheduledInjectionIntervalHours: "",
      maxExtraDosesPer24h: "6",
      bolusMg: "",
      lockoutHours: "",
      cadPlacementAllowed: false,
      cadSizeCharriere: 12,
      escalation50PercentAgreement: false,
      remarks: "",
      sideEffects: ""
    }
  };
}

export const defaultState: AppFormState = createDefaultState();
