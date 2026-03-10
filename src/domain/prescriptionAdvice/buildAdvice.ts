import { productText } from "../../data/concentrationOptions";
import { formatMedicalNumber } from "../format/numberFormat";
import { AdviceBlock } from "../../types/domain";
import { AppFormState } from "../../types/models";

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateMaxDays(
  continueMgPer24h: number,
  bolusMg: number,
  lockoutHours: number,
  concentrationMgPerMl: number
): number {
  const maxMl = 100;
  const totalMg = maxMl * concentrationMgPerMl;
  const continuePerDay = continueMgPer24h;
  const maxBolusPerDay = lockoutHours > 0 ? 24 / lockoutHours : 0;
  const bolusPerDay = bolusMg * maxBolusPerDay;
  const dailyUsage = continuePerDay + bolusPerDay;
  if (dailyUsage <= 0) {
    return 0;
  }
  return totalMg / dailyUsage;
}

function formatDaysForAdvice(days: number): string {
  if (days < 10) {
    return days.toFixed(1);
  }
  return String(Math.round(days));
}

function buildMorfineAdvice(state: AppFormState): AdviceBlock {
  const continueMg = toNumber(state.morfine.continueDoseMgPer24h);
  const bolusMg = toNumber(state.morfine.bolusMg);
  const lockout = toNumber(state.morfine.lockoutHours);
  const maxDays = calculateMaxDays(
    continueMg,
    bolusMg,
    lockout,
    state.morfine.concentrationMgPerMl
  );
  const formattedDays = formatDaysForAdvice(maxDays);
  return {
    title: "Receptadvies morfine",
    lines: [
      `Morfine ${state.morfine.concentrationMgPerMl} mg/ml.`,
      productText.morfine,
      `Continue snelheid: ${formatMedicalNumber(continueMg)} mg/24u.`,
      `Bolus: ${formatMedicalNumber(bolusMg)} mg.`,
      `Lockout: ${formatMedicalNumber(lockout)} uur.`,
      `Dit is genoeg voor minimaal ${formattedDays} dagen (inclusief worst-case bolusgebruik).`
    ]
  };
}

function buildMidazolamAdvice(state: AppFormState): AdviceBlock {
  const continueMg = toNumber(state.midazolam.continueDoseMgPer24h);
  const bolusMg = toNumber(state.midazolam.bolusMg);
  const lockout = toNumber(state.midazolam.lockoutHours);
  const maxDays = calculateMaxDays(
    continueMg,
    bolusMg,
    lockout,
    state.midazolam.concentrationMgPerMl
  );
  const formattedDays = formatDaysForAdvice(maxDays);
  return {
    title: "Receptadvies midazolam",
    lines: [
      `Midazolam ${state.midazolam.concentrationMgPerMl} mg/ml.`,
      productText.midazolam,
      `Continue snelheid: ${formatMedicalNumber(continueMg)} mg/24u.`,
      `Bolus: ${formatMedicalNumber(bolusMg)} mg.`,
      `Lockout: ${formatMedicalNumber(lockout)} uur.`,
      `Dit is genoeg voor minimaal ${formattedDays} dagen (inclusief worst-case bolusgebruik).`
    ]
  };
}

function buildCadAdvice(state: AppFormState): AdviceBlock {
  return {
    title: "CAD advies",
    lines: [
      `CAD plaatsing toegestaan: ${state.midazolam.cadPlacementAllowed ? "Ja" : "Nee"}.`,
      `Gekozen maat: Ch ${state.midazolam.cadSizeCharriere}.`
    ]
  };
}

function buildInbrengsetAdvice(): AdviceBlock {
  return {
    title: "Inbrengset advies",
    lines: ["Benodigd: CAD + inbrengset."]
  };
}

export function buildPrescriptionAdvice(state: AppFormState): AdviceBlock[] {
  const blocks: AdviceBlock[] = [];
  if (state.general.mode === "morfine" || state.general.mode === "combination") {
    blocks.push(buildMorfineAdvice(state));
  }
  if (state.general.mode === "midazolam" || state.general.mode === "combination") {
    blocks.push(buildMidazolamAdvice(state), buildCadAdvice(state), buildInbrengsetAdvice());
  }
  return blocks;
}
