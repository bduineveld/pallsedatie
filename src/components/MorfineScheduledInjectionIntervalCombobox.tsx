import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AUTOCOMPLETE_ANDERS_LABEL, andersMouseDown } from "./autocompleteAnders";
import {
  buildScheduledInjectionIntervalOptions,
  formatScheduledIntervalInputDisplay,
  matchPresetFromStored,
  normalizeScheduledIntervalInputToStored,
  type ScheduledInjectionIntervalOption
} from "../domain/guidelineLogic/morfineScheduledInjectionIntervalOptions";

interface MorfineScheduledInjectionIntervalComboboxProps {
  value: string;
  onChange: (next: string) => void;
}

function optionMatchesQuery(option: ScheduledInjectionIntervalOption, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  if (option.displayLine.toLowerCase().includes(q)) {
    return true;
  }
  return String(option.hours).includes(q);
}

export function MorfineScheduledInjectionIntervalCombobox({
  value,
  onChange
}: MorfineScheduledInjectionIntervalComboboxProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [narrowListByTyping, setNarrowListByTyping] = useState(false);
  const [inputText, setInputText] = useState(() => formatScheduledIntervalInputDisplay(value));

  const options = useMemo(() => buildScheduledInjectionIntervalOptions(), []);

  useEffect(() => {
    setInputText(formatScheduledIntervalInputDisplay(value));
  }, [value]);

  const filteredOptions = useMemo(() => {
    if (!narrowListByTyping) {
      return options;
    }
    return options.filter((o) => optionMatchesQuery(o, inputText));
  }, [options, inputText, narrowListByTyping]);

  const matchedPreset = matchPresetFromStored(value);
  const selectedHours = matchedPreset?.hours;

  const scrollTargetHours = useMemo(() => {
    const inFiltered = (h: number) => filteredOptions.some((o) => o.hours === h);

    if (selectedHours !== undefined && inFiltered(selectedHours)) {
      return selectedHours;
    }
    if (!value.trim()) {
      const def = filteredOptions.find((o) => o.isDefaultScroll);
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

  const commitInput = () => {
    const next = normalizeScheduledIntervalInputToStored(inputText);
    if (next !== value) {
      onChange(next);
    }
    setInputText(formatScheduledIntervalInputDisplay(next));
  };

  return (
    <div
      className="autocomplete-wrapper"
      onBlur={() => setTimeout(() => setMenuOpen(false), 120)}
    >
      <input
        aria-autocomplete="list"
        aria-expanded={menuOpen}
        autoComplete="off"
        placeholder="Kies interval of typ uren"
        value={inputText}
        onFocus={() => {
          setMenuOpen(true);
          setNarrowListByTyping(false);
        }}
        onChange={(event) => {
          setInputText(event.target.value);
          setMenuOpen(true);
          setNarrowListByTyping(true);
        }}
        onBlur={() => {
          commitInput();
        }}
      />
      {menuOpen ? (
        <div
          className="autocomplete-menu autocomplete-menu--compact morfine-scheduled-interval-autocomplete-menu"
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
                  option.emphasized ? " morfine-scheduled-interval-option--emphasized" : ""
                }`}
                onMouseDown={andersMouseDown}
                onClick={() => {
                  onChange(String(option.hours));
                  setInputText(formatScheduledIntervalInputDisplay(String(option.hours)));
                  setMenuOpen(false);
                }}
              >
                {option.displayLine}
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
