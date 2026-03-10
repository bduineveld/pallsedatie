import { describe, expect, it } from "vitest";
import { interpolateLinearly } from "../domain/conversions/interpolation";

describe("interpolateLinearly", () => {
  it("returns exact table value when dose exists", () => {
    const result = interpolateLinearly(20, [
      { xDose: 20, yMorphineScIvMgPer24h: 10 },
      { xDose: 40, yMorphineScIvMgPer24h: 20 }
    ]);
    expect(result.value).toBe(10);
    expect(result.usedInterpolation).toBe(false);
  });

  it("uses linear interpolation between two points", () => {
    const result = interpolateLinearly(30, [
      { xDose: 20, yMorphineScIvMgPer24h: 10 },
      { xDose: 40, yMorphineScIvMgPer24h: 20 }
    ]);
    expect(result.value).toBe(15);
    expect(result.usedInterpolation).toBe(true);
  });

  it("refuses extrapolation beyond table bounds", () => {
    const result = interpolateLinearly(10, [
      { xDose: 20, yMorphineScIvMgPer24h: 10 },
      { xDose: 40, yMorphineScIvMgPer24h: 20 }
    ]);
    expect(Number.isNaN(result.value)).toBe(true);
    expect(result.note).toContain("buiten tabelbereik");
  });
});
