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

function hexToGrayColor(hex: string) {
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
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return rgb(luma, luma, luma);
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
      return "Aanvragend Huisarts i.o.";
    case "basisarts":
      return "Aanvragend Basisarts";
    case "verpleegkundig_specialist":
      return "Aanvragend Verpleegkundig Specialist";
    case "physician_assistant":
      return "Aanvragend Physician Assistant";
    case "huisarts":
    default:
      return "Aanvragend Huisarts";
  }
}

function drawDebugGrid(page: PDFDocument["addPage"] extends (...args: any[]) => infer R ? R : never) {
  const mmToPt = 72 / 25.4;
  const minorStep = 1 * mmToPt;
  const majorStep = 10 * mmToPt;
  const width = page.getWidth();
  const height = page.getHeight();
  const gridColor = rgb(0.2, 0.34, 0.62);

  for (let x = 0; x <= width; x += minorStep) {
    const majorLine = Math.round(x / majorStep) * majorStep;
    const isMajor = Math.abs(x - majorLine) < minorStep / 3;
    page.drawLine({
      start: { x, y: 0 },
      end: { x, y: height },
      thickness: isMajor ? 0.5 : 0.18,
      color: gridColor,
      opacity: isMajor ? 0.2 : 0.08
    });
  }

  for (let y = 0; y <= height; y += minorStep) {
    const majorLine = Math.round(y / majorStep) * majorStep;
    const isMajor = Math.abs(y - majorLine) < minorStep / 3;
    page.drawLine({
      start: { x: 0, y },
      end: { x: width, y },
      thickness: isMajor ? 0.5 : 0.18,
      color: gridColor,
      opacity: isMajor ? 0.2 : 0.08
    });
  }
}

