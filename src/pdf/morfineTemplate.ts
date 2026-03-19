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

export async function buildMorfinePdfBytes(state: AppFormState): Promise<Uint8Array> {
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
  const drawSectionHeadingBox = (text: string, headingY: number, sectionBottomY: number) => {
    const mmToPt = 72 / 25.4;
    const sideBleed = mmToPt * 1.5;
    const sectionBoxX = leftX - 2 - sideBleed;
    const sectionBoxWidth = contentWidth + 4 + sideBleed * 2;
    const sectionTopPadding = 12;
    const sectionBottomPadding = 6;
    const sectionHeaderHeight = 16;
    const sectionTopY = headingY + sectionTopPadding;
    const sectionBoxY = sectionBottomY - sectionBottomPadding;
    const sectionBoxHeight = Math.max(sectionTopY - sectionBoxY, sectionHeaderHeight + 8);
    drawRoundedTable(sectionBoxX, sectionBoxY, sectionBoxWidth, sectionBoxHeight, 3, tableFillColor, brandBlue, 0.8);
    drawTopRoundedBar(
      sectionBoxX,
      sectionBoxY + sectionBoxHeight - sectionHeaderHeight,
      sectionBoxWidth,
      sectionHeaderHeight,
      3,
      brandBlue
    );
    page.drawText(text, {
      x: sectionBoxX + 8,
      y: sectionBoxY + sectionBoxHeight - sectionHeaderHeight + 5,
      size: 10,
      font: fonts.regular,
      color: rgb(1, 1, 1)
    });
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
  const drawWideHighlightedField = (label: string, value: string, y: number, labelWidth = 170) =>
    drawField(label, value, leftX, y, labelWidth, marginX + contentWidth, true);

  const renderMainPage = () => {
    const patientName = safe(
      [state.general.patient.gender.trim(), state.general.patient.fullName.trim()].filter(Boolean).join(" ")
    );
    const showPatientSticker = state.general.usePatientSticker;

    page.drawText("Uitvoeringsverzoek Morfine", {
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

    const mmToPt = 72 / 25.4;
    const threeMm = mmToPt * 3;
    const topY = 756;
    const topFieldStartY = 736;
    const topLineGap = 14;
    const orgTitleY = topFieldStartY - 6 * topLineGap - 12;
    const patientTableTop = topY + 12;
    const baseTopTableBottom = topFieldStartY - 5 * topLineGap - 14;
    const patientTableBottom = baseTopTableBottom - threeMm;
    const patientTableX = leftX - 6;
    const patientTableWidth = columnWidth + 12;
    drawRoundedTable(patientTableX, patientTableBottom, patientTableWidth, patientTableTop - patientTableBottom, 3);

    const patientHeaderHeight = 16;
    const patientHeaderY = patientTableTop - patientHeaderHeight;
    drawTopRoundedBar(patientTableX, patientHeaderY, patientTableWidth, patientHeaderHeight, 3, brandBlue);
    page.drawText(showPatientSticker ? "Patiëntsticker" : "Patiëntgegevens", {
      x: leftX,
      y: patientHeaderY + 5,
      size: 10,
      font: fonts.regular,
      color: rgb(1, 1, 1)
    });
    const patientNameBaselineY = patientHeaderY - 15;
    if (!showPatientSticker) {
      const patientFieldsTopY = patientNameBaselineY;
      const patientFieldsBottomY = patientTableBottom + 10;
      const patientRowGap = (patientFieldsTopY - patientFieldsBottomY) / 5;
      const patientNameY = patientFieldsTopY;
      const bornY = patientNameY - patientRowGap;
      const addressY = bornY - patientRowGap;
      const cityY = addressY - patientRowGap;
      const phoneY = cityY - patientRowGap;
      const insuranceY = phoneY - patientRowGap;

      drawColumnField("Naam", patientName, leftX, patientNameY, 66, true);
      const pairEndX = leftX + columnWidth - 2;
      const pairGap = 8;
      const bornLabelWidth = 66;
      const bsnLabelWidth = 26;
      const sharedValueWidth = Math.max(
        (pairEndX - leftX - pairGap - bornLabelWidth - bsnLabelWidth) / 2,
        0
      );
      const bornValueX = leftX + bornLabelWidth;
      const bornValueEndX = bornValueX + sharedValueWidth;
      const bsnValueX = pairEndX - sharedValueWidth;
      const bsnLabelX = bsnValueX - bsnLabelWidth;
      const bsnValueEndX = pairEndX;
      page.drawRectangle({
        x: bornValueX,
        y: bornY - 1.8,
        width: sharedValueWidth,
        height: 10.8,
        color: valueFillColor
      });
      page.drawRectangle({
        x: bsnValueX,
        y: bornY - 1.8,
        width: sharedValueWidth,
        height: 10.8,
        color: valueFillColor
      });
      page.drawText("Geboren:", { x: leftX, y: bornY, size: 9, font: fonts.semibold, color: brandBlue });
      page.drawText(formatDateNl(state.general.patient.birthDate), { x: bornValueX, y: bornY, size: 10, font: fonts.regular, color: brandBlue });
      page.drawLine({
        start: { x: bornValueX, y: bornY - 2 },
        end: { x: bornValueEndX, y: bornY - 2 },
        thickness: 0.3,
        color: dottedLineColor,
        dashArray: [1.5, 1.5]
      });
      page.drawText("BSN:", { x: bsnLabelX, y: bornY, size: 9, font: fonts.semibold, color: brandBlue });
      page.drawText(safe(state.general.patient.bsn), { x: bsnValueX, y: bornY, size: 10, font: fonts.regular, color: brandBlue });
      page.drawLine({
        start: { x: bsnValueX, y: bornY - 2 },
        end: { x: bsnValueEndX, y: bornY - 2 },
        thickness: 0.3,
        color: dottedLineColor,
        dashArray: [1.5, 1.5]
      });
      drawColumnField("Adres", safe(state.general.patient.address), leftX, addressY, 66, true);
      drawColumnField("Plaats", safe(state.general.patient.city), leftX, cityY, 66, true);
      drawColumnField("Telefoon", safe(state.general.patient.contactPhone), leftX, phoneY, 66, true);
      drawColumnField("Verzekering", safe(state.general.patient.insurance), leftX, insuranceY, 66, true);
    }

    const rightPanelX = rightX - 6;
    const rightPanelWidth = columnWidth + 12;
    const rightPanelHeight = patientTableTop - patientTableBottom;
    const panelHeaderHeight = 16;
    const rightPanelGap = 6;
    const lineStep = 13.5;
    const uitvoerendeTopPadding = 12;
    const uitvoerendeBottomPadding = 9;
    const apotheekTopPadding = 12;
    const apotheekBottomPadding = 9;
    const apotheekHeaderExtraHeight = mmToPt * 0.5;
    const apotheekHeight =
      panelHeaderHeight + apotheekTopPadding + lineStep + apotheekBottomPadding + apotheekHeaderExtraHeight;
    const minUitvoerendeHeight =
      panelHeaderHeight + uitvoerendeTopPadding + lineStep * 2 + uitvoerendeBottomPadding;
    const uitvoerendeHeight = Math.max(
      minUitvoerendeHeight,
      rightPanelHeight - rightPanelGap - apotheekHeight
    );
    const resolvedApotheekHeight = rightPanelHeight - uitvoerendeHeight - rightPanelGap;
    const uitvoerendeY = patientTableTop - uitvoerendeHeight;
    const apotheekY = patientTableBottom;
    drawRoundedTable(rightPanelX, uitvoerendeY, rightPanelWidth, uitvoerendeHeight, 3);
    drawRoundedTable(rightPanelX, apotheekY, rightPanelWidth, resolvedApotheekHeight, 3);
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
      apotheekY + resolvedApotheekHeight - panelHeaderHeight,
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
  const sharedBottomFieldMargin =
    resolvedApotheekHeight - panelHeaderHeight - apotheekTopPadding - lineStep;
  const uitvoerendeNaamY = patientNameBaselineY;
  const uitvoerendeEmailBaseY = uitvoerendeY + sharedBottomFieldMargin;
  const uitvoerendeTelefoonY =
    (uitvoerendeY + sharedBottomFieldMargin + lineStep * 2 + uitvoerendeEmailBaseY) / 2;
  const uitvoerendeTelefoonAdjustedY = uitvoerendeTelefoonY - mmToPt * 1;
  const uitvoerendeNaamTelefoonGap = uitvoerendeNaamY - uitvoerendeTelefoonAdjustedY;
  const uitvoerendeEmailY = uitvoerendeTelefoonAdjustedY - (uitvoerendeNaamY - uitvoerendeTelefoonAdjustedY);
  drawField("Naam", safe(state.general.organization), rightInnerX, uitvoerendeNaamY, 58, rightInnerEndX, true);
  drawField(
    "Telefoon",
    safe(state.general.organizationPhone),
    rightInnerX,
    uitvoerendeTelefoonAdjustedY,
    58,
    rightInnerEndX,
    true
  );
  drawField(
    "E-mail",
    safe(state.general.organizationSecureEmail),
    rightInnerX,
    uitvoerendeEmailY,
    58,
    rightInnerEndX,
    true
  );

  page.drawText("Apotheek", {
    x: rightInnerX,
    y: apotheekY + resolvedApotheekHeight - panelHeaderHeight + 5,
    size: 10,
    font: fonts.regular,
    color: rgb(1, 1, 1)
  });
  const apotheekFieldsDownShift = mmToPt * 1;
  const apotheekTopFieldY =
    apotheekY + resolvedApotheekHeight - panelHeaderHeight - apotheekTopPadding - apotheekFieldsDownShift;
  drawField("Naam", safe(state.general.pharmacy), rightInnerX, apotheekTopFieldY, 58, rightInnerEndX, true);
  drawField(
    "Telefoon",
    safe(state.general.pharmacyPhone),
    rightInnerX,
    apotheekTopFieldY - uitvoerendeNaamTelefoonGap,
    58,
    rightInnerEndX,
    true
  );

    const mm = 72 / 25.4;
    const twoCm = mm * 20;
    const headingGap = mm * 8;
    const indicatieOffset = mm * 2;
    const medicatieOffset = mm * 5;
    const overigeOffset = mm * 6;
    const fiveMm = mm * 5;
    const headingToFirstFieldOffset = 14;
    const verzoekHeadingToFirstFieldOffset = 21;
    const indicatieHeadingToFirstFieldOffset = 18;
    const indicatieHeadingDownShift = mm * 5;
    const indicatieContentDownShift = 4;
    const medicatieContentDownShift = 8;
    const overigeContentDownShift = 4;
    const fieldGap = 15;
    const verzoekHeadingY = orgTitleY - 74 + twoCm - fiveMm;
    const verzoekActionY = verzoekHeadingY - verzoekHeadingToFirstFieldOffset;
    const verzoekStartDatumY = verzoekActionY - fieldGap;
    const verzoekBottomY = verzoekStartDatumY - 8;

    const indicatieHeadingY = verzoekStartDatumY - (headingGap + indicatieOffset) - indicatieHeadingDownShift;
    const indicatieDiagnoseY = indicatieHeadingY - indicatieHeadingToFirstFieldOffset;
    const indicatieSymptoomY = indicatieDiagnoseY - fieldGap;
    const indicatieBottomY = indicatieSymptoomY - 8;

    const medicatieHeadingY = indicatieSymptoomY - (headingGap + medicatieOffset);
    const medicatieContentStartY = medicatieHeadingY - headingToFirstFieldOffset - medicatieContentDownShift;
    const medicatieLastFieldY = medicatieContentStartY - fieldGap * 2;
    const medicatieCheckboxY = medicatieLastFieldY - fieldGap;
    const medicatieBottomY = medicatieCheckboxY - 8;

    const overigeHeadingY = medicatieCheckboxY - (headingGap + overigeOffset);
    const overigeAdviesY = overigeHeadingY - headingToFirstFieldOffset - overigeContentDownShift;
    const overigeBijwerkingenY = overigeAdviesY - fieldGap;
    const overigeBottomY = overigeBijwerkingenY - 8;

    drawSectionHeadingBox("Verzoek", verzoekHeadingY, verzoekBottomY);
    drawSectionHeadingBox("Indicatie", indicatieHeadingY, indicatieBottomY);
    drawSectionHeadingBox("Medicatiegegevens (morfinepomp)", medicatieHeadingY, medicatieBottomY);
    drawSectionHeadingBox("Overige adviezen", overigeHeadingY, overigeBottomY);

    drawWideHighlightedField("Uit te voeren handeling", "Aansluiten medicatie via sc/iv infuuspomp", verzoekActionY, 170);
    drawWideHighlightedField("Startdatum", formatDateNl(state.morfine.startDate), verzoekStartDatumY);
    drawWideHighlightedField(
      "Diagnose / ziektebeeld",
      safe(state.morfine.diagnosis),
      indicatieDiagnoseY - indicatieContentDownShift
    );
    drawWideHighlightedField(
      "Indicatie / refractair symptoom",
      safe(state.morfine.indication),
      indicatieSymptoomY - indicatieContentDownShift
    );

    const medFieldY1 = medicatieContentStartY;
    const medFieldY2 = medFieldY1 - fieldGap;
    const medFieldY3 = medFieldY2 - fieldGap;
    const medLabelWidth = 100;
    const medMidX = leftX + contentWidth / 2 + columnGap / 2;
    const medLeftEndX = medMidX - columnGap / 2;
    const medRightEndX = marginX + contentWidth;

    drawField("Medicatie", "Morfine", leftX, medFieldY1, medLabelWidth, medLeftEndX, true);
    drawField("Concentratie", `${state.morfine.concentrationMgPerMl} mg/ml`, medMidX, medFieldY1, medLabelWidth, medRightEndX, true);
    drawField("Oplaaddosis", `${safe(state.morfine.bolusMg)} mg`, leftX, medFieldY2, medLabelWidth, medLeftEndX, true);
    drawField(
      "Continue dosis",
      buildContinueDoseLabel(state.morfine.continueDoseMgPer24h, state.morfine.concentrationMgPerMl, state.general.showMlPerHour),
      medMidX, medFieldY2, medLabelWidth, medRightEndX, true
    );
    drawField("Bolus", `${safe(state.morfine.bolusMg)} mg`, leftX, medFieldY3, medLabelWidth, medLeftEndX, true);
    drawField("Lockout", `${safe(state.morfine.lockoutHours)} uur`, medMidX, medFieldY3, medLabelWidth, medRightEndX, true);
    page.drawText(
      `${state.morfine.escalation50PercentAgreement ? "☑" : "☐"} Na minimaal 4 uur zo nodig ophogen met 50%`,
      { x: leftX, y: medicatieCheckboxY, size: 9.4, font: fonts.regular, color: brandBlue }
    );
    drawWideHighlightedField(
      "Afwijkend ophoogbeleid / opmerkingen",
      safe(state.morfine.continuationAdvice),
      overigeAdviesY,
      190
    );
    drawWideHighlightedField(
      "Specifieke problemen / bijwerkingen",
      safe(state.morfine.sideEffects),
      overigeBijwerkingenY,
      190
    );
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

    const versionText = "v1.0 pallsedatie.nl - dit is een beta test, nog niet voor officieel gebruik";
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
