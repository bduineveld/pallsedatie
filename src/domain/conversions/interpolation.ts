import { InterpolationPoint } from "../../data/opioidRotationTable";

export interface InterpolationResult {
  value: number;
  usedInterpolation: boolean;
  note?: string;
}

export function findNeighborPoints(
  dose: number,
  points: InterpolationPoint[]
): { exact?: InterpolationPoint; lower?: InterpolationPoint; upper?: InterpolationPoint } {
  const sorted = [...points].sort((a, b) => a.xDose - b.xDose);
  const exact = sorted.find((point) => point.xDose === dose);
  if (exact) {
    return { exact };
  }

  let lower: InterpolationPoint | undefined;
  let upper: InterpolationPoint | undefined;

  for (const point of sorted) {
    if (point.xDose < dose) {
      lower = point;
    }
    if (point.xDose > dose) {
      upper = point;
      break;
    }
  }

  return { lower, upper };
}

export function interpolateLinearly(dose: number, points: InterpolationPoint[]): InterpolationResult {
  const neighbors = findNeighborPoints(dose, points);
  if (neighbors.exact) {
    return { value: neighbors.exact.yMorphineScIvMgPer24h, usedInterpolation: false };
  }
  if (!neighbors.lower || !neighbors.upper) {
    return {
      value: Number.NaN,
      usedInterpolation: false,
      note: "Dosis buiten tabelbereik; extrapolatie is niet toegestaan."
    };
  }

  const x1 = neighbors.lower.xDose;
  const y1 = neighbors.lower.yMorphineScIvMgPer24h;
  const x2 = neighbors.upper.xDose;
  const y2 = neighbors.upper.yMorphineScIvMgPer24h;

  // Lineaire interpolatie op twee expliciete tabelpunten:
  // y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)
  const value = y1 + ((dose - x1) * (y2 - y1)) / (x2 - x1);
  const note = `Lineair berekend tussen (${x1} -> ${y1}) en (${x2} -> ${y2}).`;
  return { value, usedInterpolation: true, note };
}
