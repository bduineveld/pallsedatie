import {
  opioidDisplayNames,
  opioidToMorphineScIvTable
} from "../../data/opioidRotationTable";
import { MorfineConversionSummary, OpioidConversionResult } from "../../types/domain";
import { ExistingOpioidEntry } from "../../types/models";
import { interpolateLinearly } from "./interpolation";

function methadoneToMorphineScIv(dosePer24h: number, ratioChoice: number): number {
  // Ratioregel uit richtlijncontext: oraal morfine : oraal methadon = variabel 5:1 t/m 10:1.
  // Eerst oraal morfine-equivalent, daarna oraal->s.c./i.v. met factor 3 (30 oraal = 10 s.c./i.v.).
  // Voorbeeld: 10 mg methadon * 5 = 50 mg oraal morfine => 50 / 3 = 16.67 mg s.c./i.v.
  const oralMorphineEquivalent = dosePer24h * ratioChoice;
  return oralMorphineEquivalent / 3;
}

function convertSingleEntry(entry: ExistingOpioidEntry): OpioidConversionResult {
  if (entry.opioid === "methadon_oral") {
    const value = methadoneToMorphineScIv(entry.dosePer24h, entry.methadoneRatioChoice);
    return {
      opioid: entry.opioid,
      sourceDose: entry.dosePer24h,
      sourceUnit: "mg/24u",
      morphineScIvMgPer24h: value,
      usedInterpolation: false,
      interpolationNote: `Methadonratio gekozen: ${entry.methadoneRatioChoice}:1`
    };
  }

  const table = opioidToMorphineScIvTable.find((row) => row.opioid === entry.opioid);
  if (!table) {
    return {
      opioid: entry.opioid,
      sourceDose: entry.dosePer24h,
      sourceUnit: "onbekend",
      morphineScIvMgPer24h: Number.NaN,
      usedInterpolation: false,
      interpolationNote: "Geen tabel gevonden."
    };
  }

  const interpolation = interpolateLinearly(entry.dosePer24h, table.points);
  return {
    opioid: entry.opioid,
    sourceDose: entry.dosePer24h,
    sourceUnit: table.doseUnit === "mcg_per_hour" ? "mcg/uur" : "mg/24u",
    morphineScIvMgPer24h: interpolation.value,
    usedInterpolation: interpolation.usedInterpolation,
    interpolationNote: interpolation.note
  };
}

export function convertOpioidsToMorphineScIv(entries: ExistingOpioidEntry[]): MorfineConversionSummary {
  const items = entries.map(convertSingleEntry);
  const warnings: string[] = [];

  for (const item of items) {
    if (Number.isNaN(item.morphineScIvMgPer24h)) {
      warnings.push(
        `${opioidDisplayNames[item.opioid]}: dosis buiten tabelbereik of onvolledige brondata.`
      );
    }
  }

  const total = items
    .filter((item) => !Number.isNaN(item.morphineScIvMgPer24h))
    .reduce((sum, item) => sum + item.morphineScIvMgPer24h, 0);

  return {
    items,
    totalMorphineScIvMgPer24h: total,
    advice100PercentMgPer24h: total,
    advice75PercentMgPer24h: total * 0.75,
    warnings
  };
}
