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
      hideLogoOnPdf: false
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
      ageOver70: false,
      egfrUnder30: false,
      hepaticImpairment: false,
      cachexiaOrFrailty: false,
      chronicBenzodiazepineUse: false,
      alcoholUse: false,
      severeAgitationDelirium: false,
      severeDyspneaAnxiety: false,
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