export async function buildMidazolamPdfBytes(state: AppFormState): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]);
  const fonts = await loadSourceSansFonts(pdfDoc);
  const logoSvg = await getPallsedatieLogoSvgData();
  const marginX = 36;
  const pageWidth = page.getWidth();
  const contentWidth = pageWidth - marginX * 2;
  const columnGap = 20;
  const columnWidth = (contentWidth - columnGap) / 2;
  const leftX = marginX;
  const rightX = marginX + columnWidth + columnGap;
  let brandBlue = rgb(0.12, 0.16, 0.27);
  let brandGold = rgb(0.83, 0.66, 0.35);
  let lineColor = rgb(0.9, 0.9, 0.9);
  let tableFillColor = rgb(0.94, 0.97, 1);
  let valueFillColor = rgb(0.975, 0.985, 1);
  let dottedLineColor = rgb(0.75, 0.82, 0.91);
  let renderInGrayscale = false;

  const drawSectionTitle = (text: string, x: number, y: number) => {
    page.drawText(text, { x, y, size: 11, font: fonts.semibold, color: brandBlue });
  };
  const drawPlainSectionHeading = (text: string, y: number) => {
    page.drawText(text, { x: leftX, y, size: 12, font: fonts.semibold, color: brandBlue });
  };
  const drawTopRoundedBar = (x: number, y: number, width: number, height: number, radius: number, color = brandBlue) => {
    const safeRadius = Math.max(0, Math.min(radius, width / 2, height));
    const topBandHeight = Math.max(height - safeRadius, 0);
    page.drawRectangle({
      x,
      y,
      width,
      height: topBandHeight,
      color
    });
    page.drawRectangle({
      x: x + safeRadius,
      y: y + topBandHeight,
      width: Math.max(width - safeRadius * 2, 0),
      height: safeRadius,
      color
    });
    page.drawEllipse({
      x: x + safeRadius,
      y: y + topBandHeight,
      xScale: safeRadius,
      yScale: safeRadius,
      color
    });
    page.drawEllipse({
      x: x + width - safeRadius,
      y: y + topBandHeight,
      xScale: safeRadius,
      yScale: safeRadius,
      color
    });
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
  const drawWideContinuation = (value: string, y: number, labelWidth = 170) => {
    page.drawText(value, { x: leftX + labelWidth, y, size: 10, font: fonts.regular, color: brandBlue });
    page.drawLine({
      start: { x: leftX + labelWidth, y: y - 2 },
      end: { x: marginX + contentWidth, y: y - 2 },
      thickness: 0.3,
      color: lineColor
    });
  };

  const renderMainPage = () => {
    const patientName = safe(
      [state.general.patient.gender.trim(), state.general.patient.fullName.trim()].filter(Boolean).join(" ")
    );

  page.drawText("Uitvoeringsverzoek Midazolam", {
    x: marginX,
    y: 802,
    size: 22,
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
        color: renderInGrayscale ? hexToGrayColor(path.fillHex) : hexToRgbColor(path.fillHex)
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

  const patientHeaderHeight = 16;
  const patientHeaderY = patientTableTop - patientHeaderHeight;
    drawTopRoundedBar(patientTableX, patientHeaderY, patientTableWidth, patientHeaderHeight, 3, brandBlue);
  page.drawText("Patiëntgegevens", {
    x: leftX,
    y: patientHeaderY + 5,
    size: 10,
    font: fonts.regular,
    color: rgb(1, 1, 1)
  });
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
  const twoMm = (72 / 25.4) * 2;
  const uitvoerendeHeight = 64 - twoMm;
  const apotheekHeight = rightPanelHeight - uitvoerendeHeight - rightPanelGap;
  const uitvoerendeY = patientTableTop - uitvoerendeHeight;
  const apotheekY = patientTableBottom;
  const panelHeaderHeight = 16;
  drawRoundedTable(rightPanelX, uitvoerendeY, rightPanelWidth, uitvoerendeHeight, 3);
  drawRoundedTable(rightPanelX, apotheekY, rightPanelWidth, apotheekHeight, 3);
    drawTopRoundedBar(
      rightPanelX,
      uitvoerendeY + uitvoerendeHeight - panelHeaderHeight,
      rightPanelWidth,
      panelHeaderHeight,
      3,
      brandBlue
    );
    drawTopRoundedBar(
      rightPanelX,
      apotheekY + apotheekHeight - panelHeaderHeight,
      rightPanelWidth,
      panelHeaderHeight,
      3,
      brandBlue
    );

  const rightInnerX = rightPanelX + 8;
  const rightInnerEndX = rightPanelX + rightPanelWidth - 8;
  page.drawText("Uitvoerende instelling", {
    x: rightInnerX,
    y: uitvoerendeY + uitvoerendeHeight - panelHeaderHeight + 5,
    size: 10,
    font: fonts.regular,
    color: rgb(1, 1, 1)
  });
  let rightFieldY = patientTableTop - 28;
  drawField("Naam", safe(state.general.organization), rightInnerX, rightFieldY, 58, rightInnerEndX, true);
  rightFieldY -= 12;
  drawField("Telefoon", safe(state.general.organizationPhone), rightInnerX, rightFieldY, 58, rightInnerEndX, true);
  rightFieldY -= 12;
  drawField("E-mail", safe(state.general.organizationSecureEmail), rightInnerX, rightFieldY, 58, rightInnerEndX, true);

  page.drawText("Apotheek", {
    x: rightInnerX,
    y: apotheekY + apotheekHeight - panelHeaderHeight + 5,
    size: 10,
    font: fonts.regular,
    color: rgb(1, 1, 1)
  });
  let apotheekFieldY = apotheekY + apotheekHeight - 28;
  drawField("Naam", safe(state.general.pharmacy), rightInnerX, apotheekFieldY, 58, rightInnerEndX, true);
  apotheekFieldY -= 12;
  drawField("Telefoon", safe(state.general.pharmacyPhone), rightInnerX, apotheekFieldY, 58, rightInnerEndX, true);

    const mm = 72 / 25.4;
    const twoCm = mm * 20;
    const headingGap = mm * 8;
    const indicatieOffset = mm * 2;
    const medicatieOffset = mm * 5;
    const overigeOffset = mm * 6;
    let y = orgTitleY - 74 + twoCm;
    drawPlainSectionHeading("VERZOEK", y);
    y -= 14;
  if (state.midazolam.cadPlacementAllowed) {
    drawWideField("Uit te voeren handeling", "- Aansluiten medicatie via sc/iv infuuspomp", y, 170);
    y -= 15;
    drawWideContinuation(`- Plaatsen CAD (Maat: Ch ${state.midazolam.cadSizeCharriere})`, y, 170);
  } else {
    drawWideField("Uit te voeren handeling", "Aansluiten medicatie via sc/iv infuuspomp", y, 170);
  }
  y -= 15;
  drawWideField("Startdatum", formatDateNl(state.midazolam.startDate), y);
    y -= headingGap + indicatieOffset;
    drawPlainSectionHeading("INDICATIE", y);
    y -= 14;
    drawWideField("Diagnose / ziektebeeld", safe(state.midazolam.diagnosis), y);
  y -= 15;
    drawWideField("Indicatie / refractair symptoom", safe(state.midazolam.indication), y);
    y -= headingGap + medicatieOffset;
    drawPlainSectionHeading("MEDICATIEGEGEVENS (MIDAZOLAMPOMP)", y);
    y -= 14;

    const tableX = leftX;
    const tableWidth = contentWidth;
    const tableHeight = 38;
    const rowHeight = tableHeight / 3;
    const colWidth = tableWidth / 2;
    const tableY = y - tableHeight + 3;
    page.drawRectangle({
      x: tableX,
      y: tableY,
      width: tableWidth,
      height: tableHeight,
      borderColor: brandBlue,
      borderWidth: 0.8
    });
    page.drawLine({
      start: { x: tableX + colWidth, y: tableY },
      end: { x: tableX + colWidth, y: tableY + tableHeight },
      thickness: 0.6,
      color: brandBlue
    });
    page.drawLine({
      start: { x: tableX, y: tableY + rowHeight },
      end: { x: tableX + tableWidth, y: tableY + rowHeight },
      thickness: 0.6,
      color: brandBlue
    });
    page.drawLine({
      start: { x: tableX, y: tableY + rowHeight * 2 },
      end: { x: tableX + tableWidth, y: tableY + rowHeight * 2 },
      thickness: 0.6,
      color: brandBlue
    });
    page.drawText(`Medicatie: Midazolam`, {
      x: tableX + 6,
      y: tableY + rowHeight * 2 + 4,
      size: 9.2,
      font: fonts.regular,
      color: brandBlue
    });
    page.drawText(`Concentratie: ${state.midazolam.concentrationMgPerMl} mg/ml`, {
      x: tableX + colWidth + 6,
      y: tableY + rowHeight * 2 + 4,
      size: 9.2,
      font: fonts.regular,
      color: brandBlue
    });
    page.drawText(`Oplaaddosis: ${safe(state.midazolam.loadingDoseMg)} mg`, {
      x: tableX + 6,
      y: tableY + rowHeight + 4,
      size: 9.2,
      font: fonts.regular,
      color: brandBlue
    });
    page.drawText(
      `Continue dosis: ${buildContinueDoseLabel(
        state.midazolam.continueDoseMgPer24h,
        state.midazolam.concentrationMgPerMl,
        state.general.showMlPerHour
      )}`,
      {
        x: tableX + colWidth + 6,
        y: tableY + rowHeight + 4,
        size: 9.2,
        font: fonts.regular,
        color: brandBlue
      }
    );
    page.drawText(`Bolus: ${safe(state.midazolam.bolusMg)} mg`, {
      x: tableX + 6,
      y: tableY + 4,
      size: 9.2,
      font: fonts.regular,
      color: brandBlue
    });
    page.drawText(`Lockout: ${safe(state.midazolam.lockoutHours)} uur`, {
      x: tableX + colWidth + 6,
      y: tableY + 4,
      size: 9.2,
      font: fonts.regular,
      color: brandBlue
    });
    y = tableY - 12;
    page.drawText(
      `${state.midazolam.escalation50PercentAgreement ? "☑" : "☐"} Na minimaal 4 uur zo nodig ophogen met 50%`,
      { x: leftX, y, size: 9.4, font: fonts.regular, color: brandBlue }
    );
    y -= headingGap + overigeOffset;
    drawPlainSectionHeading("OVERIGE ADVIEZEN", y);
    y -= 14;
    drawWideField("Afwijkend ophoogbeleid / opmerkingen", safe(state.midazolam.remarks), y, 220);
    y -= 15;
    drawWideField("Specifieke problemen / bijwerkingen", safe(state.midazolam.sideEffects), y, 220);
  const physicianBoxX = leftX;
  const physicianBoxY = 74;
  const physicianBoxWidth = columnWidth;
  const physicianBoxHeight = 108;
  const physicianHeaderHeight = 16;
  drawRoundedTable(physicianBoxX, physicianBoxY, physicianBoxWidth, physicianBoxHeight, 3, undefined, brandBlue, 1);
  drawTopRoundedBar(
    physicianBoxX,
    physicianBoxY + physicianBoxHeight - physicianHeaderHeight,
    physicianBoxWidth,
    physicianHeaderHeight,
    3,
    brandBlue
  );
  const physicianTitleY = physicianBoxY + physicianBoxHeight - physicianHeaderHeight + 5;
  page.drawText(physicianRoleLabel(state.general.physician.role), {
    x: physicianBoxX + 8,
    y: physicianTitleY,
    size: 10,
    font: fonts.regular,
    color: rgb(1, 1, 1)
  });
  const physicianValueEndX = physicianBoxX + physicianBoxWidth - 10;
  let physicianFieldY = physicianBoxY + physicianBoxHeight - physicianHeaderHeight - 14;
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

  const signatureBoxX = rightX;
  const signatureBoxY = physicianBoxY;
  const signatureBoxWidth = columnWidth;
  const signatureBoxHeight = 56;
  drawRoundedTable(signatureBoxX, signatureBoxY, signatureBoxWidth, signatureBoxHeight, 3, tableFillColor, brandBlue, 1);
  const signatureValueEndX = signatureBoxX + signatureBoxWidth - 10;
  let signatureFieldY = signatureBoxY + signatureBoxHeight - 18;
  drawField(
    "Plaats en datum",
    `${safe(state.general.physician.place)} ${formatDateNl(state.general.physician.date)}`,
    signatureBoxX + 8,
    signatureFieldY,
    68,
    signatureValueEndX,
    true
  );
  signatureFieldY -= 15;
  drawField("Handtekening", "", signatureBoxX + 8, signatureFieldY, 68, signatureValueEndX, true);

    const versionText = "v1.0 pallsedatie.nl";
    const versionFontSize = 8;
    const versionX = pageWidth - marginX - fonts.regular.widthOfTextAtSize(versionText, versionFontSize);
    page.drawText(versionText, {
      x: versionX,
      y: 42 - (72 / 25.4) * 10,
      size: versionFontSize,
      font: fonts.regular,
      color: brandBlue
    });
  };

  renderMainPage();

  const basePage = page;
  const embeddedBasePage = await pdfDoc.embedPage(basePage);

  const overlayPage = pdfDoc.addPage([basePage.getWidth(), basePage.getHeight()]);
  overlayPage.drawPage(embeddedBasePage, {
    x: 0,
    y: 0,
    width: basePage.getWidth(),
    height: basePage.getHeight()
  });
  drawDebugGrid(overlayPage);

  page = pdfDoc.addPage([595.28, 841.89]);
  renderInGrayscale = true;
  brandBlue = rgb(0.24, 0.24, 0.24);
  brandGold = rgb(0.62, 0.62, 0.62);
  lineColor = rgb(0.8, 0.8, 0.8);
  tableFillColor = rgb(0.92, 0.92, 0.92);
  valueFillColor = rgb(0.97, 0.97, 0.97);
  dottedLineColor = rgb(0.68, 0.68, 0.68);
  renderMainPage();

  return pdfDoc.save();
}
