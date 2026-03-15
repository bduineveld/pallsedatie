import { useEffect, useMemo, useState } from "react";
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

function getTabFromHash(hash: string): AppTab | null {
  const normalized = hash.replace(/^#/, "").trim();
  if (
    normalized === "algemeen" ||
    normalized === "morfine" ||
    normalized === "midazolam" ||
    normalized === "recepten"
  ) {
    return normalized;
  }
  return null;
}

export function App() {
  const [state, setState] = useState(defaultState);
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    if (typeof window === "undefined") {
      return "algemeen";
    }
    return getTabFromHash(window.location.hash) ?? "algemeen";
  });
  const [confirmMorfinePdf, setConfirmMorfinePdf] = useState(false);
  const [confirmMidazolamPdf, setConfirmMidazolamPdf] = useState(false);
  const [hasDownloadedMorfine, setHasDownloadedMorfine] = useState(false);
  const [hasDownloadedMidazolam, setHasDownloadedMidazolam] = useState(false);
  const [diagnosisDirty, setDiagnosisDirty] = useState({
    morfine: false,
    midazolam: false
  });
  const readiness = useMemo(() => getPdfReadiness(state), [state]);
  const adviceBlocks = useMemo(
    () =>
      buildPrescriptionAdvice(
        { ...state, general: { ...state.general, mode: "combination" } },
        { includeMorfine: hasDownloadedMorfine, includeMidazolam: hasDownloadedMidazolam }
      ),
    [state, hasDownloadedMorfine, hasDownloadedMidazolam]
  );
  const algemeenComplete = validateSharedForPdf(state).length === 0;

  const handleGeneralChange = (general: typeof state.general) => {
    const autoOver70 = isOlderThan70(general.patient.birthDate);
    setState({
      ...state,
      general,
      morfine: { ...state.morfine, ageOver70: autoOver70 },
      midazolam: { ...state.midazolam, ageOver70: autoOver70 }
    });
  };

  const handleMorfineChange = (morfine: typeof state.morfine) => {
    setState({
      ...state,
      morfine,
      midazolam: {
        ...state.midazolam,
        ageOver70: morfine.ageOver70,
        egfrUnder30: morfine.egfrUnder30
      }
    });
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

  const setTab = (tab: AppTab) => {
    if (tab === activeTab) {
      return;
    }
    const currentUrl = new URL(window.location.href);
    currentUrl.hash = tab;
    window.history.pushState({ tab }, "", currentUrl.toString());
    setActiveTab(tab);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const currentHashTab = getTabFromHash(window.location.hash);
    if (currentHashTab === activeTab) {
      return;
    }
    const currentUrl = new URL(window.location.href);
    currentUrl.hash = activeTab;
    window.history.replaceState({ tab: activeTab }, "", currentUrl.toString());
  }, [activeTab]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const onPopState = () => {
      setActiveTab(getTabFromHash(window.location.hash) ?? "algemeen");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <main className="app-shell">
      <header className="app-brand">
        <img src="/pallsedatie-logo.svg" alt="Pallsedatie logo" className="app-brand-logo" />
        <h1 className="app-brand-subtitle">uitvoeringsverzoek generator</h1>
      </header>
      <div className="content-with-tabs">
        <div className="paper-tabs">
          <button
            type="button"
            className={`${activeTab === "algemeen" ? "active" : ""} ${algemeenComplete ? "is-complete" : ""}`.trim()}
            onClick={() => setTab("algemeen")}
          >
            Algemeen
          </button>
          <button
            type="button"
            className={`${activeTab === "morfine" ? "active" : ""} ${readiness.morfineReady.valid ? "is-complete" : ""}`.trim()}
            onClick={() => setTab("morfine")}
          >
            <img src="/morfine.svg" alt="" className="button-icon" aria-hidden="true" />
            Morfine
          </button>
          <button
            type="button"
            className={`${activeTab === "midazolam" ? "active" : ""} ${readiness.midazolamReady.valid ? "is-complete" : ""}`.trim()}
            onClick={() => setTab("midazolam")}
          >
            <img src="/midazolam.svg" alt="" className="button-icon" aria-hidden="true" />
            Midazolam
          </button>
          <button
            type="button"
            className={`${activeTab === "recepten" ? "active" : ""} tab-button-recepten`}
            onClick={() => setTab("recepten")}
          >
            Recepten
          </button>
        </div>
      {activeTab === "algemeen" ? (
        <>
          <GeneralSection data={state.general} onChange={handleGeneralChange} />
          <div className="flow-buttons">
            <button type="button" onClick={() => setTab("morfine")}>
              <img src="/morfine.svg" alt="" className="button-icon" aria-hidden="true" />
              Door naar morfine
            </button>
            <button type="button" onClick={() => setTab("midazolam")}>
              <img src="/midazolam.svg" alt="" className="button-icon" aria-hidden="true" />
              Door naar midazolam
            </button>
          </div>
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
            onDownloadMorfine={() => {
              downloadMorfinePdf(state);
              setHasDownloadedMorfine(true);
            }}
            onDownloadMidazolam={() => {
              downloadMidazolamPdf(state);
              setHasDownloadedMidazolam(true);
            }}
          />
          <div className="flow-buttons">
            <button type="button" onClick={() => setTab("midazolam")}>
              <img src="/midazolam.svg" alt="" className="button-icon" aria-hidden="true" />
              Door naar midazolam
            </button>
            <button type="button" onClick={() => setTab("recepten")}>
              Recepten
            </button>
          </div>
        </>
      ) : null}

      {activeTab === "midazolam" ? (
        <>
          <MidazolamTab
            data={state.midazolam}
            onChange={handleMidazolamChange}
            showMlPerHour={state.general.showMlPerHour}
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
            onDownloadMorfine={() => {
              downloadMorfinePdf(state);
              setHasDownloadedMorfine(true);
            }}
            onDownloadMidazolam={() => {
              downloadMidazolamPdf(state);
              setHasDownloadedMidazolam(true);
            }}
          />
          <div className="flow-buttons">
            <button type="button" onClick={() => setTab("recepten")}>
              Recepten
            </button>
          </div>
        </>
      ) : null}
      {activeTab === "recepten" ? (
        <>
          <PrescriptionAdvice blocks={adviceBlocks} />
        </>
      ) : null}
      </div>
    </main>
  );
}
