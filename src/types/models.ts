export type AppMode = "morfine" | "midazolam" | "combination";

export type OpioidKind =
  | "morfine_oral"
  | "morfine_sciv"
  | "oxycodon_oral"
  | "oxycodon_sciv"
  | "hydromorfon_oral"
  | "hydromorfon_sciv"
  | "tramadol_oral"
  | "tapentadol_oral"
  | "fentanyl_patch"
  | "buprenorfine_patch"
  | "methadon_oral";

export interface PatientData {
  fullName: string;
  birthDate: string;
  bsn: string;
  gender: string;
  address: string;
  city: string;
  contactPhone: string;
  insurance: string;
}

export interface PhysicianData {
  role:
    | "huisarts"
    | "huisarts_io"
    | "basisarts"
    | "verpleegkundig_specialist"
    | "physician_assistant";
  fullName: string;
  practice: string;
  place: string;
  date: string;
  phone: string;
  anwPhone: string;
}

export interface GeneralFormData {
  mode: AppMode;
  patient: PatientData;
  physician: PhysicianData;
  organization: string;
  organizationPhone: string;
  organizationSecureEmail: string;
  pharmacy: string;
  pharmacyPhone: string;
  showMlPerHour: boolean;
  includeGeneratedByFooter: boolean;
}

export interface ExistingOpioidEntry {
  id: string;
  opioid: OpioidKind;
  dosePer24h: number;
  methadoneRatioChoice: 5 | 6 | 7 | 8 | 9 | 10;
}

export interface MorfineFormData {
  opioidInputMode: "" | "naive" | "existing";
  diagnosis: string;
  indication: string;
  startDate: string;
  existingOpioids: ExistingOpioidEntry[];
  concentrationMgPerMl: 1 | 10 | 20;
  continueDoseMgPer24h: string;
  startBolusMg: string;
  bolusMg: string;
  lockoutHours: string;
  escalation50PercentAgreement: boolean;
  continuationAdvice: string;
  remarks: string;
  sideEffects: string;
  ageOver70: boolean;
  egfrUnder30: boolean;
}

export interface MidazolamFormData {
  diagnosis: string;
  indication: string;
  startDate: string;
  concentrationMgPerMl: 1 | 2 | 5;
  loadingDoseMg: string;
  continueDoseMgPer24h: string;
  bolusMg: string;
  lockoutHours: string;
  cadPlacementAllowed: boolean;
  cadSizeCharriere: 12 | 14 | 16;
  escalation50PercentAgreement: boolean;
  remarks: string;
  sideEffects: string;
}

export interface AppFormState {
  general: GeneralFormData;
  morfine: MorfineFormData;
  midazolam: MidazolamFormData;
}
