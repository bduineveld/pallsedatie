import { useMemo, useState } from "react";
import { morfineConcentrations, productText } from "../data/concentrationOptions";
import {
  localAssumptionText,
  morfineGuidelinePanelText,
  opioidConversionTableHeader
} from "../data/guidelineText";
import { opioidDisplayNames, opioidToMorphineScIvTable } from "../data/opioidRotationTable";
import { computeMorfineSuggestionBundle } from "../domain/dosageSuggestions/morfineSuggestions";
import { formatMedicalNumber } from "../domain/format/numberFormat";
import { ExistingOpioidEntry, MorfineFormData, OpioidKind } from "../types/models";
import { FormField } from "./FormField";
import { GuidelinePanel } from "./GuidelinePanel";
import { WarningBanner } from "./WarningBanner";

interface MorfineTabProps {
  data: MorfineFormData;
  onChange: (data: MorfineFormData) => void;
  showMlPerHour: boolean;
  onDiagnosisUserChange?: () => void;
  onDiagnosisBlur?: () => void;
}

const opioidOptions: { value: OpioidKind; label: string }[] = [
  { value: "morfine_oral", label: "Morfine oraal" },
  { value: "morfine_sciv", label: "Morfine s.c./i.v." },
  { value: "oxycodon_oral", label: "Oxycodon oraal" },
  { value: "oxycodon_sciv", label: "Oxycodon s.c./i.v." },
  { value: "hydromorfon_oral", label: "Hydromorfon oraal" },
  { value: "hydromorfon_sciv", label: "Hydromorfon s.c./i.v." },
  { value: "fentanyl_patch", label: "Fentanyl pleister (mcg/uur)" },
  { value: "buprenorfine_patch", label: "Buprenorfine pleister (mcg/uur)" },
  { value: "tramadol_oral", label: "Tramadol oraal" },
  { value: "tapentadol_oral", label: "Tapentadol oraal" },
  { value: "methadon_oral", label: "Methadon oraal" }
];

