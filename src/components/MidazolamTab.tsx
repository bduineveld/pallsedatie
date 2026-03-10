import { midazolamConcentrations, productText } from "../data/concentrationOptions";
import { midazolamGuidelinePanelText } from "../data/guidelineText";
import { computeMidazolamSuggestionBundle } from "../domain/dosageSuggestions/midazolamSuggestions";
import { formatMedicalNumber } from "../domain/format/numberFormat";
import { MidazolamFormData } from "../types/models";
import { FormField } from "./FormField";
import { GuidelinePanel } from "./GuidelinePanel";

interface MidazolamTabProps {
  data: MidazolamFormData;
  onChange: (data: MidazolamFormData) => void;
  showMlPerHour: boolean;
  patientGender: string;
  onDiagnosisUserChange?: () => void;
  onDiagnosisBlur?: () => void;
}

export function MidazolamTab({
  data,
  onChange,
  showMlPerHour,
  patientGender,
  onDiagnosisUserChange,
  onDiagnosisBlur
}: MidazolamTabProps) {
  const bundle = computeMidazolamSuggestionBundle(data);
  const resetToSuggestion = () => {
    onChange({
      ...data,
      loadingDoseMg: formatMedicalNumber(bundle.suggestions.loadingDoseMg),
      continueDoseMgPer24h: formatMedicalNumber(bundle.suggestions.continueDoseMgPer24h),
      bolusMg: formatMedicalNumber(bundle.suggestions.bolusMg),
      lockoutHours: formatMedicalNumber(bundle.suggestions.lockoutHours),
      cadSizeCharriere:
        patientGender.toLowerCase().includes("man") ? 14 : 12
    });
  };

  return (
    <section className="card">
      <h2>Midazolam (Dormicum)</h2>
      <div className="grid-2">
        <FormField label="Diagnose / ziektebeeld">
          <input
            value={data.diagnosis}
            onChange={(event) => {
              onDiagnosisUserChange?.();
              onChange({ ...data, diagnosis: event.target.value });
            }}
            onBlur={onDiagnosisBlur}
          />
        </FormField>
        <FormField label="Indicatie / refractair symptoom">
          <input value={data.indication} onChange={(event) => onChange({ ...data, indication: event.target.value })} />
        </FormField>
        <FormField label="Startdatum">
          <input type="date" value={data.startDate} onChange={(event) => onChange({ ...data, startDate: event.target.value })} />
        </FormField>
      </div>

      <div className="grid-2">
        <FormField label="Concentratie">
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
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <div className="grid-2">
        <FormField label="Start/loading dose (mg)">
          <input value={data.loadingDoseMg} onChange={(event) => onChange({ ...data, loadingDoseMg: event.target.value })} />
        </FormField>
        <FormField label="Continue dosis (mg/24u)">
          <input value={data.continueDoseMgPer24h} onChange={(event) => onChange({ ...data, continueDoseMgPer24h: event.target.value })} />
        </FormField>
        <FormField label="Bolus (mg)">
          <input value={data.bolusMg} onChange={(event) => onChange({ ...data, bolusMg: event.target.value })} />
        </FormField>
        <FormField label="Lockout (uur)">
          <input value={data.lockoutHours} onChange={(event) => onChange({ ...data, lockoutHours: event.target.value })} />
        </FormField>
      </div>

      {showMlPerHour ? (
        <p className="small-muted">
          ml/uur = mg/uur / concentratie. Product: {productText.midazolam}.
        </p>
      ) : null}
      <p className="small-muted">{bundle.suggestions.explanation}</p>
      <button type="button" onClick={resetToSuggestion}>
        Reset naar richtlijnsuggestie
      </button>

      <div className="stack">
        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={data.cadPlacementAllowed}
            onChange={(event) => onChange({ ...data, cadPlacementAllowed: event.target.checked })}
          />
          CAD plaatsing toegestaan
        </label>
        <FormField label="CAD Charrière maat">
          <select
            value={data.cadSizeCharriere}
            onChange={(event) =>
              onChange({ ...data, cadSizeCharriere: Number(event.target.value) as 12 | 14 | 16 })
            }
          >
            <option value={12}>Ch 12 (standaard vrouw)</option>
            <option value={14}>Ch 14 (standaard man)</option>
            <option value={16}>Ch 16</option>
          </select>
        </FormField>
        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={data.escalation50PercentAgreement}
            onChange={(event) => onChange({ ...data, escalation50PercentAgreement: event.target.checked })}
          />
          Akkoord met 50% ophoogbeleid
        </label>
      </div>

      <FormField label="Afwijkend beleid / opmerkingen">
        <textarea value={data.remarks} onChange={(event) => onChange({ ...data, remarks: event.target.value })} />
      </FormField>
      <FormField label="Specifieke problemen / bijwerkingen">
        <textarea value={data.sideEffects} onChange={(event) => onChange({ ...data, sideEffects: event.target.value })} />
      </FormField>

      <GuidelinePanel title="Midazolam (Dormicum)" lines={midazolamGuidelinePanelText} />
    </section>
  );
}
