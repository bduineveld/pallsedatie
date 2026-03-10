import { describe, expect, it } from "vitest";
import { convertOpioidsToMorphineScIv } from "../domain/conversions/opioidConversion";

describe("convertOpioidsToMorphineScIv", () => {
  it("sums multiple opioids additively", () => {
    const result = convertOpioidsToMorphineScIv([
      { id: "1", opioid: "fentanyl_patch", dosePer24h: 25, methadoneRatioChoice: 5 },
      { id: "2", opioid: "oxycodon_oral", dosePer24h: 40, methadoneRatioChoice: 5 }
    ]);
    expect(result.totalMorphineScIvMgPer24h).toBe(40);
    expect(result.advice75PercentMgPer24h).toBe(30);
  });

  it("handles methadone via chosen ratio", () => {
    const result = convertOpioidsToMorphineScIv([
      { id: "1", opioid: "methadon_oral", dosePer24h: 10, methadoneRatioChoice: 5 }
    ]);
    expect(result.totalMorphineScIvMgPer24h).toBeCloseTo(16.666, 2);
  });
});
