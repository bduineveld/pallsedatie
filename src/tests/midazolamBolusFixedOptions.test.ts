import { describe, expect, it } from "vitest";
import {
  buildMidazolamBolusFixedOptions,
  matchMidazolamBolusOptionToInput
} from "../domain/guidelineLogic/midazolamBolusFixedOptions";
import { formatMorfineBolusMgString } from "../domain/guidelineLogic/morfineBolusFractionOptions";

describe("buildMidazolamBolusFixedOptions", () => {
  it("heeft vaste mg-waarden en 5 mg als richtlijn-default", () => {
    const opts = buildMidazolamBolusFixedOptions();
    expect(opts).toHaveLength(9);
    expect(opts.find((o) => o.isDefault)?.bolusMg).toBe(5);
    expect(opts.map((o) => o.bolusMg)).toEqual([1.5, 2.5, 3, 4, 5, 7.5, 10, 12.5, 15]);
  });

  it("matcht invoer op canonieke mg-string", () => {
    const opts = buildMidazolamBolusFixedOptions();
    expect(matchMidazolamBolusOptionToInput(opts, "5")?.bolusMg).toBe(5);
    expect(matchMidazolamBolusOptionToInput(opts, "10")?.bolusMg).toBe(10);
    expect(matchMidazolamBolusOptionToInput(opts, formatMorfineBolusMgString(7.5))?.bolusMg).toBe(7.5);
  });
});
