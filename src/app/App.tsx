import { useMemo, useState } from "react";
import { defaultState } from "./defaultState";
import { GeneralSection } from "../components/GeneralSection";
import { MidazolamTab } from "../components/MidazolamTab";
import { MorfineTab } from "../components/MorfineTab";
import { PdfActions } from "../components/PdfActions";
import { PrescriptionAdvice } from "../components/PrescriptionAdvice";
import { buildPrescriptionAdvice } from "../domain/prescriptionAdvice/buildAdvice";
import { isOlderThan70 } from "../domain/validation/age";
import { validateSharedForPdf } from "../domain/validation/formValidation";
import { getPdfReadiness } from "../domain/validation/pdfReadiness";
import { downloadMorfinePdf, downloadMidazolamPdf } from "../pdf/pdfFactory";

type AppTab = "algemeen" | "morfine" | "midazolam" | "recepten";

export function App() {
  const [state, setState] = useState(defaultState);
  const [activeTab, setActiveTab] = useState<AppTab>("algemeen");
  const [confirmMorfinePdf, setConfirmMorfinePdf] = useState(false);
  const [confirmMidazolamPdf, setConfirmMidazolamPdf] = useState(false);
  const [diagnosisDirty, setDiagnosisDirty] = useState({
    morfine: false,
    midazolam: false
  });
  const readiness = useMemo(() => getPdfReadiness(state), [state]);
  const adviceBlocks = useMemo(
    () => buildPrescriptionAdvice({ ...state, general: { ...state.general, mode: "combination" } }),
    [state]
  );
  const algemeenComplete = validateSharedForPdf(state).length === 0;

  const handleGeneralChange = (general: typeof state.general) => {
    const autoOver70 = isOlderThan70(general.patient.birthDate);
    setState({
      ...state,
      general,
      morfine: { ...state.morfine, ageOver70: autoOver70 }
    });
  };

  const handleMorfineChange = (morfine: typeof state.morfine) => {
    setState({ ...state, morfine });
  };

  const handleMidazolamChange = (midazolam: typeof state.midazolam) => {
    setState({ ...state, midazolam });
  };

  const handleMorfineDiagnosisBlur = () => {
    if (diagnosisDirty.midazolam) {
      return;
    }
    setState((prev) => ({
      ...prev,
      midazolam: { ...prev.midazolam, diagnosis: prev.morfine.diagnosis }
    }));
  };

  const handleMidazolamDiagnosisBlur = () => {
    if (diagnosisDirty.morfine) {
      return;
    }
    setState((prev) => ({
      ...prev,
      morfine: { ...prev.morfine, diagnosis: prev.midazolam.diagnosis }
    }));
  };

  return (
    <main className="app-shell">
      <h1>Pallsedatie.nl - Uitvoeringsverzoek generator</h1>
      <section className="card">
        <div className="segment">
          <button type="button" className={activeTab === "algemeen" ? "active" : ""} onClick={() => setActiveTab("algemeen")}>
            Algemeen {algemeenComplete ? "✅" : ""}
          </button>
          <button type="button" className={activeTab === "morfine" ? "active" : ""} onClick={() => setActiveTab("morfine")}>
            Morfine {readiness.morfineReady.valid ? "✅" : ""}
          </button>
          <button type="button" className={activeTab === "midazolam" ? "active" : ""} onClick={() => setActiveTab("midazolam")}>
            Midazolam {readiness.midazolamReady.valid ? "✅" : ""}
          </button>
          <button type="button" className={activeTab === "recepten" ? "active" : ""} onClick={() => setActiveTab("recepten")}>
            Te maken recepten
          </button>
        </div>
      </section>

      {activeTab === "algemeen" ? (
        <>
          <GeneralSection data={state.general} onChange={handleGeneralChange} />
          <section className="card">
            <div className="segment">
              <button type="button" onClick={() => setActiveTab("morfine")}>
                Door naar morfine
              </button>
              <button type="button" onClick={() => setActiveTab("midazolam")}>
                Door naar midazolam
              </button>
            </div>
          </section>
        </>
      ) : null}

      {activeTab === "morfine" ? (
        <>
          <MorfineTab
            data={state.morfine}
            onChange={handleMorfineChange}
            showMlPerHour={state.general.showMlPerHour}
            onDiagnosisUserChange={() =>
              setDiagnosisDirty((prev) => ({ ...prev, morfine: true }))
            }
            onDiagnosisBlur={handleMorfineDiagnosisBlur}
          />
          <PdfActions
            mode="morfine"
            confirmMorfinePdf={confirmMorfinePdf}
            confirmMidazolamPdf={confirmMidazolamPdf}
            onToggleConfirmMorfinePdf={setConfirmMorfinePdf}
            onToggleConfirmMidazolamPdf={setConfirmMidazolamPdf}
            canDownloadMorfine={readiness.morfineReady.valid}
            canDownloadMidazolam={readiness.midazolamReady.valid}
            morfineErrors={readiness.morfineReady.errors}
            midazolamErrors={readiness.midazolamReady.errors}
            onDownloadMorfine={() => downloadMorfinePdf(state)}
            onDownloadMidazolam={() => downloadMidazolamPdf(state)}
          />
          <section className="card">
            <button type="button" onClick={() => setActiveTab("recepten")}>
              Te maken recepten
            </button>
          </section>
        </>
      ) : null}

      {activeTab === "midazolam" ? (
        <>
          <MidazolamTab
            data={state.midazolam}
            onChange={handleMidazolamChange}
            showMlPerHour={state.general.showMlPerHour}
            patientGender={state.general.patient.gender}
            onDiagnosisUserChange={() =>
              setDiagnosisDirty((prev) => ({ ...prev, midazolam: true }))
            }
            onDiagnosisBlur={handleMidazolamDiagnosisBlur}
          />
          <PdfActions
            mode="midazolam"
            confirmMorfinePdf={confirmMorfinePdf}
            confirmMidazolamPdf={confirmMidazolamPdf}
            onToggleConfirmMorfinePdf={setConfirmMorfinePdf}
            onToggleConfirmMidazolamPdf={setConfirmMidazolamPdf}
            canDownloadMorfine={readiness.morfineReady.valid}
            canDownloadMidazolam={readiness.midazolamReady.valid}
            morfineErrors={readiness.morfineReady.errors}
            midazolamErrors={readiness.midazolamReady.errors}
            onDownloadMorfine={() => downloadMorfinePdf(state)}
            onDownloadMidazolam={() => downloadMidazolamPdf(state)}
          />
          <section className="card">
            <button type="button" onClick={() => setActiveTab("recepten")}>
              Te maken recepten
            </button>
          </section>
        </>
      ) : null}
      {activeTab === "recepten" ? (
        <>
          <PdfActions
            mode="combination"
            confirmMorfinePdf={confirmMorfinePdf}
            confirmMidazolamPdf={confirmMidazolamPdf}
            onToggleConfirmMorfinePdf={setConfirmMorfinePdf}
            onToggleConfirmMidazolamPdf={setConfirmMidazolamPdf}
            canDownloadMorfine={readiness.morfineReady.valid}
            canDownloadMidazolam={readiness.midazolamReady.valid}
            morfineErrors={readiness.morfineReady.errors}
            midazolamErrors={readiness.midazolamReady.errors}
            onDownloadMorfine={() => downloadMorfinePdf(state)}
            onDownloadMidazolam={() => downloadMidazolamPdf(state)}
          />
          <PrescriptionAdvice blocks={adviceBlocks} />
        </>
      ) : null}
    </main>
  );
}
