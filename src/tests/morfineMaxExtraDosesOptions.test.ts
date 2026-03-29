import { describe, expect, it } from "vitest";
import {
  buildMaxExtraDoseOptions,
  isCustomMaxExtraDose,
  matchMaxExtraPreset
} from "../domain/guidelineLogic/morfineMaxExtraDosesOptions";

describe("morfineMaxExtraDosesOptions", () => {
  it("bevat vaste waarden; 6 is default", () => {
    const opts = buildMaxExtraDoseOptions();
    expect(opts.map((o) => o.preset)).toEqual([4, 6, 8, 10, 12]);
    expect(opts.find((o) => o.preset === 6)?.isDefault).toBe(true);
  });

  it("matcht alleen exacte presets", () => {
    expect(matchMaxExtraPreset("6")).toBe(6);
    expect(matchMaxExtraPreset("7")).toBeUndefined();
    expect(isCustomMaxExtraDose("7")).toBe(true);
    expect(isCustomMaxExtraDose("")).toBe(false);
  });
});
