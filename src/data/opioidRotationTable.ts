import { OpioidKind } from "../types/models";

export interface ConversionFactor {
  from: string;
  to: string;
  ratio: string;
  note?: string;
}

export interface InterpolationPoint {
  xDose: number;
  yMorphineScIvMgPer24h: number;
}

export interface OpioidTableRow {
  opioid: OpioidKind;
  doseUnit: "mg_per_24h" | "mcg_per_hour";
  points: InterpolationPoint[];
}

// Conversiefactoren uit de opgegeven richtlijncontext (1C).
export const conversionFactors: ConversionFactor[] = [
  { from: "oraal morfine", to: "oraal oxycodon", ratio: "1.5:1" },
  { from: "oraal morfine", to: "oraal hydromorfon", ratio: "5:1" },
  { from: "oraal morfine", to: "transdermaal fentanyl", ratio: "100:1" },
  { from: "oraal morfine", to: "transdermaal buprenorfine", ratio: "100:1" },
  {
    from: "oraal morfine",
    to: "oraal methadon",
    ratio: "variabel 5:1 tot 10:1",
    note: "Gebruiker kiest ratio per casus."
  },
  { from: "oraal oxycodon", to: "oraal hydromorfon", ratio: "3.3:1" },
  { from: "oraal morfine", to: "oraal tramadol", ratio: "1:5" },
  { from: "oraal morfine", to: "oraal tapentadol", ratio: "1:2.5" }
];

// Tabelpunten: inputdosis per opioïd -> uitkomst in morfine s.c./i.v. mg per 24 uur.
export const opioidToMorphineScIvTable: OpioidTableRow[] = [
  {
    opioid: "morfine_oral",
    doseUnit: "mg_per_24h",
    points: [
      { xDose: 30, yMorphineScIvMgPer24h: 10 },
      { xDose: 60, yMorphineScIvMgPer24h: 20 },
      { xDose: 120, yMorphineScIvMgPer24h: 40 },
      { xDose: 180, yMorphineScIvMgPer24h: 60 },
      { xDose: 240, yMorphineScIvMgPer24h: 80 },
      { xDose: 360, yMorphineScIvMgPer24h: 120 },
      { xDose: 480, yMorphineScIvMgPer24h: 160 }
    ]
  },
  {
    opioid: "morfine_sciv",
    doseUnit: "mg_per_24h",
    points: [
      { xDose: 10, yMorphineScIvMgPer24h: 10 },
      { xDose: 20, yMorphineScIvMgPer24h: 20 },
      { xDose: 40, yMorphineScIvMgPer24h: 40 },
      { xDose: 60, yMorphineScIvMgPer24h: 60 },
      { xDose: 80, yMorphineScIvMgPer24h: 80 },
      { xDose: 120, yMorphineScIvMgPer24h: 120 },
      { xDose: 160, yMorphineScIvMgPer24h: 160 }
    ]
  },
  {
    opioid: "fentanyl_patch",
    doseUnit: "mcg_per_hour",
    points: [
      { xDose: 12, yMorphineScIvMgPer24h: 10 },
      { xDose: 25, yMorphineScIvMgPer24h: 20 },
      { xDose: 50, yMorphineScIvMgPer24h: 40 },
      { xDose: 75, yMorphineScIvMgPer24h: 60 },
      { xDose: 100, yMorphineScIvMgPer24h: 80 },
      { xDose: 150, yMorphineScIvMgPer24h: 120 },
      { xDose: 200, yMorphineScIvMgPer24h: 160 }
    ]
  },
  {
    opioid: "oxycodon_oral",
    doseUnit: "mg_per_24h",
    points: [
      { xDose: 20, yMorphineScIvMgPer24h: 10 },
      { xDose: 40, yMorphineScIvMgPer24h: 20 },
      { xDose: 80, yMorphineScIvMgPer24h: 40 },
      { xDose: 120, yMorphineScIvMgPer24h: 60 },
      { xDose: 160, yMorphineScIvMgPer24h: 80 },
      { xDose: 240, yMorphineScIvMgPer24h: 120 },
      { xDose: 320, yMorphineScIvMgPer24h: 160 }
    ]
  },
  {
    opioid: "oxycodon_sciv",
    doseUnit: "mg_per_24h",
    points: [
      { xDose: 10, yMorphineScIvMgPer24h: 10 },
      { xDose: 20, yMorphineScIvMgPer24h: 20 },
      { xDose: 40, yMorphineScIvMgPer24h: 40 },
      { xDose: 60, yMorphineScIvMgPer24h: 60 },
      { xDose: 80, yMorphineScIvMgPer24h: 80 },
      { xDose: 120, yMorphineScIvMgPer24h: 120 },
      { xDose: 160, yMorphineScIvMgPer24h: 160 }
    ]
  },
  {
    opioid: "hydromorfon_oral",
    doseUnit: "mg_per_24h",
    points: [
      { xDose: 6, yMorphineScIvMgPer24h: 10 },
      { xDose: 12, yMorphineScIvMgPer24h: 20 },
      { xDose: 24, yMorphineScIvMgPer24h: 40 },
      { xDose: 36, yMorphineScIvMgPer24h: 60 },
      { xDose: 48, yMorphineScIvMgPer24h: 80 },
      { xDose: 72, yMorphineScIvMgPer24h: 120 },
      { xDose: 96, yMorphineScIvMgPer24h: 160 }
    ]
  },
  {
    opioid: "hydromorfon_sciv",
    doseUnit: "mg_per_24h",
    points: [
      { xDose: 2, yMorphineScIvMgPer24h: 10 },
      { xDose: 4, yMorphineScIvMgPer24h: 20 },
      { xDose: 8, yMorphineScIvMgPer24h: 40 },
      { xDose: 12, yMorphineScIvMgPer24h: 60 },
      { xDose: 16, yMorphineScIvMgPer24h: 80 },
      { xDose: 24, yMorphineScIvMgPer24h: 120 },
      { xDose: 32, yMorphineScIvMgPer24h: 160 }
    ]
  },
  {
    opioid: "tramadol_oral",
    doseUnit: "mg_per_24h",
    points: [
      { xDose: 150, yMorphineScIvMgPer24h: 10 },
      { xDose: 300, yMorphineScIvMgPer24h: 20 }
    ]
  },
  {
    opioid: "buprenorfine_patch",
    doseUnit: "mcg_per_hour",
    points: [
      { xDose: 52.5, yMorphineScIvMgPer24h: 40 },
      { xDose: 105, yMorphineScIvMgPer24h: 80 }
    ]
  },
  {
    opioid: "tapentadol_oral",
    doseUnit: "mg_per_24h",
    points: [
      { xDose: 150, yMorphineScIvMgPer24h: 20 },
      { xDose: 300, yMorphineScIvMgPer24h: 40 }
    ]
  }
];

export const opioidDisplayNames: Record<OpioidKind, string> = {
  morfine_oral: "Morfine oraal",
  morfine_sciv: "Morfine s.c./i.v.",
  oxycodon_oral: "Oxycodon oraal",
  oxycodon_sciv: "Oxycodon s.c./i.v.",
  hydromorfon_oral: "Hydromorfon oraal",
  hydromorfon_sciv: "Hydromorfon s.c./i.v.",
  tramadol_oral: "Tramadol oraal",
  tapentadol_oral: "Tapentadol oraal",
  fentanyl_patch: "Fentanyl pleister",
  buprenorfine_patch: "Buprenorfine pleister",
  methadon_oral: "Methadon oraal"
};
