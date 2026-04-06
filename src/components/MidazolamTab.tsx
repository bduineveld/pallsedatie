import { useMemo, useState } from "react";
import { midazolamConcentrations, productText } from "../data/concentrationOptions";
import { midazolamGuidelinePanelText } from "../data/guidelineText";
import { computeMidazolamSuggestionBundle } from "../domain/dosageSuggestions/midazolamSuggestions";
import { formatMedicalNumber } from "../domain/format/numberFormat";
import {
  MIDAZOLAM_SPECIAL_LOWER_PRESET_MILD,
  MIDAZOLAM_SPECIAL_LOWER_PRESET_STRONG,
  type MidazolamAdviceOption
} from "../domain/guidelineLogic/midazolamLogic";
import { MidazolamFormData } from "../types/models";
import { FormField } from "./FormField";
import { GuidelinePanel } from "./GuidelinePanel";
import { MidazolamBolusDoseCombobox } from "./MidazolamBolusDoseCombobox";
import { MorfineIntermittentMinIntervalCombobox } from "./MorfineIntermittentMinIntervalCombobox";
import { MorfineLockoutCombobox } from "./MorfineLockoutCombobox";
import { MorfineMaxDosesPer24Combobox } from "./MorfineMaxDosesPer24Combobox";
import { MorfineMaxExtraDosesCombobox } from "./MorfineMaxExtraDosesCombobox";
import { MorfineScheduledInjectionIntervalCombobox } from "./MorfineScheduledInjectionIntervalCombobox";
import { MidazolamIntermittentPumpMaintenanceCombobox } from "./MidazolamIntermittentPumpMaintenanceCombobox";
import { formatIntermittentPumpMaintenanceInputToken } from "../domain/guidelineLogic/midazolamIntermittentPumpMaintenanceOptions";
import { formatLockoutHoursString } from "../domain/guidelineLogic/morfineLockoutOptions";
import {
  INTERMITTENT_PUMP_START_DEFAULT,
  INTERMITTENT_PUMP_STOP_DEFAULT
} from "../domain/guidelineLogic/midazolamIntermittentPumpTimingOptions";
import { MidazolamIntermittentPumpTimingCombobox } from "./MidazolamIntermittentPumpTimingCombobox";

const reasonIcon = "/icons/healthicons/inpatient-24px.svg";
const medicinesIcon = "/icons/healthicons/infusion-pump-24px.svg";
const notesIcon = "/icons/healthicons/clinical-f-24px.svg";

const diagnosisIndicationInputPlaceholder = "Typ of kies een suggestie";

const PALLIATIVE_TEAM_CONSULT_ADVICE_TEXT =
  "Overweeg om bij patiënten met alcoholabusus, drugsgebruik en/of hogere doseringen psychofarmaca (waar in dit kader ook chronisch gebruik van benzodiazepines met de indicatie anti-epileptica vallen) voorafgaand aan de palliatieve sedatie te overleggen met een palliatief team/consulent palliatieve zorg";

const SMOKING_NICOTINE_PATCH_ADVICE_TEXT =
  "Overweeg bij patiënten die roken tevens te starten met een nicotinepleister";

/** Richtlijn intermitterende palliatieve sedatie midazolam via pomp (s.c.). */
const INTERMITTENT_PUMP_RICHTLIJN_LOADING_MG = 5;
const INTERMITTENT_PUMP_RICHTLIJN_MAINTENANCE_MG_PER_H = 1.5;
const INTERMITTENT_PUMP_RICHTLIJN_BOLUS_MG = 5;
const INTERMITTENT_PUMP_RICHTLIJN_LOCKOUT_H = 2;
const INTERMITTENT_PUMP_RICHTLIJN_MAX_EXTRA = 6;

/** Tekstuele richtlijn continue palliatieve sedatie midazolam via pomp (weergave, alinea zonder lijst). */
const CONTINUOUS_PUMP_RICHTLIJN_BODY = (
  <>
    Standaard bolus 5 mg. Geef bij de start van de sedatie een bolus 5-10 mg s.c., gevolgd door onderhoudsdosering
    1,5 mg/uur s.c. continu (met een range van 0,5-2,5 mg/uur, afhankelijk van diverse factoren). Herhaal bij
    onvoldoende effect na 2 uur 5 mg bolus s.c. en verhoog 4 uur na de start van de palliatieve sedatie de continue
    dosering met 50% in combinatie met een bolus van 5 mg s.c. en herhaal deze stappen tot voldoende comfort is
    bereikt.
  </>
);

const CONTINUOUS_PUMP_RICHTLIJN_BULLETS = (
  <ul className="midazolam-richtlijn-bullet-list">
    <li>
      Bij continue doseringen vanaf 5 mg/uur s.c. dienen de bolussen verhoogd te worden naar 10 mg s.c.
    </li>
    <li>
      Bij continue doseringen vanaf 10 mg/uur s.c. dienen de bolussen verhoogd te worden naar 15 mg s.c.
    </li>
  </ul>
);

/** Zelfde getallen als basisadvies (36 mg/24u, bolus 5 mg, lockout 2 uur); alleen oplaaddosis verschilt. */
const CONTINUOUS_PUMP_RICHTLIJN_PRESET_5MG: MidazolamAdviceOption = {
  buttonLabel: "Richtlijn overnemen (oplaaddosis 5mg)",
  loadingDoseMg: 5,
  continueDoseMgPer24h: 36,
  bolusMg: 5,
  lockoutHours: 2
};

const CONTINUOUS_PUMP_RICHTLIJN_PRESET_10MG: MidazolamAdviceOption = {
  buttonLabel: "Richtlijn overnemen (oplaaddosis 10mg)",
  loadingDoseMg: 10,
  continueDoseMgPer24h: 36,
  bolusMg: 5,
  lockoutHours: 2
};

/** 0,5 mg/uur en 2,5 mg/uur als mg/24u t.o.v. 1,5 mg/uur (= 36 mg/24u). */
const CONTINUOUS_PUMP_LOWER_CONTINUE_MG_PER24H = 12;
const CONTINUOUS_PUMP_HIGHER_CONTINUE_MG_PER24H = 60;

