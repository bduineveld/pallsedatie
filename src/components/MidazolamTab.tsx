import { useMemo, useState } from "react";
import { midazolamConcentrations, productText } from "../data/concentrationOptions";
import { midazolamGuidelinePanelText } from "../data/guidelineText";
import { computeMidazolamSuggestionBundle } from "../domain/dosageSuggestions/midazolamSuggestions";
import { formatMedicalNumber } from "../domain/format/numberFormat";
import { MidazolamAdviceOption } from "../domain/guidelineLogic/midazolamLogic";
import { MidazolamFormData } from "../types/models";
import { FormField } from "./FormField";
import { GuidelinePanel } from "./GuidelinePanel";

const reasonIcon = "/icons/healthicons/inpatient.svg";
const medicinesIcon = "/icons/healthicons/prescription-document.svg";
const notesIcon = "/icons/healthicons/clinical-fe.svg";

interface MidazolamTabProps {
  data: MidazolamFormData;
  onChange: (data: MidazolamFormData) => void;
  showMlPerHour: boolean;
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

function getIndicationSearchToken(value: string): string {
  const parts = value.split(",");
  return (parts[parts.length - 1] ?? "").trim().toLowerCase();
}

function applyIndicationSelection(currentValue: string, option: string): string {
  const parts = currentValue.split(",");
  const previousSelections = parts
    .slice(0, -1)
    .map((part) => part.trim())
    .filter(Boolean);
  return [...previousSelections, option].join(", ");
}

export function MidazolamTab({
  data,
  onChange,
  showMlPerHour,
  onDiagnosisUserChange,
  onDiagnosisBlur
}: MidazolamTabProps) {
  const bundle = computeMidazolamSuggestionBundle(data);
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
  const filteredIndications = useMemo(() => {
    const needle = getIndicationSearchToken(data.indication);
    if (!needle) {
      return midazolamIndicationOptions;
    }
    return midazolamIndicationOptions.filter((option) => option.toLowerCase().includes(needle));
  }, [data.indication]);

  return (
    <section className="card">
      <h2>Uitvoeringsverzoek midazolam, eventueel verzoek CAD</h2>

      <div className="general-group general-group--allow-overflow">
        <SectionHeader iconSrc={reasonIcon} title="Reden" />
        <div className="general-group-body">
          <div className="grid-2">
            <FormField label={requiredLabel("Diagnose / ziektebeeld")}>
              <input
                value={data.diagnosis}
                onChange={(event) => {
                  onDiagnosisUserChange?.();
                  onChange({ ...data, diagnosis: event.target.value });
                }}
                onBlur={onDiagnosisBlur}
              />
            </FormField>
            <FormField label={requiredLabel("Indicatie / refractair symptoom")}>
              <div
                className="autocomplete-wrapper"
                onBlur={() => setTimeout(() => setIndicationMenuOpen(false), 120)}
              >
                <input
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
                            indication: applyIndicationSelection(data.indication, option)
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
          </div>

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

          {showMlPerHour ? (
            <p className="small-muted">
              ml/uur = mg/uur / concentratie. Product: {productText.midazolam}.
            </p>
          ) : null}
          <p className="small-muted">{bundle.suggestions.explanation}</p>
        </div>
      </div>

      <div className="general-group">
        <SectionHeader iconSrc={notesIcon} title="Overig" />
        <div className="general-group-body">
          <div className="stack">
            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={data.cadPlacementAllowed}
                onChange={(event) => onChange({ ...data, cadPlacementAllowed: event.target.checked })}
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
