import { AppFormState } from "../types/models";
import { buildTimestampForFilename, downloadBytesAsPdf } from "./formatters";
import { buildMidazolamPdfBytes } from "./midazolamTemplate";
import { buildMorfinePdfBytes } from "./morfineTemplate";

export async function downloadMorfinePdf(state: AppFormState): Promise<void> {
  const bytes = await buildMorfinePdfBytes(state);
  const stamp = buildTimestampForFilename();
  downloadBytesAsPdf(bytes, `uitvoeringsverzoek-morfine-${stamp}.pdf`);
}

export async function downloadMidazolamPdf(state: AppFormState): Promise<void> {
  const bytes = await buildMidazolamPdfBytes(state);
  const stamp = buildTimestampForFilename();
  downloadBytesAsPdf(bytes, `uitvoeringsverzoek-midazolam-${stamp}.pdf`);
}

function openPdfBytesInBrowser(bytes: Uint8Array): void {
  const normalizedBytes = Uint8Array.from(bytes);
  const blob = new Blob([normalizedBytes], { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(blob);
  const openedWindow = window.open("", "_blank");
  if (openedWindow) {
    openedWindow.location.href = blobUrl;
  }
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

export async function previewMorfinePdf(state: AppFormState): Promise<void> {
  const bytes = await buildMorfinePdfBytes(state);
  openPdfBytesInBrowser(bytes);
}

export async function previewMidazolamPdf(state: AppFormState): Promise<void> {
  const bytes = await buildMidazolamPdfBytes(state);
  openPdfBytesInBrowser(bytes);
}
