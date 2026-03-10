import { AppMode } from "../types/models";

interface ModeSelectorProps {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
}

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <section className="card">
      <h2>Modus</h2>
      <div className="segment">
        <button
          type="button"
          className={mode === "morfine" ? "active" : ""}
          onClick={() => onChange("morfine")}
        >
          Morfine
        </button>
        <button
          type="button"
          className={mode === "midazolam" ? "active" : ""}
          onClick={() => onChange("midazolam")}
        >
          Midazolam (Dormicum)
        </button>
        <button
          type="button"
          className={mode === "combination" ? "active" : ""}
          onClick={() => onChange("combination")}
        >
          Combinatie
        </button>
      </div>
    </section>
  );
}
