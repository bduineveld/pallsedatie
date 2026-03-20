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
import { previewMorfinePdf, previewMidazolamPdf } from "../pdf/pdfFactory";

const settingsTabIcon = "/icons/healthicons/settings.svg";

type AppTab = "algemeen" | "morfine" | "midazolam" | "test-pdf" | "recepten" | "instellingen";
type FooterSectionId = "disclaimer" | "faq" | "privacy" | "bronnen" | "over";

function getTabFromHash(hash: string): AppTab | null {
  const normalized = hash.replace(/^#/, "").trim();
  if (
    normalized === "algemeen" ||
    normalized === "morfine" ||
    normalized === "midazolam" ||
    normalized === "test-pdf" ||
    normalized === "recepten" ||
    normalized === "instellingen"
  ) {
    return normalized;
  }
  return null;
}

function toHashForTab(tab: AppTab): string {
  return tab === "algemeen" ? "" : tab;
}

export function App() {
  const PHYSICIAN_STORAGE_KEY = "pallsedatie.savedPhysician";
  const ORGANIZATION_STORAGE_KEY = "pallsedatie.savedOrganizations";
  const PHARMACY_STORAGE_KEY = "pallsedatie.savedPharmacies";
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
  const [activeFooterSection, setActiveFooterSection] = useState<FooterSectionId | null>(null);
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
  const footerSections = [
    {
      id: "disclaimer" as const,
      heading: "Disclaimer",
      body:
        "Deze tool is bedoeld als ondersteuning bij het opstellen van een uitvoeringsverzoek. De uitkomst blijft een suggestie: de voorschrijver beoordeelt altijd zelf indicatie, dosering, contra-indicaties, interacties en de uiteindelijke tekst. Controleer daarom het document altijd volledig voordat je ondertekent of deelt."
    },
    {
      id: "faq" as const,
      heading: "FAQ",
      body:
        "Gebruik de tabs om stap voor stap gegevens in te vullen. Download pas na controle van dosering en tekst. In Instellingen kun je lokale profielgegevens wissen."
    },
    {
      id: "privacy" as const,
      heading: "Privacy",
      body:
        "Patiëntgegevens die je invult blijven in je browser en worden niet naar de server gestuurd. Er is geen serveropslag van patiëntinformatie. Alleen als je dat zelf kiest, worden profielgegevens zoals zorgverlener/instelling/apotheek lokaal op dit apparaat bewaard en kun je die in Instellingen weer wissen."
    },
    {
      id: "bronnen" as const,
      heading: "Bronnen & Richtlijnen",
      body:
        "Suggesties zijn gebaseerd op de gebruikte Pallialine-richtlijnen. Controleer altijd of de lokale protocollen en meest recente richtlijnversies overeenkomen."
    },
    {
      id: "over" as const,
      heading: "Over deze tool",
      body:
        "Pallsedatie.nl is bedoeld als praktische ondersteuning voor zorgprofessionals bij palliatieve zorg, met transparante invoer en lokaal gegenereerde output."
    }
  ];
  const currentFooterSection =
    activeFooterSection === null
      ? null
      : footerSections.find((section) => section.id === activeFooterSection) ?? null;
  const startYear = 2026;
  const currentYear = new Date().getFullYear();
  const copyrightYearLabel =
    currentYear === startYear ? String(startYear) : `${startYear}-${currentYear}`;

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

  const clearBrowserStoredProfiles = () => {
    if (typeof window === "undefined") {
      return;
    }
    const confirmed = window.confirm(
      "Weet je zeker dat je alle lokaal opgeslagen zorgverlener-, instelling- en apotheekgegevens wilt wissen?"
    );
    if (!confirmed) {
      return;
    }
    window.localStorage.removeItem(PHYSICIAN_STORAGE_KEY);
    window.localStorage.removeItem(ORGANIZATION_STORAGE_KEY);
    window.localStorage.removeItem(PHARMACY_STORAGE_KEY);
  };

  const setTab = (tab: AppTab) => {
    if (tab === activeTab) {
      return;
    }
    const currentUrl = new URL(window.location.href);
    currentUrl.hash = toHashForTab(tab);
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
    currentUrl.hash = toHashForTab(activeTab);
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
      <form autoComplete="off" onSubmit={(event) => event.preventDefault()}>
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
            className={`${activeTab === "test-pdf" ? "active" : ""}`}
            onClick={() => setTab("test-pdf")}
          >
            Test PDF
          </button>
          <button
            type="button"
            className={`${activeTab === "recepten" ? "active" : ""} tab-button-recepten`}
            onClick={() => setTab("recepten")}
          >
            Recepten
          </button>
          <button
            type="button"
            className={`${activeTab === "instellingen" ? "active" : ""}`}
            onClick={() => setTab("instellingen")}
            title="Instellingen"
            aria-label="Instellingen"
          >
            <img src={settingsTabIcon} alt="" className="button-icon settings-tab-icon" aria-hidden="true" />
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
                  previewMorfinePdf(state);
                  setHasDownloadedMorfine(true);
                }}
                onDownloadMidazolam={() => {
                  previewMidazolamPdf(state);
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
                onDownloadMorfine={() => {
                  previewMorfinePdf(state);
                  setHasDownloadedMorfine(true);
                }}
                onDownloadMidazolam={() => {
                  previewMidazolamPdf(state);
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
          {activeTab === "test-pdf" ? (
            <section className="card">
              <h2>Test PDF</h2>
              <p className="small-muted">
                Genereer een testversie van de PDF zonder verplichte veldencontrole. Alleen bedoeld voor testen,
                niet voor officieel gebruik.
              </p>
              <div className="flow-buttons">
                <button
                  type="button"
                  onClick={() => {
                    previewMorfinePdf(state);
                    setHasDownloadedMorfine(true);
                  }}
                >
                  <img src="/morfine.svg" alt="" className="button-icon" aria-hidden="true" />
                  Genereer test PDF morfine
                </button>
                <button
                  type="button"
                  onClick={() => {
                    previewMidazolamPdf(state);
                    setHasDownloadedMidazolam(true);
                  }}
                >
                  <img src="/midazolam.svg" alt="" className="button-icon" aria-hidden="true" />
                  Genereer test PDF midazolam
                </button>
              </div>
            </section>
          ) : null}
          {activeTab === "instellingen" ? (
            <section className="card">
              <h2>Privacy-instellingen</h2>
              <p className="small-muted">
                Je kunt hier lokaal opgeslagen profielgegevens verwijderen
                (zorgverlener, instelling en apotheek).
              </p>
              <button
                type="button"
                className="secondary-action-button"
                onClick={clearBrowserStoredProfiles}
              >
                Wis lokaal opgeslagen gegevens
              </button>
            </section>
          ) : null}
        </div>
      </form>
      <footer className="site-footer" aria-label="Juridische informatie en toelichting">
        <div className="site-footer-tabs" role="tablist" aria-label="Footer informatie">
          {footerSections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={section.id === activeFooterSection ? "active" : ""}
              role="tab"
              aria-selected={section.id === activeFooterSection}
              onClick={() =>
                setActiveFooterSection((previous) =>
                  previous === section.id ? null : section.id
                )
              }
            >
              {section.heading}
            </button>
          ))}
        </div>
        {currentFooterSection ? (
          <section className="site-footer-panel" role="tabpanel" aria-live="polite">
            <h2>{currentFooterSection.heading}</h2>
            <p>{currentFooterSection.body}</p>
          </section>
        ) : null}
        <p className="site-footer-copyright">
          {"\u00A9"} {copyrightYearLabel}{" "}
          <a href="https://dokterbart.nl" target="_blank" rel="noopener noreferrer">
            dokterbart.nl
          </a>
        </p>
      </footer>
    </main>
  );
}
