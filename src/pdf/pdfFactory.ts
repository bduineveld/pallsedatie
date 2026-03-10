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
