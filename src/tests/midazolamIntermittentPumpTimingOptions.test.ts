import { describe, expect, it } from "vitest";
import {
  buildEveningClockTokens,
  buildIntermittentPumpStartTimingOptions,
  buildIntermittentPumpStopTimingOptions,
  buildMorningClockTokens,
  INTERMITTENT_PUMP_START_DEFAULT,
  INTERMITTENT_PUMP_STOP_DEFAULT,
  matchIntermittentPumpTimingOption
} from "../domain/guidelineLogic/midazolamIntermittentPumpTimingOptions";

describe("midazolamIntermittentPumpTimingOptions", () => {
  it("heeft inslaaptijd en 2u-voor-ontwaken als default", () => {
    const start = buildIntermittentPumpStartTimingOptions();
    const stop = buildIntermittentPumpStopTimingOptions();
    expect(start[0].token).toBe(INTERMITTENT_PUMP_START_DEFAULT);
    expect(start[0].isDefault).toBe(true);
    expect(stop[0].token).toBe(INTERMITTENT_PUMP_STOP_DEFAULT);
    expect(stop[0].isDefault).toBe(true);
  });

  it("bevat avond- en ochtendkloktokens", () => {
    expect(buildEveningClockTokens()).toContain("21:00");
    expect(buildEveningClockTokens()).toContain("00:00");
    expect(buildMorningClockTokens()).toContain("06:00");
    expect(buildMorningClockTokens()).toContain("10:00");
  });

  it("matcht tijd-invoer", () => {
    const opts = buildIntermittentPumpStartTimingOptions();
    expect(matchIntermittentPumpTimingOption(opts, "21:00")?.token).toBe("21:00");
    expect(matchIntermittentPumpTimingOption(opts, "inslaaptijd")?.token).toBe("inslaaptijd");
  });
});
