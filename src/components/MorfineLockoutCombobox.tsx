import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { AUTOCOMPLETE_ANDERS_LABEL, andersMouseDown } from "./autocompleteAnders";
import {
  buildLockoutHourOptions,
  formatLockoutHoursString,
  LockoutHourOption,
  matchLockoutToPresetOption,
  parseLockoutHoursInput
} from "../domain/guidelineLogic/morfineLockoutOptions";

interface MorfineLockoutComboboxProps {
  value: string;
  onChange: (next: string) => void;
}

function normalizeLockoutValue(raw: string, options: LockoutHourOption[]): string {
  const t = raw.trim();
  if (t === "") {
    return "";
  }
  const matched = matchLockoutToPresetOption(options, raw);
  if (matched) {
    return matched.label;
  }
  const v = parseLockoutHoursInput(raw);
  if (Number.isFinite(v) && v > 0) {
    return formatLockoutHoursString(v);
  }
  return t;
}

function optionMatchesQuery(option: LockoutHourOption, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  if (option.label.toLowerCase().includes(q)) {
    return true;
  }
  return String(option.hours).includes(q);
}

export function MorfineLockoutCombobox({ value, onChange }: MorfineLockoutComboboxProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [narrowListByTyping, setNarrowListByTyping] = useState(false);

  const options = useMemo(() => buildLockoutHourOptions(), []);

  const filteredOptions = useMemo(() => {
    if (!narrowListByTyping) {
      return options;
    }
    return options.filter((o) => optionMatchesQuery(o, value));
  }, [options, value, narrowListByTyping]);

  const matchedOption = matchLockoutToPresetOption(options, value);
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
          const next = normalizeLockoutValue(value, options);
          if (next !== value) {
            onChange(next);
          }
        }}
      />
      {menuOpen ? (
        <div
          className="autocomplete-menu autocomplete-menu--compact morfine-lockout-autocomplete-menu"
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
                  option.isDefault ? " morfine-lockout-option--default" : ""
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
