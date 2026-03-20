import { PDFDocument, rgb } from "pdf-lib";
import { AppFormState } from "../types/models";
import { formatDateNl } from "./formatters";
import { checkboxSvgData } from "./checkboxAsset";
import { getPallsedatieLogoSvgData } from "./logoAsset";
import { loadSourceSansFonts } from "./sourceSansFonts";

function safe(value: string): string {
  return value.trim();
}

function withUnit(value: string, unit: string): string {
  const safeValue = safe(value);
  return safeValue ? `${safeValue} ${unit}` : "";
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

/** Compacte weergave met komma als decimaalteken (PDF / NL). */
function formatCompactNumber(value: number): string {
  const s = value.toFixed(2).replace(/\.?0+$/, "");
  return s.replace(".", ",");
}

/** Continue dosis: mg/24u + optioneel ml/uur tussen haakjes (zonder "="), voor tweekleurige PDF-tekst. */
function parseContinueDoseForPdf(
  doseText: string,
  concentrationMgPerMl: number,
  showMlPerHour: boolean
): { primaryDisplay: string; lightSuffix: string | null } {
  const safeDoseText = safe(doseText);
  if (!safeDoseText) {
    return { primaryDisplay: "", lightSuffix: null };
  }
  const base = `${safeDoseText} mg/24u`;
  if (!showMlPerHour) {
    return { primaryDisplay: base, lightSuffix: null };
  }
  const doseNumber = Number.parseFloat(doseText.replace(",", "."));
  if (!Number.isFinite(doseNumber) || concentrationMgPerMl <= 0) {
    return { primaryDisplay: base, lightSuffix: null };
  }
  const mlPerHour = doseNumber / 24 / concentrationMgPerMl;
  return {
    primaryDisplay: base,
    lightSuffix: ` (${formatCompactNumber(mlPerHour)} ml/uur)`
  };
}

/** Oplaaddosis / bolus: mg-deel + optioneel ml-tussen haakjes (zelfde logica als PDF-weergave). */
function parseMgDoseWithOptionalMl(
  mgText: string,
  concentrationMgPerMl: number,
  showMlOnPdf: boolean
): { mgDisplay: string; mlSuffix: string | null } {
  const safeMg = safe(mgText);
  if (!safeMg) {
    return { mgDisplay: "", mlSuffix: null };
  }
  const base = `${safeMg} mg`;
  if (!showMlOnPdf || concentrationMgPerMl <= 0) {
    return { mgDisplay: base, mlSuffix: null };
  }
  const mgNum = Number.parseFloat(mgText.replace(",", "."));
  if (!Number.isFinite(mgNum)) {
    return { mgDisplay: base, mlSuffix: null };
  }
  const ml = mgNum / concentrationMgPerMl;
  return { mgDisplay: base, mlSuffix: ` (${formatCompactNumber(ml)} ml)` };
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

  const drawFieldWithOptionalLightSuffix = (
    label: string,
    primaryDisplay: string,
    lightSuffix: string | null,
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
    const valueFontSize = 10;
    if (primaryDisplay) {
      page.drawText(primaryDisplay, { x: valueX, y, size: valueFontSize, font: fonts.regular, color: brandBlue });
    }
    if (lightSuffix) {
      const primaryWidth = fonts.regular.widthOfTextAtSize(primaryDisplay, valueFontSize);
      page.drawText(lightSuffix, {
        x: valueX + primaryWidth,
        y,
        size: valueFontSize,
        font: fonts.regular,
        color: dottedLineColor
      });
    }
    page.drawLine({
      start: { x: valueX, y: y - 2 },
      end: { x: endX, y: y - 2 },
      thickness: 0.3,
      color: highlightValue ? dottedLineColor : lineColor,
      dashArray: highlightValue ? [1.5, 1.5] : undefined
    });
  };

  const drawFieldMgWithOptionalMlSuffix = (
    label: string,
    parsed: { mgDisplay: string; mlSuffix: string | null },
    x: number,
    y: number,
    labelWidth: number,
    endX: number,
    highlightValue = false
  ) =>
    drawFieldWithOptionalLightSuffix(label, parsed.mgDisplay, parsed.mlSuffix, x, y, labelWidth, endX, highlightValue);

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
  const drawWideTwoLineHighlightedField = (
    label: string,
    firstValue: string,
    secondValue: string,
    firstY: number,
    secondY: number,
    labelWidth = 170
  ) => {
    const valueX = leftX + labelWidth;
    const endX = marginX + contentWidth;
    const topY = Math.max(firstY, secondY) + 9;
    const bottomY = Math.min(firstY, secondY) - 1.8;
    page.drawRectangle({
      x: valueX,
      y: bottomY,
      width: Math.max(endX - valueX, 0),
      height: Math.max(topY - bottomY, 0),
      color: valueFillColor
    });
    page.drawText(`${label}:`, { x: leftX, y: firstY, size: 9, font: fonts.semibold, color: brandBlue });
    page.drawText(firstValue, { x: valueX, y: firstY, size: 10, font: fonts.regular, color: brandBlue });
    page.drawText(secondValue, { x: valueX, y: secondY, size: 10, font: fonts.regular, color: brandBlue });
    page.drawLine({
      start: { x: valueX, y: firstY - 2 },
      end: { x: endX, y: firstY - 2 },
      thickness: 0.3,
      color: dottedLineColor,
      dashArray: [1.5, 1.5]
    });
    page.drawLine({
      start: { x: valueX, y: secondY - 2 },
      end: { x: endX, y: secondY - 2 },
      thickness: 0.3,
      color: dottedLineColor,
      dashArray: [1.5, 1.5]
    });
  };
  const drawWideThreeLineHighlightedField = (
    label: string,
    firstValue: string,
    secondValue: string,
    thirdValue: string,
    firstY: number,
    secondY: number,
    thirdY: number,
    labelWidth = 170
  ) => {
    const valueX = leftX + labelWidth;
    const endX = marginX + contentWidth;
    const topY = Math.max(firstY, secondY, thirdY) + 9;
    const bottomY = Math.min(firstY, secondY, thirdY) - 1.8;
    page.drawRectangle({
      x: valueX,
      y: bottomY,
      width: Math.max(endX - valueX, 0),
      height: Math.max(topY - bottomY, 0),
      color: valueFillColor
    });
    page.drawText(`${label}:`, { x: leftX, y: firstY, size: 9, font: fonts.semibold, color: brandBlue });
    page.drawText(firstValue, { x: valueX, y: firstY, size: 10, font: fonts.regular, color: brandBlue });
    page.drawText(secondValue, { x: valueX, y: secondY, size: 10, font: fonts.regular, color: brandBlue });
    page.drawText(thirdValue, { x: valueX, y: thirdY, size: 10, font: fonts.regular, color: brandBlue });
    page.drawLine({
      start: { x: valueX, y: firstY - 2 },
      end: { x: endX, y: firstY - 2 },
      thickness: 0.3,
      color: dottedLineColor,
      dashArray: [1.5, 1.5]
    });
    page.drawLine({
      start: { x: valueX, y: secondY - 2 },
      end: { x: endX, y: secondY - 2 },
      thickness: 0.3,
      color: dottedLineColor,
      dashArray: [1.5, 1.5]
    });
    page.drawLine({
      start: { x: valueX, y: thirdY - 2 },
      end: { x: endX, y: thirdY - 2 },
      thickness: 0.3,
      color: dottedLineColor,
      dashArray: [1.5, 1.5]
    });
  };
  const drawRoundedCheckboxLine = (checked: boolean, text: string, x: number, y: number) => {
    const boxSize = 10;
    const boxY = y - 1.6;
    const vb = checkboxSvgData.viewBox;
    const scale = boxSize / vb.height;
    const fillRgb = renderInGrayscale
      ? hexToGrayColor(checkboxSvgData.fillHex)
      : hexToRgbColor(checkboxSvgData.fillHex);
    const strokeRgb = renderInGrayscale
      ? hexToGrayColor(checkboxSvgData.strokeHex)
      : hexToRgbColor(checkboxSvgData.strokeHex);
    page.drawSvgPath(checkboxSvgData.pathD, {
      x,
      y: boxY + boxSize,
      scale,
      color: fillRgb,
      borderColor: strokeRgb,
      borderWidth: checkboxSvgData.strokeWidth,
      ...(checkboxSvgData.borderDashArray?.length
        ? {
            borderDashArray: checkboxSvgData.borderDashArray,
            borderDashPhase: checkboxSvgData.borderDashPhase ?? 0
          }
        : {})
    });
    if (checked) {
      page.drawLine({
        start: { x: x + 2.2, y: boxY + 4.7 },
        end: { x: x + 4.2, y: boxY + 2.8 },
        thickness: 1.1,
        color: brandBlue
      });
      page.drawLine({
        start: { x: x + 4.1, y: boxY + 2.8 },
        end: { x: x + 7.8, y: boxY + 7.7 },
        thickness: 1.1,
        color: brandBlue
      });
    }
    page.drawText(text, { x: x + boxSize + 6, y, size: 9.4, font: fonts.regular, color: brandBlue });
  };

  const splitAdviceIntoThreeLines = (raw: string): { line1: string; line2: string; line3: string } => {
    const t = raw.trim();
    if (!t) {
      return { line1: "", line2: "", line3: "" };
    }
    const lines = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      return { line1: "", line2: "", line3: "" };
    }
    const [line1 = "", line2 = "", line3 = ""] = lines;
    return { line1, line2, line3 };
  };

  const renderMainPage = () => {
    const patientName = safe(
      [state.general.patient.gender.trim(), state.general.patient.fullName.trim()].filter(Boolean).join(" ")
    );
    const showPatientSticker = state.general.usePatientSticker;

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

    const sectionGap = mmToPt * 7;
    const sectionTopPadding = 12;
    const sectionBottomPadding = 6;
    const headingToFirstFieldOffset = 14;
    const indicatieHeadingToFirstFieldOffset = 18;
    const verzoekHeadingToFirstFieldOffset = state.midazolam.cadPlacementAllowed
      ? 21
      : indicatieHeadingToFirstFieldOffset;
    const indicatieContentDownShift = 4;
    const medicatieContentDownShift = 8;
    const overigeContentDownShift = 4;
    const fieldGap = 15;
    const verzoekHeadingY = patientTableBottom - sectionGap - sectionTopPadding;
    const verzoekActionY = verzoekHeadingY - verzoekHeadingToFirstFieldOffset;
    const verzoekCadY = verzoekActionY - fieldGap;
    const verzoekStartDatumY = verzoekActionY - (state.midazolam.cadPlacementAllowed ? fieldGap * 2 : fieldGap);
    const verzoekBottomY = verzoekStartDatumY - 8;

    const indicatieHeadingY = verzoekBottomY - sectionBottomPadding - sectionGap - sectionTopPadding;
    const indicatieDiagnoseY = indicatieHeadingY - indicatieHeadingToFirstFieldOffset;
    const indicatieSymptoomY = indicatieDiagnoseY - fieldGap;
    const indicatieBottomY = indicatieSymptoomY - 8;

    const medicatieHeadingY = indicatieBottomY - sectionBottomPadding - sectionGap - sectionTopPadding;
    const medicatieContentStartY = medicatieHeadingY - headingToFirstFieldOffset - medicatieContentDownShift;
    const medFieldY1 = medicatieContentStartY;
    const medFieldY2 = medFieldY1 - fieldGap;
    const medFieldY3 = medFieldY2 - fieldGap;
    const medicatieCheckboxY = medFieldY3;
    const medicatieBlockBottomTightening = mmToPt * 3;
    const medicatieBottomY = medicatieCheckboxY - 14 + medicatieBlockBottomTightening;

    const overigeHeadingY = medicatieBottomY - sectionBottomPadding - sectionGap - sectionTopPadding;
    const overigeLineGap = 14;
    const overigeBlockGap = 18;
    const firstOverigeFieldDownShift = mmToPt * 1;
    const overigeOpmerkingenY1 = overigeHeadingY - headingToFirstFieldOffset - overigeContentDownShift;
    const overigeOpmerkingenY2 = overigeOpmerkingenY1 - overigeLineGap;
    const overigeOpmerkingenY3 = overigeOpmerkingenY2 - overigeLineGap;
    const overigeBijwerkingenY1 = overigeOpmerkingenY3 - overigeBlockGap;
    const overigeBijwerkingenY2 = overigeBijwerkingenY1 - overigeLineGap;
    const overigeBijwerkingenY3 = overigeBijwerkingenY2 - overigeLineGap;
    const overigeBottomY = overigeBijwerkingenY3 - 8;

    drawSectionHeadingBox("Verzoek", verzoekHeadingY, verzoekBottomY);
    drawSectionHeadingBox("Indicatie", indicatieHeadingY, indicatieBottomY);
    drawSectionHeadingBox("Medicatiegegevens (midazolampomp)", medicatieHeadingY, medicatieBottomY);
    drawSectionHeadingBox("Overige adviezen", overigeHeadingY, overigeBottomY);

    if (state.midazolam.cadPlacementAllowed) {
      drawWideTwoLineHighlightedField(
        "Uit te voeren handeling",
        "Aansluiten medicatie via sc/iv infuuspomp",
        `+ plaatsen CAD (Maat: Ch ${state.midazolam.cadSizeCharriere})`,
        verzoekActionY,
        verzoekCadY,
        170
      );
    } else {
      drawWideHighlightedField(
        "Uit te voeren handeling",
        "Aansluiten medicatie via sc/iv infuuspomp",
        verzoekActionY - indicatieContentDownShift,
        170
      );
    }
    drawWideHighlightedField(
      "Startdatum",
      formatDateNl(state.midazolam.startDate),
      verzoekStartDatumY - (state.midazolam.cadPlacementAllowed ? 0 : indicatieContentDownShift)
    );
    drawWideHighlightedField(
      "Diagnose / ziektebeeld",
      safe(state.midazolam.diagnosis),
      indicatieDiagnoseY - indicatieContentDownShift
    );
    drawWideHighlightedField(
      "Indicatie / refractair symptoom",
      safe(state.midazolam.indication),
      indicatieSymptoomY - indicatieContentDownShift
    );

    const medLabelWidth = 100;
    const medMidX = leftX + contentWidth / 2 + columnGap / 2;
    const medLeftEndX = medMidX - columnGap / 2;
    const medRightEndX = marginX + contentWidth;

    drawField(
      "Medicatie",
      `Midazolam ${state.midazolam.concentrationMgPerMl} mg/ml`,
      leftX,
      medFieldY1,
      medLabelWidth,
      medLeftEndX,
      true
    );
    drawFieldMgWithOptionalMlSuffix(
      "Oplaaddosis",
      parseMgDoseWithOptionalMl(
        state.midazolam.loadingDoseMg,
        state.midazolam.concentrationMgPerMl,
        !state.general.hideMlPerHourOnPdf
      ),
      medMidX,
      medFieldY1,
      medLabelWidth,
      medRightEndX,
      true
    );
    const continueDoseParsed = parseContinueDoseForPdf(
      state.midazolam.continueDoseMgPer24h,
      state.midazolam.concentrationMgPerMl,
      !state.general.hideMlPerHourOnPdf
    );
    drawFieldWithOptionalLightSuffix(
      "Continue dosis",
      continueDoseParsed.primaryDisplay,
      continueDoseParsed.lightSuffix,
      leftX,
      medFieldY2,
      medLabelWidth,
      medLeftEndX,
      true
    );
    drawFieldMgWithOptionalMlSuffix(
      "Bolus",
      parseMgDoseWithOptionalMl(
        state.midazolam.bolusMg,
        state.midazolam.concentrationMgPerMl,
        !state.general.hideMlPerHourOnPdf
      ),
      medMidX,
      medFieldY2,
      medLabelWidth,
      medRightEndX,
      true
    );
    drawRoundedCheckboxLine(
      state.midazolam.escalation50PercentAgreement,
      "Na minimaal 4 uur zo nodig ophogen met 50%",
      leftX,
      medicatieCheckboxY - mmToPt
    );
    drawField("Lockout", withUnit(state.midazolam.lockoutHours, "uur"), medMidX, medFieldY3, medLabelWidth, medRightEndX, true);
    const advOpmerkingen = splitAdviceIntoThreeLines(state.midazolam.remarks);
    drawWideThreeLineHighlightedField(
      "Afwijkend ophoogbeleid / opmerkingen",
      advOpmerkingen.line1,
      advOpmerkingen.line2,
      advOpmerkingen.line3,
      overigeOpmerkingenY1 - firstOverigeFieldDownShift,
      overigeOpmerkingenY2 - firstOverigeFieldDownShift,
      overigeOpmerkingenY3 - firstOverigeFieldDownShift,
      220
    );
    const advBijwerkingen = splitAdviceIntoThreeLines(state.midazolam.sideEffects);
    drawWideThreeLineHighlightedField(
      "Specifieke problemen / bijwerkingen",
      advBijwerkingen.line1,
      advBijwerkingen.line2,
      advBijwerkingen.line3,
      overigeBijwerkingenY1,
      overigeBijwerkingenY2,
      overigeBijwerkingenY3,
      220
    );
  const footerBlockY = 48 - (72 / 25.4) * 5;
  const physicianBoxX = leftX;
  const physicianBoxY = footerBlockY;
  const physicianBoxWidth = columnWidth;
  const physicianBoxHeight = patientTableTop - patientTableBottom;
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
  const physicianFieldsTopY = physicianBoxY + physicianBoxHeight - physicianHeaderHeight - 14;
  const physicianFieldsBottomY = physicianBoxY + 10;
  const physicianRowGap = (physicianFieldsTopY - physicianFieldsBottomY) / 5;
  const physicianNameY = physicianFieldsTopY;
  const physicianPracticeY = physicianNameY - physicianRowGap;
  const physicianAddressY = physicianPracticeY - physicianRowGap;
  const physicianPlaceY = physicianAddressY - physicianRowGap;
  const physicianPhoneY = physicianPlaceY - physicianRowGap;
  const physicianAnwY = physicianPhoneY - physicianRowGap;
  drawField("Naam", safe(state.general.physician.fullName), physicianBoxX + 8, physicianNameY, 54, physicianValueEndX, true);
  drawField("Praktijk", safe(state.general.physician.practice), physicianBoxX + 8, physicianPracticeY, 54, physicianValueEndX, true);
  drawField("Adres", safe(state.general.physician.practiceAddress), physicianBoxX + 8, physicianAddressY, 54, physicianValueEndX, true);
  drawField("Plaats", safe(state.general.physician.place), physicianBoxX + 8, physicianPlaceY, 54, physicianValueEndX, true);
  drawField("Telefoon", safe(state.general.physician.phone), physicianBoxX + 8, physicianPhoneY, 54, physicianValueEndX, true);
  drawField("Tel. ANW", safe(state.general.physician.anwPhone), physicianBoxX + 8, physicianAnwY, 54, physicianValueEndX, true);

  const signatureBoxX = rightX;
  const signatureBoxY = footerBlockY;
  const signatureBoxWidth = columnWidth;
  const signatureBoxHeight = physicianBoxHeight;
  const signatureHeaderHeight = 16;
  const signatureHeaderBottomY = signatureBoxY + signatureBoxHeight - signatureHeaderHeight;
  const signaturePad = 10;
  drawRoundedTable(signatureBoxX, signatureBoxY, signatureBoxWidth, signatureBoxHeight, 3, undefined, brandBlue, 1);
  drawTopRoundedBar(
    signatureBoxX,
    signatureHeaderBottomY,
    signatureBoxWidth,
    signatureHeaderHeight,
    3,
    brandBlue
  );
  page.drawText("Ondertekening", {
    x: signatureBoxX + 8,
    y: signatureHeaderBottomY + 5,
    size: 10,
    font: fonts.regular,
    color: rgb(1, 1, 1)
  });
  const signatureValueEndX = signatureBoxX + signatureBoxWidth - signaturePad;
  const plaatsY = signatureHeaderBottomY - 14;
  const datumY = physicianPracticeY;
  drawField(
    "Plaats",
    safe(state.general.physician.place),
    signatureBoxX + signaturePad,
    plaatsY,
    68,
    signatureValueEndX,
    true
  );
  drawField(
    "Datum",
    formatDateNl(state.general.physician.date),
    signatureBoxX + signaturePad,
    datumY,
    68,
    signatureValueEndX,
    true
  );
  // Handtekening-vlak: rechthoek = expliciet onderkant + bovenkant (geen verborgen minimumhoogte).
  const handtekeningVlakBottom = signatureBoxY + signaturePad - mmToPt * 0.7;
  const gapDatumNaarBovenkantVak = mmToPt * 7;
  const handtekeningVlakTop = datumY - gapDatumNaarBovenkantVak + mmToPt * 4;
  const handtekeningVlakHeight = Math.max(handtekeningVlakTop - handtekeningVlakBottom, 1);
  const handtekeningVlakWidth = signatureBoxWidth - signaturePad * 2;
  page.drawRectangle({
    x: signatureBoxX + signaturePad,
    y: handtekeningVlakBottom,
    width: handtekeningVlakWidth,
    height: handtekeningVlakHeight,
    color: rgb(1, 1, 1),
    borderColor: dottedLineColor,
    borderWidth: 0.6
  });
  page.drawText("Handtekening:", {
    x: signatureBoxX + signaturePad + 6,
    y: handtekeningVlakBottom + handtekeningVlakHeight - 8,
    size: 9,
    font: fonts.semibold,
    color: brandBlue
  });

    const versionPrefixText = state.general.hideBetaWarningOnPdf
      ? "v1.0 pallsedatie.nl"
      : "v1.0 pallsedatie.nl - ";
    const betaWarningText = "dit is een beta test, nog niet voor officieel gebruik";
    const versionFontSize = 8;
    const versionPrefixWidth = fonts.regular.widthOfTextAtSize(versionPrefixText, versionFontSize);
    const betaWarningWidth = fonts.semibold.widthOfTextAtSize(betaWarningText, versionFontSize);
    const footerWidth = state.general.hideBetaWarningOnPdf
      ? versionPrefixWidth
      : versionPrefixWidth + betaWarningWidth;
    const versionX = pageWidth - marginX - footerWidth;
    const versionY = 42 - (72 / 25.4) * 10;
    page.drawText(versionPrefixText, {
      x: versionX,
      y: versionY,
      size: versionFontSize,
      font: fonts.regular,
      color: brandBlue
    });
    if (!state.general.hideBetaWarningOnPdf) {
      page.drawText(betaWarningText, {
        x: versionX + versionPrefixWidth,
        y: versionY,
        size: versionFontSize,
        font: fonts.semibold,
        color: rgb(0.8, 0.1, 0.1)
      });
    }
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