const morfineIndicationOptions = [
  "instabiele pijn",
  "frequente doorbraakpijn",
  "slikproblemen",
  "bewustzijnsdaling",
  "misselijkheid/braken",
  "ileus",
  "ernstige dyspnoe",
  "praktische reden"
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

export function MorfineTab({
  data,
  onChange,
  showMlPerHour,
  onDiagnosisUserChange,
  onDiagnosisBlur
}: MorfineTabProps) {
  const bundle = computeMorfineSuggestionBundle(data);
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
  const [opioidQuery, setOpioidQuery] = useState("");
  const [pendingOpioid, setPendingOpioid] = useState<OpioidKind | "">("");
  const [pendingDose, setPendingDose] = useState("");
  const [opioidMenuOpen, setOpioidMenuOpen] = useState(false);
  const [indicationMenuOpen, setIndicationMenuOpen] = useState(false);

  const conversionTableRows = [30, 60, 120, 180, 240, 360, 480].map((morphineOralDose) => {
    const getMatch = (opioid: OpioidKind) =>
      opioidToMorphineScIvTable
        .find((row) => row.opioid === opioid)
        ?.points.find((point) => point.yMorphineScIvMgPer24h === morphineOralDose / 3)?.xDose;

    return [
      String(morphineOralDose),
      String(morphineOralDose / 3),
      String(getMatch("fentanyl_patch") ?? "-"),
      String(getMatch("oxycodon_oral") ?? "-"),
      String(getMatch("hydromorfon_oral") ?? "-")
    ];
  });

  const filteredOpioids = useMemo(() => {
    const needle = opioidQuery.trim().toLowerCase();
    if (!needle) {
      return opioidOptions;
    }
    return opioidOptions.filter((option) =>
      option.label.toLowerCase().startsWith(needle)
    );
  }, [opioidQuery]);
  const filteredIndications = useMemo(() => {
    const needle = getIndicationSearchToken(data.indication);
    if (!needle) {
      return morfineIndicationOptions;
    }
    return morfineIndicationOptions.filter((option) => option.toLowerCase().includes(needle));
  }, [data.indication]);

  const unitForOpioid = (opioid: OpioidKind): string =>
    opioid === "fentanyl_patch" || opioid === "buprenorfine_patch" ? "mcg/uur" : "mg/24u";

  const buildContinuationAdviceFromExistingOpioids = (): string => {
    if (data.existingOpioids.length === 0) {
      return data.continuationAdvice;
    }

    const lines = data.existingOpioids.map((entry) => {
      const label = opioidDisplayNames[entry.opioid].toLowerCase();
      if (entry.opioid === "fentanyl_patch") {
        return "Verwijder direct fentanylpleister.";
      }
      if (entry.opioid === "buprenorfine_patch") {
        return "Verwijder direct buprenorfinepleister.";
      }
      return `Stop ${label}.`;
    });

    return lines.join("\n");
  };

  const lockoutForExistingHours = data.ageOver70 || data.egfrUnder30 ? 6 : 4;
  const convertedItems = bundle.conversion.items.filter(
    (item) => !Number.isNaN(item.morphineScIvMgPer24h)
  );
  const hasMorfineRiskFactor = data.ageOver70 || data.egfrUnder30;
  const morfineRiskStripeClass =
    data.opioidInputMode === "naive" && !hasMorfineRiskFactor
      ? "morfine-conversion-summary--green"
      : data.opioidInputMode === "existing" || (data.opioidInputMode === "naive" && hasMorfineRiskFactor)
          ? "morfine-conversion-summary--gold"
          : "";

  const applyCalculated24h = (targetMgPer24h: number) => {
    const bolus = targetMgPer24h / 6;
    onChange({
      ...data,
      continueDoseMgPer24h: formatMedicalNumber(targetMgPer24h),
      startBolusMg: formatMedicalNumber(bolus),
      bolusMg: formatMedicalNumber(bolus),
      lockoutHours: formatMedicalNumber(lockoutForExistingHours),
      continuationAdvice: buildContinuationAdviceFromExistingOpioids()
    });
  };

  const applyAdvice = () => {
    onChange({
      ...data,
      continueDoseMgPer24h: formatMedicalNumber(bundle.suggestions.continueDoseMgPer24h),
      startBolusMg: formatMedicalNumber(bundle.suggestions.startBolusMg),
      bolusMg: formatMedicalNumber(bundle.suggestions.bolusMg),
      lockoutHours: formatMedicalNumber(bundle.suggestions.lockoutHours)
    });
  };

  const addPendingOpioid = () => {
    if (!pendingOpioid || !pendingDose.trim()) {
      return;
    }
    const dose = Number(pendingDose);
    if (!Number.isFinite(dose) || dose <= 0) {
      return;
    }
    const entry: ExistingOpioidEntry = {
      id: crypto.randomUUID(),
      opioid: pendingOpioid,
      dosePer24h: dose,
      methadoneRatioChoice: 5
    };
    onChange({ ...data, existingOpioids: [...data.existingOpioids, entry] });
    setPendingOpioid("");
    setPendingDose("");
    setOpioidQuery("");
  };

  return (
    <section className="card">
      <h2>Uitvoeringsverzoek morfine met omreken functie</h2>

      <div className="general-group general-group--allow-overflow">
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

      <div className="general-group general-group--allow-overflow">
        <SectionHeader icon="💉" title="Middel" />
        <div className="general-group-body">
          <div className="grid-2">
          <FormField label="Middel en concentratie">
              <select
                value={data.concentrationMgPerMl}
                onChange={(event) =>
                  onChange({
                    ...data,
                    concentrationMgPerMl: Number(event.target.value) as 1 | 10 | 20
                  })
                }
              >
                {morfineConcentrations.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label.charAt(0).toUpperCase() + option.label.slice(1)}
                  </option>
                ))}
              </select>
          </FormField>
          <FormField label="Startdatum">
            <input type="date" value={data.startDate} onChange={(event) => onChange({ ...data, startDate: event.target.value })} />
          </FormField>
          </div>

          <div className="stack">
            <span className="form-label">{requiredLabel("Opioïdstatus")}</span>
            <label className="checkbox-line">
              <input
                type="radio"
                name="opioid-input-mode"
                checked={data.opioidInputMode === "naive"}
                onChange={() => onChange({ ...data, opioidInputMode: "naive" })}
              />
              Opioïd-naïef
            </label>
            <label className="checkbox-line">
              <input
                type="radio"
                name="opioid-input-mode"
                checked={data.opioidInputMode === "existing"}
                onChange={() => onChange({ ...data, opioidInputMode: "existing" })}
              />
              Reken om vanuit bestaande dosering
            </label>
          </div>

          <div className="stack">
            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={data.ageOver70}
                onChange={(event) => onChange({ ...data, ageOver70: event.target.checked })}
              />
              &gt;70 jaar
            </label>
            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={data.egfrUnder30}
                onChange={(event) => onChange({ ...data, egfrUnder30: event.target.checked })}
              />
              Slechte nierfunctie (eGFR &lt;30)
            </label>
          </div>

          {data.opioidInputMode === "existing" ? (
            <>
              <h3>Actuele opioïden</h3>
              <div className="opioid-picker">
                <div className="opioid-picker-inputs">
                  <div
                    className="autocomplete-wrapper"
                    onBlur={() => setTimeout(() => setOpioidMenuOpen(false), 120)}
                  >
                    <input
                      placeholder="Zoek opioïd"
                      value={opioidQuery}
                      onFocus={() => setOpioidMenuOpen(true)}
                      onChange={(event) => {
                        const value = event.target.value;
                        setOpioidQuery(value);
                        setOpioidMenuOpen(true);
                        const exact = opioidOptions.find((option) => option.label === value);
                        setPendingOpioid(exact ? exact.value : "");
                      }}
                    />
                    {opioidMenuOpen && filteredOpioids.length > 0 ? (
                      <div className="autocomplete-menu autocomplete-menu--compact">
                        {filteredOpioids.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className="autocomplete-item"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                              setPendingOpioid(option.value);
                              setOpioidQuery(option.label);
                              setOpioidMenuOpen(false);
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <input
                    type="number"
                    placeholder="Dosering"
                    value={pendingDose}
                    onChange={(event) => setPendingDose(event.target.value)}
                    disabled={!pendingOpioid}
                  />
                  <span className="small-muted">
                    {pendingOpioid ? unitForOpioid(pendingOpioid) : "mg/24u"}
                  </span>
                  <button type="button" onClick={addPendingOpioid}>
                    OK
                  </button>
                </div>
              </div>

              <div className="opioid-chip-list">
                {data.existingOpioids.map((entry) => (
                  <span className="opioid-chip" key={entry.id}>
                    {opioidDisplayNames[entry.opioid]} {formatMedicalNumber(entry.dosePer24h)} {unitForOpioid(entry.opioid)}
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...data,
                          existingOpioids: data.existingOpioids.filter((item) => item.id !== entry.id)
                        })
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </>
          ) : null}

          {data.opioidInputMode ? (
            <div className={`conversion-summary ${morfineRiskStripeClass}`}>
              <WarningBanner warnings={bundle.warnings} />
              {data.opioidInputMode === "naive" ? (
                <p>
                  Opioïd-naïef{data.ageOver70 ? " en >70 jaar" : ""}
                  {data.egfrUnder30 ? " met eGFR <30" : ""}. Advies: Oplaaddosis{" "}
                  {formatMedicalNumber(bundle.suggestions.startBolusMg)}mg, continue dosis{" "}
                  {formatMedicalNumber(bundle.suggestions.continueDoseMgPer24h)}mg/24u, bolus{" "}
                  {formatMedicalNumber(bundle.suggestions.bolusMg)}mg, lockout{" "}
                  {formatMedicalNumber(bundle.suggestions.lockoutHours)}uur.
                </p>
              ) : (
                <>
                  <div className="conversion-table-wrapper">
                    <table className="conversion-table">
                      <thead>
                        <tr>
                          <th>Huidig opioïd</th>
                          <th>Dosering</th>
                          <th>Morfine s.c.</th>
                          <th>Bolusdosis (⅙)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {convertedItems.map((item) => (
                          <tr key={`eq-${item.opioid}-${item.sourceDose}`}>
                            <td>{opioidDisplayNames[item.opioid]}</td>
                            <td>
                              {formatMedicalNumber(item.sourceDose)} {item.sourceUnit}
                            </td>
                            <td>{formatMedicalNumber(item.morphineScIvMgPer24h)} mg/24u</td>
                            <td />
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td>Totaal</td>
                          <td />
                          <td>{formatMedicalNumber(bundle.conversion.advice100PercentMgPer24h)} mg/24u</td>
                          <td>{formatMedicalNumber(bundle.conversion.advice100PercentMgPer24h / 6)} mg</td>
                        </tr>
                        <tr>
                          <td>75% (richtlijn)</td>
                          <td />
                          <td>{formatMedicalNumber(bundle.conversion.advice75PercentMgPer24h)} mg/24u</td>
                          <td>{formatMedicalNumber(bundle.conversion.advice75PercentMgPer24h / 6)} mg</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  {bundle.conversion.items
                    .filter((item) => item.usedInterpolation && item.interpolationNote)
                    .map((item) => (
                      <p key={item.opioid + item.sourceDose} className="small-muted">
                        Interpolatie: {item.interpolationNote}
                      </p>
                    ))}
                </>
              )}
              {data.opioidInputMode === "existing" ? (
                <div className="segment">
                  <button
                    type="button"
                    onClick={() => applyCalculated24h(bundle.conversion.advice75PercentMgPer24h)}
                  >
                    75% overnemen (richtlijn)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCalculated24h(bundle.conversion.advice100PercentMgPer24h)}
                  >
                    100% overnemen
                  </button>
                </div>
              ) : (
                <button type="button" onClick={applyAdvice}>
                  Advies overnemen
                </button>
              )}
            </div>
          ) : null}

          <h3>Pompinstellingen</h3>
          <div className="grid-2">
            <FormField label="Oplaaddosis (mg)">
              <input value={data.startBolusMg} onChange={(event) => onChange({ ...data, startBolusMg: event.target.value })} />
            </FormField>
            <FormField label={requiredLabel("Continue dosis (mg/24u)")}>
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
              ml/uur = (mg/24u / 24) / concentratie. Product: {productText.morfine}.
            </p>
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
        </div>
      </div>

      <div className="general-group">
        <SectionHeader icon="📝" title="Overig" />
        <div className="general-group-body">
          <FormField label="Advies voortzetten/stoppen opioïden">
            <textarea value={data.continuationAdvice} onChange={(event) => onChange({ ...data, continuationAdvice: event.target.value })} />
          </FormField>
          <FormField label="Afwijkend ophoogbeleid / opmerkingen">
            <textarea value={data.remarks} onChange={(event) => onChange({ ...data, remarks: event.target.value })} />
          </FormField>
          <FormField label="Specifieke problemen / bijwerkingen">
            <textarea value={data.sideEffects} onChange={(event) => onChange({ ...data, sideEffects: event.target.value })} />
          </FormField>
        </div>
      </div>

      <GuidelinePanel
        title="Morfine en opioïdrotatie"
        lines={morfineGuidelinePanelText}
        tableHeader={opioidConversionTableHeader}
        tableRows={conversionTableRows}
      />
      <GuidelinePanel title="Toelichting lokale aannames" lines={localAssumptionText} />
    </section>
  );
}
