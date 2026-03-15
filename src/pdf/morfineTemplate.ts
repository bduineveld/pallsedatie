import { PDFDocument, rgb } from "pdf-lib";
import { AppFormState } from "../types/models";
import { formatDateNl } from "./formatters";
import { getPallsedatieLogoSvgData } from "./logoAsset";
import { loadSourceSansFonts } from "./sourceSansFonts";

function safe(value: string): string {
  return value.trim() || "-";
}

function hexToRgbColor(hex: string) {
  const normalized = hex.startsWith("#") ? hex.slice(1) : hex;
  const value = normalized.length === 3
    ? normalized
        .split("")
        .map((part) => `${part}${part}`)
        .join("")
    : normalized;
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

function formatCompactNumber(value: number): string {
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function buildContinueDoseLabel(
  doseText: string,
  concentrationMgPerMl: number,
  showMlPerHour: boolean
): string {
  const safeDoseText = safe(doseText);
  if (!showMlPerHour) {
    return `${safeDoseText} mg/24u`;
  }
  const doseNumber = Number.parseFloat(doseText.replace(",", "."));
  if (!Number.isFinite(doseNumber) || concentrationMgPerMl <= 0) {
    return `${safeDoseText} mg/24u`;
  }
  const mlPerHour = doseNumber / 24 / concentrationMgPerMl;
  return `${safeDoseText} mg/24u (=${formatCompactNumber(mlPerHour)} ml/uur)`;
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

export async function buildMorfinePdfBytes(state: AppFormState): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fonts = await loadSourceSansFonts(pdfDoc);
  const logoSvg = await getPallsedatieLogoSvgData();
  const marginX = 36;
  const pageWidth = page.getWidth();
  const contentWidth = pageWidth - marginX * 2;
  const columnGap = 20;
  const columnWidth = (contentWidth - columnGap) / 2;
  const leftX = marginX;
  const rightX = marginX + columnWidth + columnGap;
  const brandBlue = rgb(0.12, 0.16, 0.27);
  const brandGold = rgb(0.83, 0.66, 0.35);
  const lineColor = rgb(0.9, 0.9, 0.9);
  const tableFillColor = rgb(0.94, 0.97, 1);
  const valueFillColor = rgb(0.975, 0.985, 1);
  const dottedLineColor = rgb(0.75, 0.82, 0.91);

  const drawSectionTitle = (text: string, x: number, y: number) => {
    page.drawText(text, { x, y, size: 11, font: fonts.semibold, color: brandBlue });
  };

  const drawRoundedTable = (
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fillColor = tableFillColor,
    borderColor = brandBlue,
    borderWidth = 1
  ) => {
    const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
    const innerWidth = Math.max(width - safeRadius * 2, 0);
    const innerHeight = Math.max(height - safeRadius * 2, 0);

    if (fillColor) {
      page.drawRectangle({
        x: x + safeRadius,
        y,
        width: innerWidth,
        height,
        color: fillColor
      });
      page.drawRectangle({
        x,
        y: y + safeRadius,
        width: safeRadius,
        height: innerHeight,
        color: fillColor
      });
      page.drawRectangle({
        x: x + width - safeRadius,
        y: y + safeRadius,
        width: safeRadius,
        height: innerHeight,
        color: fillColor
      });
      page.drawEllipse({
        x: x + safeRadius,
        y: y + safeRadius,
        xScale: safeRadius,
        yScale: safeRadius,
        color: fillColor
      });
      page.drawEllipse({
        x: x + width - safeRadius,
        y: y + safeRadius,
        xScale: safeRadius,
        yScale: safeRadius,
        color: fillColor
      });
      page.drawEllipse({
        x: x + safeRadius,
        y: y + height - safeRadius,
        xScale: safeRadius,
        yScale: safeRadius,
        color: fillColor
      });
      page.drawEllipse({
        x: x + width - safeRadius,
        y: y + height - safeRadius,
        xScale: safeRadius,
        yScale: safeRadius,
        color: fillColor
      });
    }

    const c = safeRadius * 0.5522847498;
    const outlinePath = [
      `M ${x + safeRadius} ${y}`,
      `L ${x + width - safeRadius} ${y}`,
      `C ${x + width - safeRadius + c} ${y} ${x + width} ${y + safeRadius - c} ${x + width} ${y + safeRadius}`,
      `L ${x + width} ${y + height - safeRadius}`,
      `C ${x + width} ${y + height - safeRadius + c} ${x + width - safeRadius + c} ${y + height} ${x + width - safeRadius} ${y + height}`,
      `L ${x + safeRadius} ${y + height}`,
      `C ${x + safeRadius - c} ${y + height} ${x} ${y + height - safeRadius + c} ${x} ${y + height - safeRadius}`,
      `L ${x} ${y + safeRadius}`,
      `C ${x} ${y + safeRadius - c} ${x + safeRadius - c} ${y} ${x + safeRadius} ${y}`,
      "Z"
    ].join(" ");
    page.drawSvgPath(outlinePath, { borderColor, borderWidth });
  };

  const drawField = (
    label: string,
    value: string,
    x: number,
    y: number,
    labelWidth: number,
    endX: number,
    highlightValue = false
  ) => {
    const valueX = x + labelWidth;
    if (highlightValue) {
      page.drawRectangle({
        x: valueX,
        y: y - 1.8,
        width: Math.max(endX - valueX, 0),
        height: 10.8,
        color: valueFillColor
      });
    }
    page.drawText(`${label}:`, { x, y, size: 9, font: fonts.semibold, color: brandBlue });
    page.drawText(value, { x: valueX, y, size: 10, font: fonts.regular, color: brandBlue });
    page.drawLine({
      start: { x: valueX, y: y - 2 },
      end: { x: endX, y: y - 2 },
      thickness: 0.3,
      color: highlightValue ? dottedLineColor : lineColor,
      dashArray: highlightValue ? [1.5, 1.5] : undefined
    });
  };

  const drawColumnField = (
    label: string,
    value: string,
    x: number,
    y: number,
    labelWidth = 66,
    highlightValue = false
  ) => drawField(label, value, x, y, labelWidth, x + columnWidth - 2, highlightValue);
  const drawWideField = (label: string, value: string, y: number, labelWidth = 170) =>
    drawField(label, value, leftX, y, labelWidth, marginX + contentWidth);

  const patientName = safe(
    [state.general.patient.gender.trim(), state.general.patient.fullName.trim()].filter(Boolean).join(" ")
  );

  page.drawText("Uitvoeringsverzoek Morfine", {
    x: marginX,
    y: 802,
    size: 16,
    font: fonts.semibold,
    color: brandBlue
  });
  const logoWidth = 138;
  const logoScale = logoWidth / logoSvg.viewBox.width;
  const logoHeight = logoSvg.viewBox.height * logoScale;
  if (!state.general.hideLogoOnPdf) {
    const logoX = pageWidth - marginX - logoWidth - logoSvg.viewBox.minX * logoScale;
    const logoY = 828 - logoSvg.viewBox.minY * logoScale;
    logoSvg.paths.forEach((path) => {
      page.drawSvgPath(path.d, {
        x: logoX,
        y: logoY,
        scale: logoScale,
        color: hexToRgbColor(path.fillHex)
      });
    });
  }

  page.drawLine({
    start: { x: marginX, y: 786 },
    end: { x: marginX + contentWidth, y: 786 },
    thickness: 1.2,
    color: brandGold
  });

  const topY = 756;
  const topFieldStartY = 736;
  const topLineGap = 14;
  const orgTitleY = topFieldStartY - 6 * topLineGap - 12;
  const patientTableTop = topY + 12;
  const patientTableBottom = topFieldStartY - 5 * topLineGap - 14;
  const patientTableX = leftX - 6;
  const patientTableWidth = columnWidth + 12;
  drawRoundedTable(patientTableX, patientTableBottom, patientTableWidth, patientTableTop - patientTableBottom, 3);

  drawSectionTitle("Patiëntgegevens", leftX, topY);
  drawColumnField("Naam", patientName, leftX, topFieldStartY, 66, true);
  const bornY = topFieldStartY - topLineGap;
  const bornLabelWidth = 66;
  const bornValueX = leftX + bornLabelWidth;
  const bsnLabelX = bornValueX + 113;
  const bsnLabelWidth = 26;
  const bsnValueX = bsnLabelX + bsnLabelWidth;
  page.drawRectangle({
    x: bornValueX,
    y: bornY - 1.8,
    width: Math.max(bsnLabelX - 8 - bornValueX, 0),
    height: 10.8,
    color: valueFillColor
  });
  page.drawRectangle({
    x: bsnValueX,
    y: bornY - 1.8,
    width: Math.max(leftX + columnWidth - 2 - bsnValueX, 0),
    height: 10.8,
    color: valueFillColor
  });
  page.drawText("Geboren:", { x: leftX, y: bornY, size: 9, font: fonts.semibold, color: brandBlue });
  page.drawText(formatDateNl(state.general.patient.birthDate), { x: bornValueX, y: bornY, size: 10, font: fonts.regular, color: brandBlue });
  page.drawLine({
    start: { x: bornValueX, y: bornY - 2 },
    end: { x: bsnLabelX - 8, y: bornY - 2 },
    thickness: 0.3,
    color: dottedLineColor,
    dashArray: [1.5, 1.5]
  });
  page.drawText("BSN:", { x: bsnLabelX, y: bornY, size: 9, font: fonts.semibold, color: brandBlue });
  page.drawText(safe(state.general.patient.bsn), { x: bsnValueX, y: bornY, size: 10, font: fonts.regular, color: brandBlue });
  page.drawLine({
    start: { x: bsnValueX, y: bornY - 2 },
    end: { x: leftX + columnWidth - 2, y: bornY - 2 },
    thickness: 0.3,
    color: dottedLineColor,
    dashArray: [1.5, 1.5]
  });
  drawColumnField("Adres", safe(state.general.patient.address), leftX, topFieldStartY - 2 * topLineGap, 66, true);
  drawColumnField("Plaats", safe(state.general.patient.city), leftX, topFieldStartY - 3 * topLineGap, 66, true);
  drawColumnField("Telefoon", safe(state.general.patient.contactPhone), leftX, topFieldStartY - 4 * topLineGap, 66, true);
  drawColumnField("Verzekering", safe(state.general.patient.insurance), leftX, topFieldStartY - 5 * topLineGap, 66, true);

  const rightPanelX = rightX - 6;
  const rightPanelWidth = columnWidth + 12;
  const rightPanelHeight = patientTableTop - patientTableBottom;
  const rightPanelGap = 8;
  const uitvoerendeHeight = 64;
  const apotheekHeight = rightPanelHeight - uitvoerendeHeight - rightPanelGap;
  const uitvoerendeY = patientTableTop - uitvoerendeHeight;
  const apotheekY = patientTableBottom;
  drawRoundedTable(rightPanelX, uitvoerendeY, rightPanelWidth, uitvoerendeHeight, 3);
  drawRoundedTable(rightPanelX, apotheekY, rightPanelWidth, apotheekHeight, 3);

  const rightInnerX = rightPanelX + 8;
  const rightInnerEndX = rightPanelX + rightPanelWidth - 8;
  page.drawText("Uitvoerende instelling", {
    x: rightInnerX,
    y: patientTableTop - 14,
    size: 10,
    font: fonts.semibold,
    color: brandBlue
  });
  let rightFieldY = patientTableTop - 28;
  drawField("Naam", safe(state.general.organization), rightInnerX, rightFieldY, 58, rightInnerEndX, true);
  rightFieldY -= 12;
  drawField("Telefoon", safe(state.general.organizationPhone), rightInnerX, rightFieldY, 58, rightInnerEndX, true);
  rightFieldY -= 12;
  drawField("E-mail", safe(state.general.organizationSecureEmail), rightInnerX, rightFieldY, 58, rightInnerEndX, true);

  page.drawText("Apotheek", {
    x: rightInnerX,
    y: apotheekY + apotheekHeight - 14,
    size: 10,
    font: fonts.semibold,
    color: brandBlue
  });
  let apotheekFieldY = apotheekY + apotheekHeight - 28;
  drawField("Naam", safe(state.general.pharmacy), rightInnerX, apotheekFieldY, 58, rightInnerEndX, true);
  apotheekFieldY -= 12;
  drawField("Telefoon", safe(state.general.pharmacyPhone), rightInnerX, apotheekFieldY, 58, rightInnerEndX, true);

  let y = orgTitleY - 74;
  drawWideField("Uit te voeren handeling", "Aansluiten medicatie via sc/iv infuuspomp", y, 170);
  y -= 15;
  drawWideField("Startdatum", formatDateNl(state.morfine.startDate), y);
  y -= 15;
  drawWideField("Diagnose/ziektebeeld", safe(state.morfine.diagnosis), y);
  y -= 15;
  drawWideField("Indicatie start pomp", safe(state.morfine.indication), y);
  y -= 15;
  drawWideField(
    "Medicatie",
    `Morfine ${state.morfine.concentrationMgPerMl}mg/ml (Deltec cassette of Sendolor zakje)`,
    y,
    170
  );
  y -= 15;
  drawWideField(
    "Continue dosering",
    buildContinueDoseLabel(
      state.morfine.continueDoseMgPer24h,
      state.morfine.concentrationMgPerMl,
      state.general.showMlPerHour
    ),
    y
  );
  y -= 15;
  drawWideField("Bolus dosering", `${safe(state.morfine.bolusMg)} mg`, y);
  y -= 15;
  drawWideField("Lockout tijd", `${safe(state.morfine.lockoutHours)} uur`, y);
  y -= 15;
  drawWideField(
    "Akkoord eerste ophoging met 50%",
    state.morfine.escalation50PercentAgreement ? "Ja" : "Nee",
    y,
    200
  );
  y -= 15;
  drawWideField(
    "Welke pijnmedicatie continueren/stoppen",
    safe(state.morfine.continuationAdvice),
    y,
    220
  );
  y -= 15;
  drawWideField(
    "Specifieke problemen / bijwerkingen",
    safe(state.morfine.sideEffects),
    y,
    220
  );
  y -= 15;
  drawWideField("Plaats en datum", `${safe(state.general.physician.place)} ${formatDateNl(state.general.physician.date)}`, y);
  y -= 15;
  drawWideField("Handtekening", "", y);

  const physicianBoxX = leftX;
  const physicianBoxY = 74;
  const physicianBoxWidth = columnWidth;
  const physicianBoxHeight = 108;
  drawRoundedTable(physicianBoxX, physicianBoxY, physicianBoxWidth, physicianBoxHeight, 3, undefined, brandBlue, 1);
  const physicianTitleY = physicianBoxY + physicianBoxHeight - 15;
  page.drawText(physicianRoleLabel(state.general.physician.role), {
    x: physicianBoxX + 8,
    y: physicianTitleY,
    size: 10,
    font: fonts.semibold,
    color: brandBlue
  });
  const physicianValueEndX = physicianBoxX + physicianBoxWidth - 10;
  let physicianFieldY = physicianTitleY - 14;
  drawField("Naam", safe(state.general.physician.fullName), physicianBoxX + 8, physicianFieldY, 54, physicianValueEndX, true);
  physicianFieldY -= 12;
  drawField("Praktijk", safe(state.general.physician.practice), physicianBoxX + 8, physicianFieldY, 54, physicianValueEndX, true);
  physicianFieldY -= 12;
  drawField("Adres", safe(state.general.physician.practiceAddress), physicianBoxX + 8, physicianFieldY, 54, physicianValueEndX, true);
  physicianFieldY -= 12;
  drawField("Plaats", safe(state.general.physician.place), physicianBoxX + 8, physicianFieldY, 54, physicianValueEndX, true);
  physicianFieldY -= 12;
  drawField("Telefoon", safe(state.general.physician.phone), physicianBoxX + 8, physicianFieldY, 54, physicianValueEndX, true);
  physicianFieldY -= 12;
  drawField("Spoednr ANW", safe(state.general.physician.anwPhone), physicianBoxX + 8, physicianFieldY, 54, physicianValueEndX, true);

  page.drawText("v1.0 pallsedatie.nl", { x: 36, y: 42, size: 8, font: fonts.regular, color: brandBlue });
  return pdfDoc.save();
}
