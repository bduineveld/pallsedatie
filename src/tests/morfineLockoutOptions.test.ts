import { describe, expect, it } from "vitest";
import {
  buildLockoutHourOptions,
  formatLockoutHoursString,
  matchLockoutToPresetOption
} from "../domain/guidelineLogic/morfineLockoutOptions";

describe("morfineLockoutOptions", () => {
  it("bevat vaste opties en markeert 2 uur als default", () => {
    const opts = buildLockoutHourOptions();
    expect(opts.map((o) => o.hours)).toEqual([0.5, 1, 2, 4, 6]);
    expect(opts.find((o) => o.hours === 2)?.isDefault).toBe(true);
    expect(formatLockoutHoursString(0.5)).toBe("0,5");
  });

  it("matcht canonieke strings en getallen", () => {
    const opts = buildLockoutHourOptions();
    expect(matchLockoutToPresetOption(opts, "4")?.hours).toBe(4);
    expect(matchLockoutToPresetOption(opts, "0,5")?.hours).toBe(0.5);
    expect(matchLockoutToPresetOption(opts, "0.5")?.hours).toBe(0.5);
  });
});
