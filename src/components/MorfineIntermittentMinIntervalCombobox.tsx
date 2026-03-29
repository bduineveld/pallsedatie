import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { AUTOCOMPLETE_ANDERS_LABEL, andersMouseDown } from "./autocompleteAnders";
import {
  buildIntermittentMinIntervalOptions,
  formatIntermittentIntervalHoursString,
  IntermittentMinIntervalOption,
  matchIntermittentIntervalToPreset,
  parseIntermittentIntervalHoursInput
} from "../domain/guidelineLogic/morfineIntermittentMinIntervalOptions";

interface MorfineIntermittentMinIntervalComboboxProps {
  value: string;
  onChange: (next: string) => void;
}

function normalizeValue(raw: string, options: IntermittentMinIntervalOption[]): string {
  const t = raw.trim();
  if (t === "") {
    return "";
  }
  const matched = matchIntermittentIntervalToPreset(options, raw);
  if (matched) {
    return matched.label;
  }
  const v = parseIntermittentIntervalHoursInput(raw);
  if (Number.isFinite(v) && v > 0) {
    return formatIntermittentIntervalHoursString(v);
  }
  return t;
}

function optionMatchesQuery(option: IntermittentMinIntervalOption, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  if (option.label.toLowerCase().includes(q)) {
    return true;
  }
  return String(option.hours).includes(q);
}

export function MorfineIntermittentMinIntervalCombobox({
  value,
  onChange
}: MorfineIntermittentMinIntervalComboboxProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [narrowListByTyping, setNarrowListByTyping] = useState(false);

  const options = useMemo(() => buildIntermittentMinIntervalOptions(), []);

  const filteredOptions = useMemo(() => {
    if (!narrowListByTyping) {
      return options;
    }
    return options.filter((o) => optionMatchesQuery(o, value));
  }, [options, value, narrowListByTyping]);

  const matchedOption = matchIntermittentIntervalToPreset(options, value);
  const selectedHours = matchedOption?.hours;

  const scrollTargetHours = useMemo(() => {
    const inFiltered = (h: number) => filteredOptions.some((o) => o.hours === h);

    if (selectedHours !== undefined && inFiltered(selectedHours)) {
      return selectedHours;
    }
    if (!value.trim()) {
      const def = filteredOptions.find((o) => o.isDefault);
      if (def) {
        return def.hours;
      }
    }
    return undefined;
  }, [selectedHours, value, filteredOptions]);

  const scrollTargetRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    if (!menuOpen || scrollTargetHours === undefined) {
      return;
    }
    scrollTargetRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [menuOpen, scrollTargetHours, filteredOptions]);

  return (
    <div
      className="autocomplete-wrapper"
      onBlur={() => setTimeout(() => setMenuOpen(false), 120)}
    >
      <input
        aria-autocomplete="list"
        aria-expanded={menuOpen}
        autoComplete="off"
        placeholder="Typ uur of kies een waarde"
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
          const next = normalizeValue(value, options);
          if (next !== value) {
            onChange(next);
          }
        }}
      />
      {menuOpen ? (
        <div
          className="autocomplete-menu autocomplete-menu--compact morfine-intermittent-interval-autocomplete-menu"
          role="listbox"
        >
          {filteredOptions.map((option) => {
            const isSelected = selectedHours === option.hours;
            const isScrollTarget = scrollTargetHours === option.hours;
            return (
              <button
                key={option.hours}
                ref={isScrollTarget ? (el) => { scrollTargetRef.current = el; } : undefined}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`autocomplete-item${isSelected ? " autocomplete-item--selected" : ""}${
                  option.isDefault ? " morfine-intermittent-interval-option--default" : ""
                }`}
                onMouseDown={andersMouseDown}
                onClick={() => {
                  onChange(option.label);
                  setMenuOpen(false);
                }}
              >
                {option.label} uur
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