interface MidazolamTabProps {
  data: MidazolamFormData;
  onChange: (data: MidazolamFormData) => void;
  showMlPerHour: boolean;
  patientGender: string;
  onDiagnosisUserChange?: () => void;
  onDiagnosisBlur?: () => void;
}

const midazolamIndicationOptions = [
  "terminale onrust",
  "delier",
  "ernstige dyspnoe",
  "onbehandelbare pijn",
  "misselijkheid/braken",
  "ileus",
  "ernstige angst"
];

const palliativeDiagnosisOptions = [
  "gemetastaseerd longkanker",
  "longkanker",

  "gemetastaseerd borstkanker",
  "borstkanker",

  "gemetastaseerd darmkanker",
  "darmkanker",

  "gemetastaseerd alvleesklierkanker",
  "alvleesklierkanker",

  "gemetastaseerd prostaatkanker",
  "prostaatkanker",

  "gemetastaseerd nierkanker",
  "nierkanker",

  "gemetastaseerd blaaskanker",
  "blaaskanker",

  "gemetastaseerde maligniteit (overig)",
  "maligniteit (overig)",

  "hersentumor",
  "hooggradig glioom",
  "hematologische maligniteit",

  "hartfalen (eindstadium)",
  "COPD / longemfyseem (eindstadium)",
  "interstitiële longziekte (eindstadium)",

  "nierfalen (eindstadium)",
  "leverfalen",
  "levercirrose",

  "ALS",
  "Parkinson (vergevorderd stadium)",
  "multiple sclerose (vergevorderd stadium)",
  "CVA met ernstige restverschijnselen",
  "progressieve neurologische aandoening",

  "vergevorderde dementie",

  "delier in terminale fase",

  "onbekende of niet-gespecificeerde aandoening",
  "algemene achteruitgang bij onbekende ziekte"
]

function getAutocompleteSearchToken(value: string): string {
  const parts = value.split(",");
  return (parts[parts.length - 1] ?? "").trim().toLowerCase();
}

function applyAutocompleteSelection(currentValue: string, option: string): string {
  const parts = currentValue.split(",");
  const previousSelections = parts
    .slice(0, -1)
    .map((part) => part.trim())
    .filter(Boolean);
  return [...previousSelections, option].join(", ");
}

function defaultCadCharriereForGender(gender: string): MidazolamFormData["cadSizeCharriere"] {
  return gender === "man" ? 14 : 12;
}

