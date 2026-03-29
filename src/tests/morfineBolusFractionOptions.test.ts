import { describe, expect, it } from "vitest";
import {
  buildMorfineBolusFractionOptions,
  formatMorfineBolusMgString,
  matchBolusOptionToInput
} from "../domain/guidelineLogic/morfineBolusFractionOptions";

describe("buildMorfineBolusFractionOptions", () => {
  it("voor 24mg/24u bevat 1/6 als default en aanbevolen tussen 1/10 en 1/6", () => {
    const opts = buildMorfineBolusFractionOptions(24);
    const byDen = (n: number) => opts.find((o) => o.denominator === n);
    expect(byDen(6)?.isDefault).toBe(true);
    expect(byDen(6)?.recommended).toBe(true);
    expect(byDen(10)?.recommended).toBe(true);
    expect(byDen(8)?.recommended).toBe(true);
    expect(byDen(4)?.recommended).toBe(false);
    expect(formatMorfineBolusMgString(byDen(6)!.bolusMg)).toBe("4");
    expect(formatMorfineBolusMgString(byDen(10)!.bolusMg)).toBe("2,4");
  });

  it("matcht invoer op canonieke waarde", () => {
    const opts = buildMorfineBolusFractionOptions(24);
    expect(matchBolusOptionToInput(opts, "4")?.denominator).toBe(6);
    expect(matchBolusOptionToInput(opts, "2,4")?.denominator).toBe(10);
  });

  it("matcht na afronding op 1 decimaal (continue 15 mg)", () => {
    const opts = buildMorfineBolusFractionOptions(15);
    const fmt = (n: number) => opts.find((o) => o.denominator === n)!;
    expect(matchBolusOptionToInput(opts, formatMorfineBolusMgString(fmt(24).bolusMg))?.denominator).toBe(24);
    expect(matchBolusOptionToInput(opts, formatMorfineBolusMgString(fmt(12).bolusMg))?.denominator).toBe(12);
    expect(matchBolusOptionToInput(opts, formatMorfineBolusMgString(fmt(4).bolusMg))?.denominator).toBe(4);
  });
});
