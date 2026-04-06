import { describe, expect, it } from "vitest";
import { createDefaultState } from "../app/defaultState";
import { validateMidazolamForm } from "../domain/validation/formValidation";

describe("midazolam deliveryMode validation", () => {
  it("meldt error wanneer deliveryMode ontbreekt", () => {
    const state = createDefaultState("2026-03-10");
    state.general.physician.fullName = "Dr. Test";
    state.midazolam.indication = "ernstige angst";
    state.midazolam.diagnosis = "diagnose test";
    state.midazolam.sedationMode = "continuous";
    state.midazolam.deliveryMode = "";

    const res = validateMidazolamForm({ ...state });
    expect(res.valid).toBe(false);
    expect(res.errors).toContain("Kies injecties of pomp/continue infusie (midazolam).");
  });

  it("vereist continue injections velden volgens schema voor deliveryMode=injections", () => {
    const state = createDefaultState("2026-03-10");
    state.general.physician.fullName = "Dr. Test";
    state.midazolam.indication = "ernstige angst";
    state.midazolam.diagnosis = "diagnose test";
    state.midazolam.sedationMode = "continuous";
    state.midazolam.deliveryMode = "injections";

    // Laat schema/extra/interval/max leeg
    const res = validateMidazolamForm({ ...state });
    expect(res.valid).toBe(false);
    expect(res.errors).toContain("Dosis per injectie (midazolam) ontbreekt.");
    expect(res.errors).toContain("Elke (uur) voor midazolam ontbreekt.");
    expect(res.errors).toContain("Minimale tijd tussen extra doses (midazolam) ontbreekt.");
  });

  it("vereist intermitterende pomp-velden voor intermittent + pump_infusion", () => {
    const state = createDefaultState("2026-03-10");
    state.general.physician.fullName = "Dr. Test";
    state.midazolam.indication = "ernstige angst";
    state.midazolam.diagnosis = "diagnose test";
    state.midazolam.sedationMode = "intermittent";
    state.midazolam.deliveryMode = "pump_infusion";
    state.midazolam.maxExtraDosesPer24h = "";

    const res = validateMidazolamForm({ ...state });
    expect(res.valid).toBe(false);
    expect(res.errors).toContain("Oplaaddosis (midazolam) ontbreekt.");
    expect(res.errors).toContain("Onderhoudsdosis (mg/uur) midazolam ontbreekt.");
    expect(res.errors).toContain("Bolusdosering midazolam ontbreekt.");
    expect(res.errors).toContain("Lockouttijd (midazolam) ontbreekt.");
    expect(res.errors).toContain("Max. extra doses per 24 uur (midazolam) ontbreekt.");
  });
});

