import { describe, expect, it } from "vitest";
import { createDefaultState, getLocalDateIso } from "../app/defaultState";
import { computeMorfineSuggestionBundle } from "../domain/dosageSuggestions/morfineSuggestions";
import { isOlderThan70 } from "../domain/validation/age";

describe("default dates", () => {
  it("uses today as default physician and start dates", () => {
    const expected = getLocalDateIso(new Date(2026, 2, 10, 9, 30));
    const state = createDefaultState(expected);
    expect(state.general.physician.date).toBe(expected);
    expect(state.morfine.startDate).toBe(expected);
    expect(state.midazolam.startDate).toBe(expected);
  });

  it("keeps opioidInputMode empty by default", () => {
    const state = createDefaultState("2026-03-10");
    expect(state.morfine.opioidInputMode).toBe("");
  });

  it("keeps administration and sedation modes empty by default", () => {
    const state = createDefaultState("2026-03-10");
    expect(state.morfine.administrationMode).toBe("");
    expect(state.midazolam.sedationMode).toBe("");
    expect(state.morfine.maxExtraDosesPer24h).toBe("");
    expect(state.midazolam.scheduledInjectionDoseMg).toBe("");
    expect(state.morfine.opioidDosingApplied).toBe(false);
    expect(state.morfine.intermittentOpioidDosingApplied).toBe(false);
    expect(state.morfine.startBolusEqualsBolus).toBe(true);
    expect(state.morfine.maxDosesPer24h).toBe("");
    expect(state.morfine.extraDosisGelijkScheduled).toBe(true);
  });

  it("defaults morfine lockout to 4 uur", () => {
    const state = createDefaultState("2026-03-10");
    expect(state.morfine.lockoutHours).toBe("4");
  });
});

describe("age helper", () => {
  it("returns true when age is over 70", () => {
    const today = new Date("2026-03-10");
    expect(isOlderThan70("1950-01-01", today)).toBe(true);
  });

  it("supports Dutch date input format (dd-mm-jjjj)", () => {
    const today = new Date("2026-03-10");
    expect(isOlderThan70("01-01-1950", today)).toBe(true);
  });

  it("returns false when age is 70 or less", () => {
    const today = new Date("2026-03-10");
    expect(isOlderThan70("1956-03-10", today)).toBe(false);
  });
});

describe("morfine opioid-naive defaults", () => {
  it("uses standard naive defaults when no caution flags are set", () => {
    const state = createDefaultState("2026-03-10");
    state.morfine.opioidInputMode = "naive";
    state.morfine.ageOver70 = false;
    state.morfine.egfrUnder30 = false;

    const result = computeMorfineSuggestionBundle(state.morfine);
    expect(result.suggestions.continueDoseMgPer24h).toBe(15);
    expect(result.suggestions.lockoutHours).toBe(4);
  });

  it("uses caution naive defaults for elderly or renal risk", () => {
    const state = createDefaultState("2026-03-10");
    state.morfine.opioidInputMode = "naive";
    state.morfine.ageOver70 = true;

    const result = computeMorfineSuggestionBundle(state.morfine);
    expect(result.suggestions.continueDoseMgPer24h).toBe(10);
    expect(result.suggestions.lockoutHours).toBe(6);
  });
});
