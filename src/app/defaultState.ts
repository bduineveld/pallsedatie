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
        address: ""
      },
      physician: {
        fullName: "",
        place: "",
        date: today,
        phone: "",
        anwPhone: ""
      },
      organization: "",
      pharmacy: "",
      showMlPerHour: false,
      includeGeneratedByFooter: true
    },
    morfine: {
      opioidInputMode: "",
      diagnosis: "",
      indication: "",
      startDate: today,
      existingOpioids: [],
      concentrationMgPerMl: 10,
      continueDoseMgPer24h: "",
      startBolusMg: "",
      bolusMg: "",
      lockoutHours: "",
      escalation50PercentAgreement: false,
      continuationAdvice: "",
      remarks: "",
      sideEffects: "",
      ageOver70: false,
      egfrUnder30: false
    },
    midazolam: {
      diagnosis: "",
      indication: "",
      startDate: today,
      concentrationMgPerMl: 5,
      loadingDoseMg: "",
      continueDoseMgPer24h: "",
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
