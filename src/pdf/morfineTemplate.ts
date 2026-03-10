import { PDFDocument, StandardFonts } from "pdf-lib";
import { pdfFooterLines } from "../data/guidelineText";
import { AppFormState } from "../types/models";

function safe(value: string): string {
  return value.trim() || "-";
}

export async function buildMorfinePdfBytes(state: AppFormState): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 810;
  const line = (text: string, isBold = false, size = 10) => {
    page.drawText(text, { x: 36, y, size, font: isBold ? bold : font });
    y -= 14;
  };

  line("UITVOERINGSVERZOEK MORFINE", true, 12);
  y -= 4;
  line("Patiënt");
  line(`Naam: ${safe(state.general.patient.fullName)}`);
  line(`Geboortedatum: ${safe(state.general.patient.birthDate)} | BSN: ${safe(state.general.patient.bsn)}`);
  line(`Adres: ${safe(state.general.patient.address)} | Geslacht: ${safe(state.general.patient.gender)}`);
  y -= 6;
  line("Voorschrijver");
  line(`Naam: ${safe(state.general.physician.fullName)} | Telefoon: ${safe(state.general.physician.phone)}`);
  line(`ANW telefoon: ${safe(state.general.physician.anwPhone)} | Plaats: ${safe(state.general.physician.place)}`);
  line(`Datum: ${safe(state.general.physician.date)}`);
  y -= 6;
  line(`Organisatie (optioneel): ${safe(state.general.organization)}`);
  line(`Apotheek (optioneel): ${safe(state.general.pharmacy)}`);
  y -= 6;
  line("Uit te voeren handeling", true);
  line(`Startdatum: ${safe(state.morfine.startDate)}`);
  line(`Diagnose / ziektebeeld: ${safe(state.morfine.diagnosis)}`);
  line(`Indicatie / refractair symptoom: ${safe(state.morfine.indication)}`);
  line(`Concentratie: ${state.morfine.concentrationMgPerMl} mg/ml`);
  line(`Continue dosering: ${safe(state.morfine.continueDoseMgPer24h)} mg/24u`);
  line(`Startbolus: ${safe(state.morfine.startBolusMg)} mg`);
  line(`Bolusdosering: ${safe(state.morfine.bolusMg)} mg`);
  line(`Lockout tijd: ${safe(state.morfine.lockoutHours)} uur`);
  line(
    `Akkoord 50% dose escalation: ${state.morfine.escalation50PercentAgreement ? "Ja" : "Nee"}`
  );
  line(`Voortzetten/stoppen opioiden + PRN: ${safe(state.morfine.continuationAdvice)}`);
  line(`Afwijkend ophoogbeleid / opmerkingen: ${safe(state.morfine.remarks)}`);
  line(`Specifieke problemen / bijwerkingen: ${safe(state.morfine.sideEffects)}`);
  y -= 12;
  line("Handtekening voorschrijver: _______________________________");

  let footerY = 52;
  for (const footerLine of pdfFooterLines) {
    page.drawText(footerLine, { x: 36, y: footerY, size: 8, font });
    footerY -= 10;
  }
  if (state.general.includeGeneratedByFooter) {
    page.drawText("gegenereerd via pallsedatie.nl", { x: 36, y: footerY, size: 8, font });
  }
  return pdfDoc.save();
}
