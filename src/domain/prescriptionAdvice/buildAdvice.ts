import { productText } from "../../data/concentrationOptions";
import { formatMedicalNumber } from "../format/numberFormat";
import { AdviceBlock } from "../../types/domain";
import { AppFormState } from "../../types/models";

function toNumber(value: string): number {
  const parsed = Number.parseFloat(String(value).trim().replace(",", "."));
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

/** Midazolam e.d.: maxExtra = maximaal aantal extra PRN-doses per 24 uur. */
function calculateMaxDaysIntermittent(
  scheduledDoseMg: number,
  intervalHours: number,
  bolusMg: number,
  lockoutHours: number,
  maxExtraDosesPer24h: number,
  concentrationMgPerMl: number
): number {
  const maxMl = 100;
  const totalMg = maxMl * concentrationMgPerMl;
  const scheduledPerDay =
    intervalHours > 0 ? (24 / intervalHours) * scheduledDoseMg : 0;
  let bolusEventsPerDay = 0;
  if (lockoutHours > 0 && bolusMg > 0) {
    const byLockout = 24 / lockoutHours;
    bolusEventsPerDay =
      maxExtraDosesPer24h > 0 ? Math.min(byLockout, maxExtraDosesPer24h) : byLockout;
  }
  const bolusPerDay = bolusMg * bolusEventsPerDay;
  const dailyUsage = scheduledPerDay + bolusPerDay;
  if (dailyUsage <= 0) {
    return 0;
  }
  return totalMg / dailyUsage;
}

/** Morfine intermitterend: maxDosesPer24h = maximaal totaal aantal doses (gepland + extra) per 24 uur. */
function calculateMaxDaysIntermittentMorfine(
  scheduledDoseMg: number,
  intervalHours: number,
  bolusMg: number,
  lockoutHours: number,
  maxDosesPer24h: number,
  concentrationMgPerMl: number
): number {
  const maxMl = 100;
  const totalMg = maxMl * concentrationMgPerMl;
  const scheduledPerDay =
    intervalHours > 0 ? (24 / intervalHours) * scheduledDoseMg : 0;
  const scheduledInjectionsPerDay = intervalHours > 0 ? 24 / intervalHours : 0;
  let bolusEventsPerDay = 0;
  if (lockoutHours > 0 && bolusMg > 0) {
    const byLockout = 24 / lockoutHours;
    const maxExtraSlots =
      maxDosesPer24h > 0
        ? Math.max(0, maxDosesPer24h - scheduledInjectionsPerDay)
        : Number.POSITIVE_INFINITY;
    bolusEventsPerDay = Math.min(byLockout, maxExtraSlots);
  }
  const bolusPerDay = bolusMg * bolusEventsPerDay;
  const dailyUsage = scheduledPerDay + bolusPerDay;
  if (dailyUsage <= 0) {
    return 0;
  }
  return totalMg / dailyUsage;
}

/**
 * Midazolam continue via injecties:
 * maxDosesPer24h = maximaal aantal injecties per 24 uur (incl. basis injecties; er is geen continue dosis).
 */
function calculateMaxDaysContinuousInjections(
  bolusMg: number,
  lockoutHours: number,
  maxDosesPer24h: number,
  concentrationMgPerMl: number
): number {
  const maxMl = 100;
  const totalMg = maxMl * concentrationMgPerMl;
  const eventsPerDay = lockoutHours > 0 ? 24 / lockoutHours : 0;
  const effectiveEventsPerDay =
    maxDosesPer24h > 0 ? Math.min(eventsPerDay, maxDosesPer24h) : eventsPerDay;
  const dailyUsage = bolusMg * effectiveEventsPerDay;
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
  const maxExtra = toNumber(state.morfine.maxExtraDosesPer24h);
  if (state.morfine.administrationMode === "intermittent_injection") {
    const schedD = toNumber(state.morfine.scheduledInjectionDoseMg);
    const schedH = toNumber(state.morfine.scheduledInjectionIntervalHours);
    const bolusMg = toNumber(state.morfine.bolusMg);
    const lockout = toNumber(state.morfine.lockoutHours);
    const maxDoses = toNumber(state.morfine.maxDosesPer24h);
    const maxDays = calculateMaxDaysIntermittentMorfine(
      schedD,
      schedH,
      bolusMg,
      lockout,
      maxDoses,
      state.morfine.concentrationMgPerMl
    );
    const formattedDays = formatDaysForAdvice(maxDays);
    return {
      title: "Receptadvies morfine",
      lines: [
        `Morfine ${state.morfine.concentrationMgPerMl} mg/ml (intermitterend).`,
        productText.morfine,
        `Geplande injectie: ${formatMedicalNumber(schedD)} mg elke ${formatMedicalNumber(schedH)} uur.`,
        `Extra dosis: ${formatMedicalNumber(bolusMg)} mg; minimaal ${formatMedicalNumber(lockout)} uur tussen doses.`,
        `Max. ${formatMedicalNumber(maxDoses)} dose(s) per 24 uur (totaal, inclusief geplande injecties).`,
        `Ruwe schatting: minimaal ${formattedDays} dagen uit 100 ml (afhankelijk van gebruik).`
      ]
    };
  }
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
      `Max. ${formatMedicalNumber(maxExtra)} extra dose(s) per 24 uur.`,
      `Dit is genoeg voor minimaal ${formattedDays} dagen (inclusief worst-case bolusgebruik).`
    ]
  };
}

