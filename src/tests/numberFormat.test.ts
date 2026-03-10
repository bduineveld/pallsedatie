import { describe, expect, it } from "vitest";
import { formatMedicalNumber } from "../domain/format/numberFormat";

describe("formatMedicalNumber", () => {
  it("shows whole numbers without decimals", () => {
    expect(formatMedicalNumber(10)).toBe("10");
    expect(formatMedicalNumber(0)).toBe("0");
  });

  it("keeps explicit .5 values", () => {
    expect(formatMedicalNumber(2.5)).toBe("2.5");
    expect(formatMedicalNumber(6.5)).toBe("6.5");
  });

  it("rounds non .5 decimal values to whole numbers", () => {
    expect(formatMedicalNumber(2.2)).toBe("2");
    expect(formatMedicalNumber(2.8)).toBe("3");
  });
});
