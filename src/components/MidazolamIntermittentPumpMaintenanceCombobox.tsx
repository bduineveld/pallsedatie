import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { AUTOCOMPLETE_ANDERS_LABEL, andersMouseDown } from "./autocompleteAnders";
import {
  buildMidazolamIntermittentPumpMaintenanceOptions,
  matchIntermittentPumpMaintenanceOption,
  MidazolamIntermittentPumpMaintenanceOption,
  normalizeIntermittentPumpMaintenanceStoredValue
} from "../domain/guidelineLogic/midazolamIntermittentPumpMaintenanceOptions";

interface MidazolamIntermittentPumpMaintenanceComboboxProps {
  value: string;
  onChange: (next: string) => void;
}

function optionMatchesQuery(option: MidazolamIntermittentPumpMaintenanceOption, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  if (option.listLabel.toLowerCase().includes(q)) {
    return true;
  }
  if (option.inputToken.toLowerCase().includes(q)) {
    return true;
  }
  return String(option.mgPerHour).includes(q);
}

export function MidazolamIntermittentPumpMaintenanceCombobox({
  value,
  onChange
}: MidazolamIntermittentPumpMaintenanceComboboxProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [narrowListByTyping, setNarrowListByTyping] = useState(false);

  const options = useMemo(() => buildMidazolamIntermittentPumpMaintenanceOptions(), []);

  const filteredOptions = useMemo(() => {
    if (!narrowListByTyping) {
      return options;
    }
    return options.filter((o) => optionMatchesQuery(o, value));
  }, [options, value, narrowListByTyping]);

  const matchedOption = matchIntermittentPumpMaintenanceOption(options, value);
  const selectedMg = matchedOption?.mgPerHour;

  const scrollTargetMg = useMemo(() => {
    const inFiltered = (mg: number) => filteredOptions.some((o) => o.mgPerHour === mg);

    if (selectedMg !== undefined && inFiltered(selectedMg)) {
      return selectedMg;
    }
    if (!value.trim()) {
      const def = filteredOptions.find((o) => o.isDefault);
      if (def) {
        return def.mgPerHour;
      }
    }
    return undefined;
  }, [selectedMg, value, filteredOptions]);

  const scrollTargetRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    if (!menuOpen || scrollTargetMg === undefined) {
      return;
    }
    scrollTargetRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [menuOpen, scrollTargetMg, filteredOptions]);

  return (
    <div
      className="autocomplete-wrapper"
      onBlur={() => setTimeout(() => setMenuOpen(false), 120)}
    >
      <input
        aria-autocomplete="list"
        aria-expanded={menuOpen}
        autoComplete="off"
        placeholder="Typ mg/uur of kies een waarde"
        value={value}
        onFocus={() => {
          setMenuOpen(true);
          setNarrowListByTyping(false);
        }}
        onChange={(event) => {
          onChange(event.target.value);
          setMenuOpen(true);
          setNarrowListByTyping(true);
        }}
        onBlur={() => {
          const next = normalizeIntermittentPumpMaintenanceStoredValue(value, options);
          if (next !== value) {
            onChange(next);
          }
        }}
      />
      {menuOpen ? (
        <div
          className="autocomplete-menu autocomplete-menu--compact midazolam-intermittent-maintenance-autocomplete-menu"
          role="listbox"
        >
          {filteredOptions.map((option) => {
            const isSelected = selectedMg === option.mgPerHour;
            const isScrollTarget = scrollTargetMg === option.mgPerHour;
            return (
              <button
                key={option.mgPerHour}
                ref={isScrollTarget ? (el) => { scrollTargetRef.current = el; } : undefined}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`autocomplete-item${isSelected ? " autocomplete-item--selected" : ""}${
                  option.isDefault ? " midazolam-intermittent-maintenance-option--default" : ""
                }`}
                onMouseDown={andersMouseDown}
                onClick={() => {
                  onChange(option.inputToken);
                  setMenuOpen(false);
                }}
              >
                {option.listLabel}
              </button>
            );
          })}
          <button
            type="button"
            role="option"
            className="autocomplete-item autocomplete-item--anders"
            onMouseDown={andersMouseDown}
            onClick={() => {
              setMenuOpen(false);
            }}
          >
            {AUTOCOMPLETE_ANDERS_LABEL}
          </button>
        </div>
      ) : null}
    </div>
  );
}
