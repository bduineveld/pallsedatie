import { PDFDocument, rgb } from "pdf-lib";
import { pdfFooterLines } from "../data/guidelineText";
import { AppFormState } from "../types/models";
import { formatDateNl } from "./formatters";
import { getPallsedatieLogoPngBytes } from "./logoAsset";
import { loadSourceSansFonts } from "./sourceSansFonts";

function safe(value: string): string {
  return value.trim() || "-";
}

function physicianRoleLabel(
  role:
    | "huisarts"
    | "huisarts_io"
    | "basisarts"
    | "verpleegkundig_specialist"
    | "physician_assistant"
    | undefined
): string {
  switch (role) {
    case "huisarts_io":
      return "Huisarts i.o.";
    case "basisarts":
      return "Basisarts";
    case "verpleegkundig_specialist":
      return "Verpleegkundig Specialist";
    case "physician_assistant":
      return "Physician Assistant";
    case "huisarts":
    default:
      return "Huisarts";
  }
}

export async function buildMidazolamPdfBytes(state: AppFormState): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fonts = await loadSourceSansFonts(pdfDoc);
  const logoPng = await getPallsedatieLogoPngBytes();
  const logoImage = await pdfDoc.embedPng(logoPng);
  const marginX = 36;
  const pageWidth = page.getWidth();
  const contentWidth = pageWidth - marginX * 2;
  const columnGap = 20;
  const columnWidth = (contentWidth - columnGap) / 2;
  const leftX = marginX;
  const rightX = marginX + columnWidth + columnGap;
  const lineColor = rgb(0.9, 0.9, 0.9);

  const drawSectionTitle = (text: string, x: number, y: number) => {
    page.drawText(text, { x, y, size: 11, font: fonts.semibold });
  };

  const drawField = (
    label: string,
    value: string,
    x: number,
    y: number,
    labelWidth: number,
    endX: number
  ) => {
    page.drawText(`${label}:`, { x, y, size: 9, font: fonts.semibold });
    page.drawText(value, { x: x + labelWidth, y, size: 10, font: fonts.regular });
    page.drawLine({
      start: { x: x + labelWidth, y: y - 2 },
      end: { x: endX, y: y - 2 },
      thickness: 0.3,
      color: lineColor
    });
  };

  const drawColumnField = (label: string, value: string, x: number, y: number, labelWidth = 66) =>
    drawField(label, value, x, y, labelWidth, x + columnWidth - 2);
  const drawWideField = (label: string, value: string, y: number, labelWidth = 170) =>
    drawField(label, value, leftX, y, labelWidth, marginX + contentWidth);

  const patientName = safe(
    [state.general.patient.gender.trim(), state.general.patient.fullName.trim()].filter(Boolean).join(" ")
  );

  page.drawText("v1.0 pallsedatie.nl", { x: marginX, y: 816, size: 8, font: fonts.regular });
  page.drawText("Uitvoeringsverzoek Midazolam", {
    x: marginX,
    y: 792,
    size: 14,
    font: fonts.semibold
  });
  const logoWidth = 138;
  const logoHeight = (logoImage.height / logoImage.width) * logoWidth;
  page.drawImage(logoImage, {
    x: pageWidth - marginX - logoWidth,
    y: 790,
    width: logoWidth,
    height: logoHeight
  });

  const topY = 768;
  const topFieldStartY = 748;
  const topLineGap = 14;

  drawSectionTitle("Cliënt", leftX, topY);
  drawColumnField("Naam", patientName, leftX, topFieldStartY);
  const bornY = topFieldStartY - topLineGap;
  const bornLabelWidth = 66;
  const bornValueX = leftX + bornLabelWidth;
  const bsnLabelX = bornValueX + 113;
  const bsnLabelWidth = 26;
  const bsnValueX = bsnLabelX + bsnLabelWidth;
  page.drawText("Geboren:", { x: leftX, y: bornY, size: 9, font: fonts.semibold });
  page.drawText(formatDateNl(state.general.patient.birthDate), { x: bornValueX, y: bornY, size: 10, font: fonts.regular });
  page.drawLine({
    start: { x: bornValueX, y: bornY - 2 },
    end: { x: bsnLabelX - 8, y: bornY - 2 },
    thickness: 0.3,
    color: lineColor
  });
  page.drawText("BSN:", { x: bsnLabelX, y: bornY, size: 9, font: fonts.semibold });
  page.drawText(safe(state.general.patient.bsn), { x: bsnValueX, y: bornY, size: 10, font: fonts.regular });
  page.drawLine({
    start: { x: bsnValueX, y: bornY - 2 },
    end: { x: leftX + columnWidth - 2, y: bornY - 2 },
    thickness: 0.3,
    color: lineColor
  });
  drawColumnField("Adres", safe(state.general.patient.address), leftX, topFieldStartY - 2 * topLineGap);
  drawColumnField("Plaats", safe(state.general.patient.city), leftX, topFieldStartY - 3 * topLineGap);
  drawColumnField("Telefoon", safe(state.general.patient.contactPhone), leftX, topFieldStartY - 4 * topLineGap);
  drawColumnField("Verzekering", safe(state.general.patient.insurance), leftX, topFieldStartY - 5 * topLineGap);

  drawSectionTitle(physicianRoleLabel(state.general.physician.role), rightX, topY);
  drawColumnField("Naam", safe(state.general.physician.fullName), rightX, topFieldStartY);
  drawColumnField("Praktijk", safe(state.general.physician.practice), rightX, topFieldStartY - topLineGap);
  drawColumnField("Adres", safe(state.general.patient.address), rightX, topFieldStartY - 2 * topLineGap);
  drawColumnField("Plaats", safe(state.general.physician.place), rightX, topFieldStartY - 3 * topLineGap);
  drawColumnField("Telefoon", safe(state.general.physician.phone), rightX, topFieldStartY - 4 * topLineGap);
  drawColumnField("Spoednr ANW", safe(state.general.physician.anwPhone), rightX, topFieldStartY - 5 * topLineGap);

  const orgTitleY = topFieldStartY - 6 * topLineGap - 12;
  drawSectionTitle("Aan zorginstelling", leftX, orgTitleY);
  drawColumnField("Naam", safe(state.general.organization), leftX, orgTitleY - 18);
  drawColumnField("Telefoon", safe(state.general.organizationPhone), leftX, orgTitleY - 32);
  drawColumnField("Veilige e-mail", safe(state.general.organizationSecureEmail), leftX, orgTitleY - 46, 72);

  drawSectionTitle("Apotheek", rightX, orgTitleY);
  drawColumnField("Naam", safe(state.general.pharmacy), rightX, orgTitleY - 18);
  drawColumnField("Telefoon", safe(state.general.pharmacyPhone), rightX, orgTitleY - 32);

  let y = orgTitleY - 74;
  drawWideField("Uit te voeren handeling", "Aansluiten medicatie via sc/iv infuuspomp", y, 170);
  y -= 15;
  drawWideField("Startdatum", formatDateNl(state.midazolam.startDate), y);
  y -= 15;
  drawWideField("Diagnose/ziektebeeld", safe(state.midazolam.diagnosis), y);
  y -= 15;
  drawWideField("Indicatie start pomp", safe(state.midazolam.indication), y);
  y -= 15;
  drawWideField(
    "Medicatie",
    `Midazolam ${state.midazolam.concentrationMgPerMl}mg/100ml (Senozam zakje of Deltec cassette)`,
    y,
    170
  );
  y -= 15;
  drawWideField("Start-/loadingdose", `${safe(state.midazolam.loadingDoseMg)} mg`, y);
  y -= 15;
  drawWideField("Continue dosering", `${safe(state.midazolam.continueDoseMgPer24h)} mg/24u`, y);
  y -= 15;
  drawWideField("Bolus dosering", `${safe(state.midazolam.bolusMg)} mg`, y);
  y -= 15;
  drawWideField("Lockout tijd", `${safe(state.midazolam.lockoutHours)} uur`, y);
  y -= 15;
  drawWideField("CAD toegestaan", state.midazolam.cadPlacementAllowed ? "Ja" : "Nee", y);
  y -= 15;
  drawWideField("CAD Charrière", `Ch ${state.midazolam.cadSizeCharriere}`, y);
  y -= 15;
  drawWideField(
    "Akkoord eerste ophoging met 50%",
    state.midazolam.escalation50PercentAgreement ? "Ja" : "Nee",
    y,
    200
  );
  y -= 15;
  drawWideField("Afwijkend ophoogbeleid / opmerkingen", safe(state.midazolam.remarks), y, 220);
  y -= 15;
  drawWideField("Specifieke problemen / bijwerkingen", safe(state.midazolam.sideEffects), y, 220);
  y -= 15;
  drawWideField("Plaats en datum", `${safe(state.general.physician.place)} ${formatDateNl(state.general.physician.date)}`, y);
  y -= 15;
  drawWideField("Handtekening", "", y);

  let footerY = 52;
  for (const footerLine of pdfFooterLines) {
    page.drawText(footerLine, { x: 36, y: footerY, size: 8, font: fonts.regular });
    footerY -= 10;
  }
  if (state.general.includeGeneratedByFooter) {
    page.drawText("gegenereerd via pallsedatie.nl", {
      x: 36,
      y: footerY,
      size: 8,
      font: fonts.regular
    });
  }
  return pdfDoc.save();
}
