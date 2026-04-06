import { describe, expect, it } from "vitest";
import {
  buildMidazolamIntermittentPumpMaintenanceOptions,
  formatIntermittentPumpMaintenanceInputToken,
  matchIntermittentPumpMaintenanceOption
} from "../domain/guidelineLogic/midazolamIntermittentPumpMaintenanceOptions";

describe("midazolamIntermittentPumpMaintenanceOptions", () => {
  it("biedt 0,5 t/m 2,5 mg/uur met 1,5 als standaard", () => {
    const opts = buildMidazolamIntermittentPumpMaintenanceOptions();
    expect(opts.map((o) => o.mgPerHour)).toEqual([0.5, 1, 1.5, 2, 2.5]);
    expect(opts.find((o) => o.mgPerHour === 1.5)?.isDefault).toBe(true);
    expect(opts.find((o) => o.mgPerHour === 1.5)?.listLabel).toContain("mg/uur");
  });

  it("matcht invoer op token of getal", () => {
    const opts = buildMidazolamIntermittentPumpMaintenanceOptions();
    expect(matchIntermittentPumpMaintenanceOption(opts, "1,5")?.mgPerHour).toBe(1.5);
    expect(matchIntermittentPumpMaintenanceOption(opts, "1.5")?.mgPerHour).toBe(1.5);
  });

  it("formatteert token met één decimaal (nl)", () => {
    expect(formatIntermittentPumpMaintenanceInputToken(1.5)).toBe("1,5");
    expect(formatIntermittentPumpMaintenanceInputToken(1)).toBe("1,0");
  });
});
