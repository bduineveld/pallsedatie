import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFFont } from "pdf-lib";

export interface SourceSansFonts {
  regular: PDFFont;
  semibold: PDFFont;
}

const regularFontUrl = new URL("./fonts/SourceSans3-Regular.ttf", import.meta.url).href;
const semiboldFontUrl = new URL("./fonts/SourceSans3-SemiBold.ttf", import.meta.url).href;

async function fetchFontBytes(fontUrl: string): Promise<ArrayBuffer> {
  const response = await fetch(fontUrl);
  if (!response.ok) {
    throw new Error(`Kon lettertype niet laden: ${fontUrl}`);
  }
  return response.arrayBuffer();
}

export async function loadSourceSansFonts(pdfDoc: PDFDocument): Promise<SourceSansFonts> {
  pdfDoc.registerFontkit(fontkit);
  const regularBytes = await fetchFontBytes(regularFontUrl);
  const semiboldBytes = await fetchFontBytes(semiboldFontUrl);
  const regular = await pdfDoc.embedFont(regularBytes);
  const semibold = await pdfDoc.embedFont(semiboldBytes);
  return { regular, semibold };
}
