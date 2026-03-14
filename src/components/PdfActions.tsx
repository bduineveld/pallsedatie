interface PdfActionsProps {
  mode: "morfine" | "midazolam" | "combination";
  canDownloadMorfine: boolean;
  canDownloadMidazolam: boolean;
  confirmMorfinePdf: boolean;
  confirmMidazolamPdf: boolean;
  onToggleConfirmMorfinePdf: (checked: boolean) => void;
  onToggleConfirmMidazolamPdf: (checked: boolean) => void;
  morfineErrors: string[];
  midazolamErrors: string[];
  onDownloadMorfine: () => void;
  onDownloadMidazolam: () => void;
}

export function PdfActions({
  mode,
  canDownloadMorfine,
  canDownloadMidazolam,
  confirmMorfinePdf,
  confirmMidazolamPdf,
  onToggleConfirmMorfinePdf,
  onToggleConfirmMidazolamPdf,
  morfineErrors,
  midazolamErrors,
  onDownloadMorfine,
  onDownloadMidazolam
}: PdfActionsProps) {
  if (mode === "combination") {
    return null;
  }

  const legalConfirmationTextMorfine =
    "Deze tool geeft een suggestie op basis van de Pallialine-richtlijn Pijn bij patiënten met kanker (december 2019). Ik blijf als voorschrijver volledig verantwoordelijk voor indicatie, dosering en uiteindelijke inhoud van het uitvoeringsverzoek. Ik lees het nog één keer door voordat ik hem onderteken.";
  const legalConfirmationTextMidazolam =
    "Deze tool geeft een suggestie op basis van de Pallialine-richtlijn Palliatieve sedatie (juni 2022). Ik blijf als voorschrijver volledig verantwoordelijk voor indicatie, dosering en uiteindelijke inhoud van het uitvoeringsverzoek. Ik lees het nog één keer door voordat ik hem onderteken.";

  return (
    <section className="card">
      {mode === "morfine" && (
        <div className="stack">
          <h2>Download uitvoeringsverzoek morfine</h2>
          <div className="legal">
            <p>{legalConfirmationTextMorfine}</p>
            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={confirmMorfinePdf}
                onChange={(event) => onToggleConfirmMorfinePdf(event.target.checked)}
              />
              ik begrijp het
            </label>
          </div>
          <button
            type="button"
            disabled={!canDownloadMorfine || !confirmMorfinePdf}
            onClick={onDownloadMorfine}
          >
            Download uitvoeringsverzoek morfine
          </button>
          {morfineErrors.length > 0 ? <small className="error">{morfineErrors.join(" ")}</small> : null}
        </div>
      )}
      {mode === "midazolam" && (
        <div className="stack">
          <h2>Download uitvoeringsverzoek midazolam</h2>
          <div className="legal">
            <p>{legalConfirmationTextMidazolam}</p>
            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={confirmMidazolamPdf}
                onChange={(event) => onToggleConfirmMidazolamPdf(event.target.checked)}
              />
              ik begrijp het
            </label>
          </div>
          <button
            type="button"
            disabled={!canDownloadMidazolam || !confirmMidazolamPdf}
            onClick={onDownloadMidazolam}
          >
            Download uitvoeringsverzoek midazolam
          </button>
          {midazolamErrors.length > 0 ? <small className="error">{midazolamErrors.join(" ")}</small> : null}
        </div>
      )}
    </section>
  );
}
