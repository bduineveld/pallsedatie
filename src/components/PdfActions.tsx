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

  const isMorfine = mode === "morfine";
  const title = isMorfine
    ? "Bekijk uitvoeringsverzoek morfine"
    : "Bekijk uitvoeringsverzoek midazolam";
  const legalConfirmationTextMorfine =
    "Deze tool geeft een suggestie op basis van de Pallialine-richtlijn Pijn bij patiënten met kanker (december 2019). Ik blijf als voorschrijver volledig verantwoordelijk voor indicatie, dosering en uiteindelijke inhoud van het uitvoeringsverzoek. Ik lees het nog één keer door voordat ik hem onderteken.";
  const legalConfirmationTextMidazolam =
    "Deze tool geeft een suggestie op basis van de Pallialine-richtlijn Palliatieve sedatie (juni 2022). Ik blijf als voorschrijver volledig verantwoordelijk voor indicatie, dosering en uiteindelijke inhoud van het uitvoeringsverzoek. Ik lees het nog één keer door voordat ik hem onderteken.";
  const legalConfirmationText = isMorfine
    ? legalConfirmationTextMorfine
    : legalConfirmationTextMidazolam;
  const isConfirmed = isMorfine ? confirmMorfinePdf : confirmMidazolamPdf;
  const setConfirmed = isMorfine
    ? onToggleConfirmMorfinePdf
    : onToggleConfirmMidazolamPdf;
  const canDownload = isMorfine ? canDownloadMorfine : canDownloadMidazolam;
  const onDownload = isMorfine ? onDownloadMorfine : onDownloadMidazolam;
  const errors = isMorfine ? morfineErrors : midazolamErrors;
  const iconSrc = isMorfine ? "/morfine.svg" : "/midazolam.svg";

  return (
    <section className="card">
      <h2>{title}</h2>
      <div className="stack">
        <div className="legal">
          <p>{legalConfirmationText}</p>
          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            ik begrijp het
          </label>
        </div>
        <button
          type="button"
          className="pdf-download-button"
          disabled={!canDownload || !isConfirmed}
          onClick={onDownload}
        >
          <img src={iconSrc} alt="" className="button-icon" aria-hidden="true" />
          {title}
        </button>
        {errors.length > 0 ? <small className="error">{errors.join(" ")}</small> : null}
      </div>
    </section>
  );
}