export function MidazolamTab({
  data,
  onChange,
  showMlPerHour,
  patientGender,
  onDiagnosisUserChange,
  onDiagnosisBlur
}: MidazolamTabProps) {
  const formatNl = (value: number, minimumFractionDigits = 0, maximumFractionDigits = 2) =>
    new Intl.NumberFormat("nl-NL", { minimumFractionDigits, maximumFractionDigits }).format(value);
  const bundle = computeMidazolamSuggestionBundle(data);
  const [diagnosisMenuOpen, setDiagnosisMenuOpen] = useState(false);
  const [indicationMenuOpen, setIndicationMenuOpen] = useState(false);
  const requiredLabel = (text: string) => (
    <>
      {text} <span className="required-mark">*</span>
    </>
  );
  const SectionHeader = ({ iconSrc, title }: { iconSrc: string; title: string }) => (
    <div className="general-group-header">
      <span className="general-group-icon" aria-hidden="true">
        <img src={iconSrc} alt="" className="general-group-icon-image" />
      </span>
      <div className="general-group-header-text">
        <h3 className="general-group-title">{title}</h3>
      </div>
    </div>
  );
  const applyMidazolamPreset = (option: MidazolamAdviceOption) => {
    const adviceLoadingEqualsBolus = Math.abs(option.loadingDoseMg - option.bolusMg) < 1e-9;
    onChange({
      ...data,
      startBolusEqualsBolus: adviceLoadingEqualsBolus,
      loadingDoseMg: formatMedicalNumber(option.loadingDoseMg),
      continueDoseMgPer24h: formatMedicalNumber(option.continueDoseMgPer24h),
      bolusMg: formatMedicalNumber(option.bolusMg),
      lockoutHours: formatMedicalNumber(option.lockoutHours)
    });
  };
  const applyIntermittentPumpRichtlijn = () => {
    const bolusStr = formatMedicalNumber(INTERMITTENT_PUMP_RICHTLIJN_BOLUS_MG);
    onChange({
      ...data,
      startBolusEqualsBolus: true,
      bolusMg: bolusStr,
      loadingDoseMg: bolusStr,
      intermittentPumpMaintenanceMgPerHour: formatIntermittentPumpMaintenanceInputToken(
        INTERMITTENT_PUMP_RICHTLIJN_MAINTENANCE_MG_PER_H
      ),
      lockoutHours: formatMedicalNumber(INTERMITTENT_PUMP_RICHTLIJN_LOCKOUT_H),
      maxExtraDosesPer24h: String(INTERMITTENT_PUMP_RICHTLIJN_MAX_EXTRA),
      intermittentPumpStartTime: INTERMITTENT_PUMP_START_DEFAULT,
      intermittentPumpStopTime: INTERMITTENT_PUMP_STOP_DEFAULT
    });
  };
  const hasPalliativeTeamConsultIndication =
    data.palliativeTeamConsultAlcoholAbuse ||
    data.palliativeTeamConsultDrugUse ||
    data.palliativeTeamConsultHighPsychopharmaca;
  const riskStripeClass =
    bundle.adviceSummary.isMixedRisk || hasPalliativeTeamConsultIndication
      ? "midazolam-advice-window--mixed"
      : bundle.adviceSummary.hasAnyRiskFactor
        ? "midazolam-advice-window--single"
        : "midazolam-advice-window--none";
  const adviceSummary = bundle.adviceSummary;
  const hasStandardLowerIndication = adviceSummary.selectedStandardLowerFactors.length > 0;
  const hasSpecialLowerIndication = adviceSummary.selectedSpecialLowerFactors.length > 0;
  const hasHigherIndication = adviceSummary.selectedHigherFactors.length > 0;
  const applyContinuousLowerMaintenanceRate = () => {
    onChange({
      ...data,
      continueDoseMgPer24h: formatMedicalNumber(CONTINUOUS_PUMP_LOWER_CONTINUE_MG_PER24H)
    });
  };
  const applyContinuousLongerBolusInterval = () => {
    onChange({ ...data, lockoutHours: formatLockoutHoursString(4) });
  };
  const applyContinuousHigherMaintenanceRate = () => {
    onChange({
      ...data,
      continueDoseMgPer24h: formatMedicalNumber(CONTINUOUS_PUMP_HIGHER_CONTINUE_MG_PER24H)
    });
  };
  const applyContinuousShorterBolusInterval = () => {
    onChange({ ...data, lockoutHours: formatLockoutHoursString(0.5) });
  };
  const filteredDiagnoses = useMemo(() => {
    const needle = getAutocompleteSearchToken(data.diagnosis);
    if (!needle) {
      return palliativeDiagnosisOptions;
    }
    return palliativeDiagnosisOptions.filter((option) => option.toLowerCase().includes(needle));
  }, [data.diagnosis]);
  const filteredIndications = useMemo(() => {
    const needle = getAutocompleteSearchToken(data.indication);
    if (!needle) {
      return midazolamIndicationOptions;
    }
    return midazolamIndicationOptions.filter((option) => option.toLowerCase().includes(needle));
  }, [data.indication]);
  const isContinuousSedation = data.sedationMode === "continuous";
  const isIntermittentSedation = data.sedationMode === "intermittent";
  const isInjectionRoute = data.deliveryMode === "injections";
  const isPumpInfusionRoute = data.deliveryMode === "pump_infusion";
  const minPumpMlPerHour = 0.1;
  const pumpStepMlPerHour = 0.01;
  const minContinueDoseAtCurrentConcentration = minPumpMlPerHour * 24 * data.concentrationMgPerMl;
  const parsedContinueDose = Number.parseFloat(data.continueDoseMgPer24h.replace(",", "."));
  const currentMlPerHour = parsedContinueDose / 24 / data.concentrationMgPerMl;
  const continueDoseTooLowForPump =
    isContinuousSedation &&
    Number.isFinite(parsedContinueDose) &&
    parsedContinueDose > 0 &&
    Number.isFinite(currentMlPerHour) &&
    currentMlPerHour < minPumpMlPerHour;
  const currentPumpStepRaw = currentMlPerHour / pumpStepMlPerHour;
  const currentPumpStepRounded = Math.round(currentPumpStepRaw);
  const onExactPumpStep =
    Number.isFinite(currentPumpStepRaw) &&
    Math.abs(currentPumpStepRaw - currentPumpStepRounded) < 1e-8;
  const continueDoseBetweenPumpSteps =
    isContinuousSedation &&
    Number.isFinite(parsedContinueDose) &&
    parsedContinueDose > 0 &&
    Number.isFinite(currentMlPerHour) &&
    currentMlPerHour >= minPumpMlPerHour &&
    !onExactPumpStep;
  const lowerPumpMlPerHour = Math.max(
    minPumpMlPerHour,
    Math.floor(currentPumpStepRaw) * pumpStepMlPerHour
  );
  const upperPumpMlPerHour = Math.ceil(currentPumpStepRaw) * pumpStepMlPerHour;
  const lowerPumpDoseMgPer24h = lowerPumpMlPerHour * 24 * data.concentrationMgPerMl;
  const upperPumpDoseMgPer24h = upperPumpMlPerHour * 24 * data.concentrationMgPerMl;
  const parsedIntermittentMaint = Number.parseFloat(data.intermittentPumpMaintenanceMgPerHour.replace(",", "."));
  const intermittentMaintMlPerHour =
    Number.isFinite(parsedIntermittentMaint) && parsedIntermittentMaint > 0
      ? parsedIntermittentMaint / data.concentrationMgPerMl
      : Number.NaN;
  const intermittentPumpDoseTooLow =
    isIntermittentSedation &&
    isPumpInfusionRoute &&
    Number.isFinite(parsedIntermittentMaint) &&
    parsedIntermittentMaint > 0 &&
    Number.isFinite(intermittentMaintMlPerHour) &&
    intermittentMaintMlPerHour < minPumpMlPerHour;
  const intermittentPumpStepRaw = intermittentMaintMlPerHour / pumpStepMlPerHour;
  const intermittentPumpStepRounded = Math.round(intermittentPumpStepRaw);
  const intermittentOnExactPumpStep =
    Number.isFinite(intermittentPumpStepRaw) &&
    Math.abs(intermittentPumpStepRaw - intermittentPumpStepRounded) < 1e-8;
  const intermittentPumpBetweenSteps =
    isIntermittentSedation &&
    isPumpInfusionRoute &&
    Number.isFinite(parsedIntermittentMaint) &&
    parsedIntermittentMaint > 0 &&
    Number.isFinite(intermittentMaintMlPerHour) &&
    intermittentMaintMlPerHour >= minPumpMlPerHour &&
    !intermittentOnExactPumpStep;
  const lowerIntermittentMlPerHour = Math.max(
    minPumpMlPerHour,
    Math.floor(intermittentPumpStepRaw) * pumpStepMlPerHour
  );
  const upperIntermittentMlPerHour = Math.ceil(intermittentPumpStepRaw) * pumpStepMlPerHour;
  const lowerIntermittentMgPerHour = lowerIntermittentMlPerHour * data.concentrationMgPerMl;
  const upperIntermittentMgPerHour = upperIntermittentMlPerHour * data.concentrationMgPerMl;
  const applyMinimalIntermittentMaintenance = () => {
    onChange({
      ...data,
      intermittentPumpMaintenanceMgPerHour: formatNl(minPumpMlPerHour * data.concentrationMgPerMl)
    });
  };
  const applyIntermittentPumpRoundedMaintenance = (mgPerHour: number) => {
    onChange({ ...data, intermittentPumpMaintenanceMgPerHour: formatNl(mgPerHour) });
  };
  const lowerConcentrationOption = midazolamConcentrations
    .filter((option) => option.value < data.concentrationMgPerMl)
    .sort((a, b) => b.value - a.value)[0];
  const applyLowerConcentration = () => {
    if (!lowerConcentrationOption) {
      return;
    }
    onChange({
      ...data,
      concentrationMgPerMl: lowerConcentrationOption.value as 1 | 2 | 5
    });
  };
  const applyMinimalPumpDose = () => {
    onChange({
      ...data,
      continueDoseMgPer24h: formatNl(minContinueDoseAtCurrentConcentration)
    });
  };
  const applyPumpRoundedDose = (targetDoseMgPer24h: number) => {
    onChange({
      ...data,
      continueDoseMgPer24h: formatNl(targetDoseMgPer24h)
    });
  };

  return (
    <section className="card">
      <h2>Uitvoeringsverzoek midazolam, eventueel verzoek CAD</h2>

      <div className="general-group general-group--allow-overflow">
        <SectionHeader iconSrc={reasonIcon} title="Reden" />
        <div className="general-group-body">
          <div className="grid-2">
            <FormField label={requiredLabel("Diagnose / ziektebeeld")}>
              <div
                className="autocomplete-wrapper"
                onBlur={() => setTimeout(() => setDiagnosisMenuOpen(false), 120)}
              >
                <input
                  placeholder={diagnosisIndicationInputPlaceholder}
                  value={data.diagnosis}
                  onFocus={() => setDiagnosisMenuOpen(true)}
                  onChange={(event) => {
                    onDiagnosisUserChange?.();
                    onChange({ ...data, diagnosis: event.target.value });
                    setDiagnosisMenuOpen(true);
                  }}
                  onBlur={onDiagnosisBlur}
                />
                {diagnosisMenuOpen && filteredDiagnoses.length > 0 ? (
                  <div className="autocomplete-menu">
                    {filteredDiagnoses.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className="autocomplete-item"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          onDiagnosisUserChange?.();
                          onChange({
                            ...data,
                            diagnosis: applyAutocompleteSelection(data.diagnosis, option)
                          });
                          setDiagnosisMenuOpen(false);
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </FormField>
            <FormField label={requiredLabel("Indicatie / refractair symptoom")}>
              <div
                className="autocomplete-wrapper"
                onBlur={() => setTimeout(() => setIndicationMenuOpen(false), 120)}
              >
                <input
                  placeholder={diagnosisIndicationInputPlaceholder}
                  value={data.indication}
                  onFocus={() => setIndicationMenuOpen(true)}
                  onChange={(event) => {
                    onChange({ ...data, indication: event.target.value });
                    setIndicationMenuOpen(true);
                  }}
                />
                {indicationMenuOpen && filteredIndications.length > 0 ? (
                  <div className="autocomplete-menu">
                    {filteredIndications.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className="autocomplete-item"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          onChange({
                            ...data,
                            indication: applyAutocompleteSelection(data.indication, option)
                          });
                          setIndicationMenuOpen(false);
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </FormField>
          </div>
        </div>
      </div>

      <div className="general-group general-group--allow-overflow">
        <SectionHeader iconSrc={medicinesIcon} title="Middel" />
        <div className="general-group-body">
          <div className="stack">
            <span className="form-label">{requiredLabel("Sedatie")}</span>
            <label className="checkbox-line">
              <input
                type="radio"
                name="midazolam-sedation-mode"
                checked={data.sedationMode === "intermittent"}
                onChange={() => onChange({ ...data, sedationMode: "intermittent", deliveryMode: "" })}
              />
              Intermitterende sedatie
            </label>
            <label className="checkbox-line">
              <input
                type="radio"
                name="midazolam-sedation-mode"
                checked={data.sedationMode === "continuous"}
                onChange={() => onChange({ ...data, sedationMode: "continuous", deliveryMode: "" })}
              />
              Continue sedatie
            </label>
          </div>

          {data.sedationMode ? (
            <div className="stack">
              <span className="form-label">{requiredLabel("Toedieningswijze")}</span>
              <label className="checkbox-line">
                <input
                  type="radio"
                  name="midazolam-delivery-mode"
                  checked={data.deliveryMode === "injections"}
                  onChange={() => onChange({ ...data, deliveryMode: "injections" })}
                />
                Losse injecties
              </label>
              <label className="checkbox-line">
                <input
                  type="radio"
                  name="midazolam-delivery-mode"
                  checked={data.deliveryMode === "pump_infusion"}
                  onChange={() => onChange({ ...data, deliveryMode: "pump_infusion" })}
                />
                Pomp/continue infusie
              </label>

              <p className="small-muted">
                <strong>Intermitterende sedatie</strong> betekent: de patiënt wordt daarna weer wakker.
                Dit kan eenmalig of periodiek (bijvoorbeeld elke nacht), met <strong>losse injecties</strong> of
                via een <strong>pomp</strong> die je (periodiek) aanzet. Bij <strong>continue sedatie</strong> is
                de sedatie doorlopend; je kunt dit ook toedienen met <strong>injecties</strong> of via de
                <strong> pomp</strong>.
              </p>
            </div>
          ) : null}

          {data.sedationMode ? (
            <>
          <div className="grid-2">
            <FormField label="Middel en concentratie">
                <select
                  value={data.concentrationMgPerMl}
                  onChange={(event) =>
                    onChange({
                      ...data,
                      concentrationMgPerMl: Number(event.target.value) as 1 | 2 | 5
                    })
                  }
                >
                  {midazolamConcentrations.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label.charAt(0).toUpperCase() + option.label.slice(1)}
                    </option>
                  ))}
                </select>
            </FormField>
            <FormField label={requiredLabel("Startdatum")}>
              <input
                type="date"
                lang="nl-NL"
                value={data.startDate}
                onChange={(event) => onChange({ ...data, startDate: event.target.value })}
              />
            </FormField>
          </div>

          <div className="midazolam-risk-columns">
            <div className="stack">
              <span className="form-label">Indicatie lagere dosering</span>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={data.ageOver60}
                  onChange={(event) => onChange({ ...data, ageOver60: event.target.checked })}
                />
                Leeftijd &gt;60 jaar
              </label>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={data.weightUnder60Kg}
                  onChange={(event) => onChange({ ...data, weightUnder60Kg: event.target.checked })}
                />
                Gewicht &lt;60 kg
              </label>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={data.severeRenalOrHepaticImpairment}
                  onChange={(event) =>
                    onChange({ ...data, severeRenalOrHepaticImpairment: event.target.checked })
                  }
                />
                Ernstige nier- of leverfunctiestoornissen
              </label>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={data.cyp3aInhibitorComedication}
                  onChange={(event) =>
                    onChange({ ...data, cyp3aInhibitorComedication: event.target.checked })
                  }
                />
                Comedicatie met CYP3A remmend effect
              </label>
              <span className="form-label midazolam-risk-subgroup-label">Indicatie lagere dosering (ander advies)</span>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={data.lowSerumAlbumin}
                  onChange={(event) => onChange({ ...data, lowSerumAlbumin: event.target.checked })}
                />
                Sterk verlaagd serumalbumine
              </label>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={data.valproicAcidUse}
                  onChange={(event) => onChange({ ...data, valproicAcidUse: event.target.checked })}
                />
                Gelijktijdig gebruik valproïnezuur
              </label>
            </div>
            <div className="stack">
              <span className="form-label">Indicatie hogere dosering</span>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={data.severeDelirium}
                  onChange={(event) => onChange({ ...data, severeDelirium: event.target.checked })}
                />
                Ernstig delier
              </label>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={data.rapidMetabolism}
                  onChange={(event) => onChange({ ...data, rapidMetabolism: event.target.checked })}
                />
                Snelle metabolisering
              </label>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={data.smoking}
                  onChange={(event) => onChange({ ...data, smoking: event.target.checked })}
                />
                Roken
              </label>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={data.longTermBenzodiazepineTolerance}
                  onChange={(event) =>
                    onChange({ ...data, longTermBenzodiazepineTolerance: event.target.checked })
                  }
                />
                Eerder langdurig benzodiazepine gebruik met tolerantie als gevolg
              </label>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={data.cyp3aInducerComedication}
                  onChange={(event) =>
                    onChange({ ...data, cyp3aInducerComedication: event.target.checked })
                  }
                />
                Comedicatie met CYP3A inducerend effect
              </label>
              <span className="form-label midazolam-risk-subgroup-label">Indicatie overleg palliatief team</span>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={data.palliativeTeamConsultAlcoholAbuse}
                  onChange={(event) =>
                    onChange({ ...data, palliativeTeamConsultAlcoholAbuse: event.target.checked })
                  }
                />
                Alcoholabusus
              </label>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={data.palliativeTeamConsultDrugUse}
                  onChange={(event) =>
                    onChange({ ...data, palliativeTeamConsultDrugUse: event.target.checked })
                  }
                />
                Drugsgebruik
              </label>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={data.palliativeTeamConsultHighPsychopharmaca}
                  onChange={(event) =>
                    onChange({ ...data, palliativeTeamConsultHighPsychopharmaca: event.target.checked })
                  }
                />
                Hogere doseringen psychofarmaca
              </label>
            </div>
          </div>

          {isContinuousSedation && isPumpInfusionRoute ? (
            <>
              <div className={`conversion-summary midazolam-advice-window ${riskStripeClass}`}>
                <div className="midazolam-richtlijn-block">
                  <p className="midazolam-richtlijn-paragraph">
                    <strong>Richtlijn:</strong> {CONTINUOUS_PUMP_RICHTLIJN_BODY}
                  </p>
                  {CONTINUOUS_PUMP_RICHTLIJN_BULLETS}
                </div>
                <div className="segment midazolam-continuous-oplaad-segment">
                  <button type="button" onClick={() => applyMidazolamPreset(CONTINUOUS_PUMP_RICHTLIJN_PRESET_5MG)}>
                    Richtlijn overnemen (oplaaddosis 5mg)
                  </button>
                  <button type="button" onClick={() => applyMidazolamPreset(CONTINUOUS_PUMP_RICHTLIJN_PRESET_10MG)}>
                    Richtlijn overnemen (oplaaddosis 10mg)
                  </button>
                </div>
                {hasPalliativeTeamConsultIndication ? (
                  <p className="midazolam-advice-red-notice">{PALLIATIVE_TEAM_CONSULT_ADVICE_TEXT}</p>
                ) : null}
                {!adviceSummary.hasAnyRiskFactor && !hasPalliativeTeamConsultIndication ? (
                  <p className="midazolam-indicatie-heading">
                    <strong>geen indicatie voor hogere of lagere dosering</strong>
                  </p>
                ) : null}
                {adviceSummary.isMixedRisk ? (
                  <section className="warning-banner">{adviceSummary.combinedSelectionLine}</section>
                ) : null}
                {hasStandardLowerIndication ? (
                  <>
                    <p className="midazolam-indicatie-heading">
                      <strong>indicatie lagere dosering</strong>
                      <span className="midazolam-indicatie-reasons">
                        {" "}
                        ({adviceSummary.selectedStandardLowerFactors.join(", ")})
                      </span>
                    </p>
                    <p className="midazolam-richtlijn-sub">
                      overweeg een lagere dosering en/of een langer bolus-interval
                    </p>
                    <div className="segment">
                      <button type="button" onClick={applyContinuousLowerMaintenanceRate}>
                        Lagere dosering (1,5 → 0,5 mg/uur)
                      </button>
                      <button type="button" onClick={applyContinuousLongerBolusInterval}>
                        Langer bolus-interval (2 → 4 uur)
                      </button>
                    </div>
                  </>
                ) : null}
                {hasSpecialLowerIndication ? (
                  <>
                    <p className="midazolam-indicatie-heading">
                      <strong>indicatie lagere dosering</strong>
                      <span className="midazolam-indicatie-reasons">
                        {" "}
                        ({adviceSummary.selectedSpecialLowerFactors.join(", ")})
                      </span>
                    </p>
                    <p className="midazolam-richtlijn-sub">
                      Overweeg een lagere dosering en een lagere bolusdosering en een korter bolus-interval
                    </p>
                    <div className="segment">
                      <button
                        type="button"
                        onClick={() => applyMidazolamPreset(MIDAZOLAM_SPECIAL_LOWER_PRESET_MILD)}
                      >
                        {MIDAZOLAM_SPECIAL_LOWER_PRESET_MILD.buttonLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => applyMidazolamPreset(MIDAZOLAM_SPECIAL_LOWER_PRESET_STRONG)}
                      >
                        {MIDAZOLAM_SPECIAL_LOWER_PRESET_STRONG.buttonLabel}
                      </button>
                    </div>
                  </>
                ) : null}
                {hasHigherIndication ? (
                  <>
                    <p className="midazolam-indicatie-heading">
                      <strong>indicatie hogere dosering</strong>
                      <span className="midazolam-indicatie-reasons">
                        {" "}
                        ({adviceSummary.selectedHigherFactors.join(", ")})
                      </span>
                    </p>
                    <p className="midazolam-richtlijn-sub">
                      overweeg een hogere dosering en/of een korter bolus-interval
                    </p>
                    <div className="segment">
                      <button type="button" onClick={applyContinuousHigherMaintenanceRate}>
                        Hogere dosering (1,5 → 2,5 mg/uur)
                      </button>
                      <button type="button" onClick={applyContinuousShorterBolusInterval}>
                        Korter bolus-interval (2 → 0,5 uur)
                      </button>
                    </div>
                  </>
                ) : null}
                {data.smoking ? (
                  <p className="midazolam-advice-red-notice midazolam-advice-red-notice--footer">
                    {SMOKING_NICOTINE_PATCH_ADVICE_TEXT}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}

          {isContinuousSedation && isPumpInfusionRoute ? (
            <>
          <h3>Pompinstellingen</h3>
          <div className="morfine-pomp-grid">
            <div className="morfine-pomp-cell--continue">
              <FormField label={requiredLabel("Continue dosis (mg/24u)")}>
                <input
                  value={data.continueDoseMgPer24h}
                  onChange={(event) => onChange({ ...data, continueDoseMgPer24h: event.target.value })}
                />
              </FormField>
            </div>
            <div className="morfine-pomp-cell--bolus">
              <FormField label={requiredLabel("Bolusdosis (mg)")}>
                <MidazolamBolusDoseCombobox
                  value={data.bolusMg}
                  onChange={(nextBolus) =>
                    onChange({
                      ...data,
                      bolusMg: nextBolus,
                      ...(data.startBolusEqualsBolus ? { loadingDoseMg: nextBolus } : {})
                    })
                  }
                />
              </FormField>
            </div>
            <div className="morfine-pomp-cell--lockout">
              <FormField label={requiredLabel("Lockout (uur)")}>
                <MorfineLockoutCombobox
                  value={data.lockoutHours}
                  onChange={(next) => onChange({ ...data, lockoutHours: next })}
                />
              </FormField>
            </div>
            <div className="morfine-pomp-cell--max">
              <FormField label="Max. extra doses / 24 uur">
                <MorfineMaxExtraDosesCombobox
                  value={data.maxExtraDosesPer24h}
                  onChange={(next) => onChange({ ...data, maxExtraDosesPer24h: next })}
                />
              </FormField>
            </div>
            <div className="morfine-pomp-cell--oplaad-row">
              <div className="morfine-pomp-oplaad-row">
                <label className="checkbox-line">
                  <input
                    type="checkbox"
                    checked={data.startBolusEqualsBolus}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      onChange({
                        ...data,
                        startBolusEqualsBolus: checked,
                        loadingDoseMg: checked ? data.bolusMg : data.loadingDoseMg
                      });
                    }}
                  />
                  Oplaaddosis gelijk aan bolus
                </label>
                {!data.startBolusEqualsBolus ? (
                  <FormField label="Oplaaddosis (mg)">
                    <input
                      value={data.loadingDoseMg}
                      onChange={(event) => onChange({ ...data, loadingDoseMg: event.target.value })}
                    />
                  </FormField>
                ) : null}
              </div>
            </div>
          </div>
          {continueDoseTooLowForPump ? (
            <div className="conversion-summary morfine-conversion-summary--red">
              <p>
                dosis is te laag voor de pompstand. Kies een andere concentratie of een hogere dosis.
              </p>
              <div className="segment">
                <button type="button" onClick={applyLowerConcentration} disabled={!lowerConcentrationOption}>
                  {lowerConcentrationOption
                    ? `lagere concentratie (${lowerConcentrationOption.value} mg/ml)`
                    : "lagere concentratie"}
                </button>
                <button type="button" onClick={applyMinimalPumpDose}>
                  dosis naar {formatNl(minContinueDoseAtCurrentConcentration)}mg/24u
                </button>
              </div>
            </div>
          ) : continueDoseBetweenPumpSteps ? (
            <div className="conversion-summary morfine-conversion-summary--gold">
              <p>Dosis niet exact mogelijk, maak een keuze</p>
              <div className="segment">
                <button type="button" onClick={() => applyPumpRoundedDose(lowerPumpDoseMgPer24h)}>
                  {formatNl(lowerPumpDoseMgPer24h)}mg/24u ({formatNl(lowerPumpMlPerHour, 2, 2)}ml/uur)
                </button>
                <button type="button" onClick={() => applyPumpRoundedDose(upperPumpDoseMgPer24h)}>
                  {formatNl(upperPumpDoseMgPer24h)}mg/24u ({formatNl(upperPumpMlPerHour, 2, 2)}ml/uur)
                </button>
              </div>
            </div>
          ) : null}

          {showMlPerHour ? (
            <p className="small-muted">
              ml/uur = mg/uur / concentratie. Product: {productText.midazolam}.
            </p>
          ) : null}
          {bundle.suggestions.explanation ? (
            <p className="small-muted">{bundle.suggestions.explanation}</p>
          ) : null}
            </>
          ) : null}

          {isContinuousSedation && isInjectionRoute ? (
            <>
              <h3>Intermitterende toediening</h3>
              <div className="morfine-intermittent-extra-row">
                <FormField label={requiredLabel("Dosis per injectie (mg)")}>
                  <input
                    value={data.scheduledInjectionDoseMg}
                    onChange={(event) => {
                      const v = event.target.value;
                      onChange({
                        ...data,
                        scheduledInjectionDoseMg: v,
                        ...(data.extraDosisGelijkScheduled ? { bolusMg: v } : {})
                      });
                    }}
                  />
                </FormField>
                <FormField label={requiredLabel("Elke (uur)")}>
                  <MorfineScheduledInjectionIntervalCombobox
                    value={data.scheduledInjectionIntervalHours}
                    onChange={(next) => onChange({ ...data, scheduledInjectionIntervalHours: next })}
                  />
                </FormField>
                <div className="morfine-intermittent-grid-spacer" aria-hidden="true">
                  <span className="form-label">&nbsp;</span>
                  <div className="morfine-intermittent-grid-spacer-fill" />
                </div>
              </div>
              <div className="morfine-intermittent-extra-row">
                <div className="form-field">
                  <div className="form-label morfine-intermittent-extra-dosis-label">
                    <span>
                      Zo nodig extra dosis (mg) <span className="required-mark">*</span>
                    </span>
                    <label className="checkbox-line morfine-intermittent-gelijk-checkbox">
                      <input
                        type="checkbox"
                        checked={data.extraDosisGelijkScheduled}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          onChange({
                            ...data,
                            extraDosisGelijkScheduled: checked,
                            bolusMg: checked ? data.scheduledInjectionDoseMg : data.bolusMg
                          });
                        }}
                      />
                      gelijk
                    </label>
                  </div>
                  <input
                    value={data.bolusMg}
                    disabled={data.extraDosisGelijkScheduled}
                    onChange={(event) => onChange({ ...data, bolusMg: event.target.value })}
                  />
                </div>
                <FormField label={requiredLabel("Minimale tijd tussen extra doses (uur)")}>
                  <MorfineIntermittentMinIntervalCombobox
                    value={data.lockoutHours}
                    onChange={(next) => onChange({ ...data, lockoutHours: next })}
                  />
                </FormField>
                <FormField label={requiredLabel("Totaal max. doses / 24 uur")}>
                  <MorfineMaxDosesPer24Combobox
                    value={data.maxExtraDosesPer24h}
                    onChange={(next) => onChange({ ...data, maxExtraDosesPer24h: next })}
                  />
                </FormField>
              </div>
            </>
          ) : null}

          {isIntermittentSedation && isPumpInfusionRoute ? (
            <>
              <h3>Intermitterende sedatie via pomp</h3>
              <div className="grid-2">
                <FormField label={requiredLabel("Starttijd")}>
                  <MidazolamIntermittentPumpTimingCombobox
                    variant="start"
                    value={data.intermittentPumpStartTime}
                    onChange={(next) => onChange({ ...data, intermittentPumpStartTime: next })}
                  />
                </FormField>
                <FormField label={requiredLabel("Stoptijd onderhoud")}>
                  <MidazolamIntermittentPumpTimingCombobox
                    variant="stop"
                    value={data.intermittentPumpStopTime}
                    onChange={(next) => onChange({ ...data, intermittentPumpStopTime: next })}
                  />
                </FormField>
              </div>
              <div className={`conversion-summary midazolam-advice-window ${riskStripeClass}`}>
                <p>
                  <strong>Richtlijn:</strong> Start met oplaaddosis {INTERMITTENT_PUMP_RICHTLIJN_LOADING_MG} mg s.c.,
                  gevolgd door onderhoud {INTERMITTENT_PUMP_RICHTLIJN_MAINTENANCE_MG_PER_H} mg/uur s.c. continu (range
                  0,5–2,5 mg/uur). Bij onvoldoende bewustzijnsdaling elke{" "}
                  {INTERMITTENT_PUMP_RICHTLIJN_LOCKOUT_H} uur {INTERMITTENT_PUMP_RICHTLIJN_BOLUS_MG} mg s.c. als bolus.
                  Start de intermitterende palliatieve sedatie op de inslaaptijd en stop de onderhoudsdosering 2 uur voor
                  het gewenste tijdstip van ontwaken.
                </p>
                <div className="segment">
                  <button type="button" onClick={applyIntermittentPumpRichtlijn}>
                    Richtlijn overnemen
                  </button>
                </div>
                {hasPalliativeTeamConsultIndication ? (
                  <p className="midazolam-advice-red-notice">{PALLIATIVE_TEAM_CONSULT_ADVICE_TEXT}</p>
                ) : null}
                {data.smoking ? (
                  <p className="midazolam-advice-red-notice midazolam-advice-red-notice--footer">
                    {SMOKING_NICOTINE_PATCH_ADVICE_TEXT}
                  </p>
                ) : null}
              </div>
              <p className="small-muted">
                Onderhoud wordt ingevuld in mg/uur (niet mg/24u). De ruwe voorraadschatting in het receptadvies gebruikt
                een 24u-equivalent van deze snelheid plus maximale bolussen.
              </p>
              <div className="morfine-pomp-grid">
                <div className="morfine-pomp-cell--continue">
                  <FormField label={requiredLabel("Onderhoudsdosis (mg/uur)")}>
                    <MidazolamIntermittentPumpMaintenanceCombobox
                      value={data.intermittentPumpMaintenanceMgPerHour}
                      onChange={(next) => onChange({ ...data, intermittentPumpMaintenanceMgPerHour: next })}
                    />
                  </FormField>
                </div>
                <div className="morfine-pomp-cell--bolus">
                  <FormField label={requiredLabel("Bolusdosis (mg)")}>
                    <input
                      value={data.bolusMg}
                      onChange={(event) => {
                        const v = event.target.value;
                        onChange({
                          ...data,
                          bolusMg: v,
                          ...(data.startBolusEqualsBolus ? { loadingDoseMg: v } : {})
                        });
                      }}
                    />
                  </FormField>
                </div>
                <div className="morfine-pomp-cell--lockout">
                  <FormField label={requiredLabel("Lockout (uur)")}>
                    <MorfineLockoutCombobox
                      value={data.lockoutHours}
                      onChange={(next) => onChange({ ...data, lockoutHours: next })}
                    />
                  </FormField>
                </div>
                <div className="morfine-pomp-cell--max">
                  <FormField label={requiredLabel("Max. extra doses / 24 uur")}>
                    <MorfineMaxExtraDosesCombobox
                      value={data.maxExtraDosesPer24h}
                      onChange={(next) => onChange({ ...data, maxExtraDosesPer24h: next })}
                    />
                  </FormField>
                </div>
                <div className="morfine-pomp-cell--oplaad-row">
                  <div className="morfine-pomp-oplaad-row">
                    <label className="checkbox-line">
                      <input
                        type="checkbox"
                        checked={data.startBolusEqualsBolus}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          onChange({
                            ...data,
                            startBolusEqualsBolus: checked,
                            loadingDoseMg: checked ? data.bolusMg : data.loadingDoseMg
                          });
                        }}
                      />
                      Oplaaddosis gelijk aan bolus
                    </label>
                    {!data.startBolusEqualsBolus ? (
                      <FormField label={requiredLabel("Oplaaddosis (mg)")}>
                        <input
                          value={data.loadingDoseMg}
                          onChange={(event) => onChange({ ...data, loadingDoseMg: event.target.value })}
                        />
                      </FormField>
                    ) : null}
                  </div>
                </div>
              </div>
              {intermittentPumpDoseTooLow ? (
                <div className="conversion-summary morfine-conversion-summary--red">
                  <p>Onderhoud is te laag voor de minimale pompstand. Kies een andere concentratie of verhoog mg/uur.</p>
                  <div className="segment">
                    <button type="button" onClick={applyLowerConcentration} disabled={!lowerConcentrationOption}>
                      {lowerConcentrationOption
                        ? `lagere concentratie (${lowerConcentrationOption.value} mg/ml)`
                        : "lagere concentratie"}
                    </button>
                    <button type="button" onClick={applyMinimalIntermittentMaintenance}>
                      onderhoud naar {formatNl(minPumpMlPerHour * data.concentrationMgPerMl)} mg/uur
                    </button>
                  </div>
                </div>
              ) : intermittentPumpBetweenSteps ? (
                <div className="conversion-summary morfine-conversion-summary--gold">
                  <p>Onderhoud niet exact mogelijk op deze pomp, maak een keuze</p>
                  <div className="segment">
                    <button
                      type="button"
                      onClick={() => applyIntermittentPumpRoundedMaintenance(lowerIntermittentMgPerHour)}
                    >
                      {formatNl(lowerIntermittentMgPerHour)} mg/uur ({formatNl(lowerIntermittentMlPerHour, 2, 2)} ml/uur)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyIntermittentPumpRoundedMaintenance(upperIntermittentMgPerHour)}
                    >
                      {formatNl(upperIntermittentMgPerHour)} mg/uur ({formatNl(upperIntermittentMlPerHour, 2, 2)} ml/uur)
                    </button>
                  </div>
                </div>
              ) : null}
              {showMlPerHour ? (
                <p className="small-muted">
                  ml/uur = mg/uur ÷ concentratie. Product: {productText.midazolam}.
                </p>
              ) : null}
            </>
          ) : null}

          {isIntermittentSedation && isInjectionRoute ? (
            <>
              <h3>Intermitterende sedatie (schema, injecties)</h3>
              <p className="small-muted">Toediening via losse injecties volgens het intermitterende schema.</p>
              <div className="grid-2">
                <FormField label={requiredLabel("Dosis per injectie (mg)")}>
                  <input
                    value={data.scheduledInjectionDoseMg}
                    onChange={(event) => onChange({ ...data, scheduledInjectionDoseMg: event.target.value })}
                  />
                </FormField>
                <FormField label={requiredLabel("Elke (uur)")}>
                  <MorfineScheduledInjectionIntervalCombobox
                    value={data.scheduledInjectionIntervalHours}
                    onChange={(next) => onChange({ ...data, scheduledInjectionIntervalHours: next })}
                  />
                </FormField>
                <FormField label={requiredLabel("Extra dosis (mg)")}>
                  <input value={data.bolusMg} onChange={(event) => onChange({ ...data, bolusMg: event.target.value })} />
                </FormField>
                <FormField label={requiredLabel("Interval tussen extra doses (uur)")}>
                  <MorfineIntermittentMinIntervalCombobox
                    value={data.lockoutHours}
                    onChange={(next) => onChange({ ...data, lockoutHours: next })}
                  />
                </FormField>
                <FormField label={requiredLabel("Max. extra doses / 24 uur")}>
                  <MorfineMaxExtraDosesCombobox
                    value={data.maxExtraDosesPer24h}
                    onChange={(next) => onChange({ ...data, maxExtraDosesPer24h: next })}
                  />
                </FormField>
              </div>
            </>
          ) : null}

          <div className="stack">
            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={data.escalation50PercentAgreement}
                onChange={(event) => onChange({ ...data, escalation50PercentAgreement: event.target.checked })}
              />
              Na minimaal 4 uur zo nodig ophogen met 50%
            </label>
          </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="general-group">
        <SectionHeader iconSrc={notesIcon} title="Overig" />
        <div className="general-group-body">
          {data.sedationMode === "continuous" && isPumpInfusionRoute ? (
          <div className="stack">
            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={data.cadPlacementAllowed}
                onChange={(event) => {
                  const checked = event.target.checked;
                  if (checked) {
                    onChange({
                      ...data,
                      cadPlacementAllowed: true,
                      cadSizeCharriere: defaultCadCharriereForGender(patientGender)
                    });
                  } else {
                    onChange({ ...data, cadPlacementAllowed: false });
                  }
                }}
              />
              Graag CAD plaatsen
            </label>
            {data.cadPlacementAllowed ? (
              <FormField label="Charrière maat">
                <select
                  value={data.cadSizeCharriere}
                  onChange={(event) =>
                    onChange({ ...data, cadSizeCharriere: Number(event.target.value) as 10 | 12 | 14 | 16 | 18 })
                  }
                >
                  <option value={10}>Ch 10</option>
                  <option value={12}>Ch 12 (standaard vrouw)</option>
                  <option value={14}>Ch 14 (standaard man)</option>
                  <option value={16}>Ch 16</option>
                  <option value={18}>Ch 18</option>
                </select>
              </FormField>
            ) : null}
          </div>
          ) : null}

          <FormField label="Afwijkend beleid / opmerkingen">
            <textarea value={data.remarks} onChange={(event) => onChange({ ...data, remarks: event.target.value })} />
          </FormField>
          <FormField label="Specifieke problemen / bijwerkingen">
            <textarea value={data.sideEffects} onChange={(event) => onChange({ ...data, sideEffects: event.target.value })} />
          </FormField>
        </div>
      </div>

      <GuidelinePanel title="Midazolam (Dormicum)" lines={midazolamGuidelinePanelText} />
    </section>
  );
}
