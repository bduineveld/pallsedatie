import { legalConfirmationText } from "../data/guidelineText";

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
  return (
    <section className="card">
      <h2>Uitvoeringsverzoek PDF</h2>
      {(mode === "morfine" || mode === "combination") && (
        <div className="stack">
          <label className="checkbox-line legal">
            <input
              type="checkbox"
              checked={confirmMorfinePdf}
              onChange={(event) => onToggleConfirmMorfinePdf(event.target.checked)}
            />
            {legalConfirmationText}
          </label>
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
      {(mode === "midazolam" || mode === "combination") && (
        <div className="stack">
          <label className="checkbox-line legal">
            <input
              type="checkbox"
              checked={confirmMidazolamPdf}
              onChange={(event) => onToggleConfirmMidazolamPdf(event.target.checked)}
            />
            {legalConfirmationText}
          </label>
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
