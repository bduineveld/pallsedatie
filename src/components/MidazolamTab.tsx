import { useMemo, useState } from "react";
import { midazolamConcentrations, productText } from "../data/concentrationOptions";
import { midazolamGuidelinePanelText } from "../data/guidelineText";
import { computeMidazolamSuggestionBundle } from "../domain/dosageSuggestions/midazolamSuggestions";
import { formatMedicalNumber } from "../domain/format/numberFormat";
import { MidazolamAdviceOption } from "../domain/guidelineLogic/midazolamLogic";
import { MidazolamFormData } from "../types/models";
import { FormField } from "./FormField";
import { GuidelinePanel } from "./GuidelinePanel";

const reasonIcon = "/icons/healthicons/inpatient-24px.svg";
const medicinesIcon = "/icons/healthicons/infusion-pump-24px.svg";
const notesIcon = "/icons/healthicons/clinical-f-24px.svg";

const diagnosisIndicationInputPlaceholder = "Typ of kies een suggestie";

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
    onChange({
      ...data,
      loadingDoseMg: formatMedicalNumber(option.loadingDoseMg),
      continueDoseMgPer24h: formatMedicalNumber(option.continueDoseMgPer24h),
      bolusMg: formatMedicalNumber(option.bolusMg),
      lockoutHours: formatMedicalNumber(option.lockoutHours)
    });
  };
  const riskStripeClass = bundle.adviceSummary.isMixedRisk
    ? "midazolam-advice-window--mixed"
    : bundle.adviceSummary.hasAnyRiskFactor
      ? "midazolam-advice-window--single"
      : "midazolam-advice-window--none";
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

      <div className="general-group">
        <SectionHeader iconSrc={medicinesIcon} title="Middel" />
        <div className="general-group-body">
          <div className="stack">
            <span className="form-label">{requiredLabel("Sedatie")}</span>
            <label className="checkbox-line">
              <input
                type="radio"
                name="midazolam-sedation-mode"
                checked={data.sedationMode === "continuous"}
                onChange={() => onChange({ ...data, sedationMode: "continuous" })}
              />
              Continue sedatie
            </label>
            <label className="checkbox-line">
              <input
                type="radio"
                name="midazolam-sedation-mode"
                checked={data.sedationMode === "intermittent"}
                onChange={() => onChange({ ...data, sedationMode: "intermittent" })}
              />
              Intermitterende sedatie
            </label>
          </div>

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
                  checked={data.ageOver70}
                  onChange={(event) => onChange({ ...data, ageOver70: event.target.checked })}
                />
                &gt;70jr
              </label>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={data.egfrUnder30}
                  onChange={(event) => onChange({ ...data, egfrUnder30: event.target.checked })}
                />
                Slechte nierfunctie (eGFR &lt;30)
              </label>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={data.hepaticImpairment}
                  onChange={(event) => onChange({ ...data, hepaticImpairment: event.target.checked })}
                />
                leverfunctiestoornis (cirrose/leverfalen)
              </label>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={data.cachexiaOrFrailty}
                  onChange={(event) => onChange({ ...data, cachexiaOrFrailty: event.target.checked })}
                />
                cachexie of fragiele patient
              </label>
            </div>
            <div className="stack">
              <span className="form-label">Indicatie hogere dosering</span>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={data.chronicBenzodiazepineUse}
                  onChange={(event) => onChange({ ...data, chronicBenzodiazepineUse: event.target.checked })}
                />
                chronisch benzodiazepinegebruik
              </label>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={data.alcoholUse}
                  onChange={(event) => onChange({ ...data, alcoholUse: event.target.checked })}
                />
                alcoholgebruik
              </label>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={data.severeAgitationDelirium}
                  onChange={(event) => onChange({ ...data, severeAgitationDelirium: event.target.checked })}
                />
                ernstige agitatie/delier
              </label>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={data.severeDyspneaAnxiety}
                  onChange={(event) => onChange({ ...data, severeDyspneaAnxiety: event.target.checked })}
                />
                ernstige dyspnoe of angst
              </label>
            </div>
          </div>

          {isContinuousSedation ? (
            <div className={`conversion-summary midazolam-advice-window ${riskStripeClass}`}>
              {bundle.adviceSummary.isMixedRisk ? (
                <section className="warning-banner">
                  {bundle.adviceSummary.combinedSelectionLine}
                </section>
              ) : (
                <p>{bundle.adviceSummary.combinedSelectionLine}</p>
              )}
              {bundle.adviceSummary.blocks.map((block) => (
                <div className="midazolam-advice-block" key={block.id}>
                  <p>
                    <strong>{block.heading}.</strong> {block.adviceLine}
                  </p>
                  <div className="segment">
                    <button type="button" onClick={() => applyMidazolamPreset(block.options[0])}>
                      {block.options[0].buttonLabel}
                    </button>
                    <button type="button" onClick={() => applyMidazolamPreset(block.options[1])}>
                      {block.options[1].buttonLabel}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {isContinuousSedation ? (
            <>
          <div className="grid-2">
            <FormField label="Oplaaddosis (mg)">
              <input value={data.loadingDoseMg} onChange={(event) => onChange({ ...data, loadingDoseMg: event.target.value })} />
            </FormField>
            <FormField label={requiredLabel("Continue dosis (mg/24u)")}>
              <input value={data.continueDoseMgPer24h} onChange={(event) => onChange({ ...data, continueDoseMgPer24h: event.target.value })} />
            </FormField>
            <FormField label={requiredLabel("Bolus (mg)")}>
              <input value={data.bolusMg} onChange={(event) => onChange({ ...data, bolusMg: event.target.value })} />
            </FormField>
            <FormField label="Lockouttijd (uur)">
              <input value={data.lockoutHours} onChange={(event) => onChange({ ...data, lockoutHours: event.target.value })} />
            </FormField>
            <FormField label={requiredLabel("Max. extra doses / 24 uur")}>
              <input
                value={data.maxExtraDosesPer24h}
                onChange={(event) => onChange({ ...data, maxExtraDosesPer24h: event.target.value })}
              />
            </FormField>
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

          {isIntermittentSedation ? (
            <>
              <h3>Intermitterende toediening</h3>
              <div className="grid-2">
                <FormField label={requiredLabel("Dosis per injectie (mg)")}>
                  <input
                    value={data.scheduledInjectionDoseMg}
                    onChange={(event) => onChange({ ...data, scheduledInjectionDoseMg: event.target.value })}
                  />
                </FormField>
                <FormField label={requiredLabel("Elke (uur)")}>
                  <input
                    value={data.scheduledInjectionIntervalHours}
                    onChange={(event) => onChange({ ...data, scheduledInjectionIntervalHours: event.target.value })}
                  />
                </FormField>
                <FormField label={requiredLabel("Extra dosis (mg)")}>
                  <input value={data.bolusMg} onChange={(event) => onChange({ ...data, bolusMg: event.target.value })} />
                </FormField>
                <FormField label={requiredLabel("Interval tussen extra doses (uur)")}>
                  <input value={data.lockoutHours} onChange={(event) => onChange({ ...data, lockoutHours: event.target.value })} />
                </FormField>
                <FormField label={requiredLabel("Max. extra doses / 24 uur")}>
                  <input
                    value={data.maxExtraDosesPer24h}
                    onChange={(event) => onChange({ ...data, maxExtraDosesPer24h: event.target.value })}
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
          {data.sedationMode === "continuous" ? (
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