function buildMidazolamAdvice(state: AppFormState): AdviceBlock {
  const maxExtra = toNumber(state.midazolam.maxExtraDosesPer24h);
  if (state.midazolam.sedationMode === "intermittent") {
    if (state.midazolam.deliveryMode === "pump_infusion") {
      const loadMg = toNumber(state.midazolam.loadingDoseMg);
      const maintMgPerH = toNumber(state.midazolam.intermittentPumpMaintenanceMgPerHour);
      const bolusMg = toNumber(state.midazolam.bolusMg);
      const lockout = toNumber(state.midazolam.lockoutHours);
      const continueMgPer24hEquivalent = maintMgPerH * 24;
      const maxDays = calculateMaxDays(
        continueMgPer24hEquivalent,
        bolusMg,
        lockout,
        state.midazolam.concentrationMgPerMl
      );
      const formattedDays = formatDaysForAdvice(maxDays);
      return {
        title: "Receptadvies midazolam",
        lines: [
          `Midazolam ${state.midazolam.concentrationMgPerMl} mg/ml (intermitterende sedatie, via pomp).`,
          productText.midazolam,
          `Oplaaddosis: ${formatMedicalNumber(loadMg)} mg s.c.`,
          `Onderhoudsdosis: ${formatMedicalNumber(maintMgPerH)} mg/uur continu s.c. (richtlijn: range 0,5–2,5 mg/uur).`,
          `Bij onvoldoende bewustzijnsdaling: ${formatMedicalNumber(bolusMg)} mg s.c. elke ${formatMedicalNumber(lockout)} uur als bolus.`,
          `Starttijd: ${state.midazolam.intermittentPumpStartTime.trim() || "—"}; stoptijd onderhoud: ${state.midazolam.intermittentPumpStopTime.trim() || "—"}.`,
          `Max. ${formatMedicalNumber(maxExtra)} extra dose(s) per 24 uur.`,
          `Ruwe schatting (24u-equivalent onderhoud + maximale bolussen): minimaal ${formattedDays} dagen uit 100 ml.`
        ]
      };
    }
    const schedD = toNumber(state.midazolam.scheduledInjectionDoseMg);
    const schedH = toNumber(state.midazolam.scheduledInjectionIntervalHours);
    const bolusMg = toNumber(state.midazolam.bolusMg);
    const lockout = toNumber(state.midazolam.lockoutHours);
    const maxDays = calculateMaxDaysIntermittent(
      schedD,
      schedH,
      bolusMg,
      lockout,
      maxExtra,
      state.midazolam.concentrationMgPerMl
    );
    const formattedDays = formatDaysForAdvice(maxDays);
    return {
      title: "Receptadvies midazolam",
      lines: [
        `Midazolam ${state.midazolam.concentrationMgPerMl} mg/ml (intermitterend, via injecties).`,
        productText.midazolam,
        `Geplande injectie: ${formatMedicalNumber(schedD)} mg elke ${formatMedicalNumber(schedH)} uur.`,
        `Extra dosis: ${formatMedicalNumber(bolusMg)} mg; minimaal ${formatMedicalNumber(lockout)} uur tussen extra doses.`,
        `Max. ${formatMedicalNumber(maxExtra)} extra dose(s) per 24 uur.`,
        `Ruwe schatting: minimaal ${formattedDays} dagen uit 100 ml (afhankelijk van gebruik).`
      ]
    };
  }

  if (state.midazolam.deliveryMode === "injections") {
    const bolusMg = toNumber(state.midazolam.bolusMg);
    const lockout = toNumber(state.midazolam.lockoutHours);
    const maxDays = calculateMaxDaysContinuousInjections(
      bolusMg,
      lockout,
      maxExtra,
      state.midazolam.concentrationMgPerMl
    );
    const formattedDays = formatDaysForAdvice(maxDays);
    return {
      title: "Receptadvies midazolam",
      lines: [
        `Midazolam ${state.midazolam.concentrationMgPerMl} mg/ml (continue sedatie, via injecties).`,
        productText.midazolam,
        `Injecties: ${formatMedicalNumber(bolusMg)} mg elke ${formatMedicalNumber(lockout)} uur.`,
        `Max. ${formatMedicalNumber(maxExtra)} dose(s) per 24 uur.`,
        `Ruwe schatting: minimaal ${formattedDays} dagen uit 100 ml (afhankelijk van gebruik).`
      ]
    };
  }

  // Default: continue sedatie via pomp (continue infusie)
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
      `Midazolam ${state.midazolam.concentrationMgPerMl} mg/ml (continue sedatie, via pomp).`,
      productText.midazolam,
      `Continue snelheid: ${formatMedicalNumber(continueMg)} mg/24u.`,
      `Bolus: ${formatMedicalNumber(bolusMg)} mg.`,
      `Lockout: ${formatMedicalNumber(lockout)} uur.`,
      `Max. ${formatMedicalNumber(maxExtra)} extra dose(s) per 24 uur.`,
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

export interface PrescriptionAdviceOptions {
  includeMorfine: boolean;
  includeMidazolam: boolean;
}

export function buildPrescriptionAdvice(
  state: AppFormState,
  options: PrescriptionAdviceOptions
): AdviceBlock[] {
  const blocks: AdviceBlock[] = [];
  if (options.includeMorfine) {
    blocks.push(buildMorfineAdvice(state));
  }
  if (options.includeMidazolam) {
    blocks.push(buildMidazolamAdvice(state));
    if (state.midazolam.sedationMode === "continuous" && state.midazolam.cadPlacementAllowed) {
      blocks.push(buildCadAdvice(state), buildInbrengsetAdvice());
    }
  }
  return blocks;
}
