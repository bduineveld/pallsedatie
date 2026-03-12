import { midazolamConcentrations, productText } from "../data/concentrationOptions";
import { midazolamGuidelinePanelText } from "../data/guidelineText";
import { computeMidazolamSuggestionBundle } from "../domain/dosageSuggestions/midazolamSuggestions";
import { formatMedicalNumber } from "../domain/format/numberFormat";
import { MidazolamAdviceOption } from "../domain/guidelineLogic/midazolamLogic";
import { MidazolamFormData } from "../types/models";
import { FormField } from "./FormField";
import { GuidelinePanel } from "./GuidelinePanel";

interface MidazolamTabProps {
  data: MidazolamFormData;
  onChange: (data: MidazolamFormData) => void;
  showMlPerHour: boolean;
  onDiagnosisUserChange?: () => void;
  onDiagnosisBlur?: () => void;
}

export function MidazolamTab({
  data,
  onChange,
  showMlPerHour,
  onDiagnosisUserChange,
  onDiagnosisBlur
}: MidazolamTabProps) {
  const bundle = computeMidazolamSuggestionBundle(data);
  const requiredLabel = (text: string) => (
    <>
      {text} <span className="required-mark">*</span>
    </>
  );
  const SectionHeader = ({ icon, title }: { icon: string; title: string }) => (
    <div className="general-group-header">
      <span className="general-group-icon" aria-hidden="true">
        {icon}
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

  return (
    <section className="card">
      <h2>Midazolam (Dormicum)</h2>

      <div className="general-group">
        <SectionHeader icon="📌" title="Reden" />
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
              <input value={data.indication} onChange={(event) => onChange({ ...data, indication: event.target.value })} />
            </FormField>
          </div>
        </div>
      </div>

      <div className="general-group">
        <SectionHeader icon="💉" title="Middel" />
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
              <input type="date" value={data.startDate} onChange={(event) => onChange({ ...data, startDate: event.target.value })} />
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
            <p className={bundle.adviceSummary.isMixedRisk ? "midazolam-mixed-warning" : undefined}>
              {bundle.adviceSummary.combinedSelectionLine}
            </p>
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
        <SectionHeader icon="📝" title="Overig" />
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
