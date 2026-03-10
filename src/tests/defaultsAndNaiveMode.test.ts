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
});

describe("age helper", () => {
  it("returns true when age is over 70", () => {
    const today = new Date("2026-03-10");
    expect(isOlderThan70("1950-01-01", today)).toBe(true);
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
    expect(result.suggestions.startBolusMg).toBe(5);
    expect(result.suggestions.bolusMg).toBe(5);
    expect(result.suggestions.lockoutHours).toBe(4);
  });

  it("uses caution naive defaults for elderly or renal risk", () => {
    const state = createDefaultState("2026-03-10");
    state.morfine.opioidInputMode = "naive";
    state.morfine.ageOver70 = true;

    const result = computeMorfineSuggestionBundle(state.morfine);
    expect(result.suggestions.continueDoseMgPer24h).toBe(10);
    expect(result.suggestions.bolusMg).toBe(5);
    expect(result.suggestions.lockoutHours).toBe(6);
  });
});
