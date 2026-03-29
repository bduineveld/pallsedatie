import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { AUTOCOMPLETE_ANDERS_LABEL, andersMouseDown } from "./autocompleteAnders";
import {
  buildMaxDosesPer24Options,
  isCustomMaxDosesPer24,
  matchMaxDosesPer24Preset,
  MaxDosesPer24Option,
  parseMaxDosesPer24Input
} from "../domain/guidelineLogic/morfineIntermittentMaxDosesOptions";

interface MorfineMaxDosesPer24ComboboxProps {
  value: string;
  onChange: (next: string) => void;
}

function normalizeValue(raw: string): string {
  const t = raw.trim();
  if (t === "") {
    return "";
  }
  const preset = matchMaxDosesPer24Preset(t);
  if (preset !== undefined) {
    return String(preset);
  }
  const v = parseMaxDosesPer24Input(t);
  if (Number.isFinite(v) && v > 0) {
    return String(Math.round(v));
  }
  return "";
}

function optionMatchesQuery(option: MaxDosesPer24Option, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  if (option.label.toLowerCase().includes(q)) {
    return true;
  }
  return String(option.preset).includes(q);
}

type ScrollKey = number | "anders";

export function MorfineMaxDosesPer24Combobox({ value, onChange }: MorfineMaxDosesPer24ComboboxProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [narrowListByTyping, setNarrowListByTyping] = useState(false);

  const options = useMemo(() => buildMaxDosesPer24Options(), []);

  const filteredOptions = useMemo(() => {
    if (!narrowListByTyping) {
      return options;
    }
    return options.filter((o) => optionMatchesQuery(o, value));
  }, [options, value, narrowListByTyping]);

  const matchedPreset = matchMaxDosesPer24Preset(value);
  const custom = isCustomMaxDosesPer24(value);

  const scrollTargetKey = useMemo((): ScrollKey | undefined => {
    const inFiltered = (preset: number) => filteredOptions.some((o) => o.preset === preset);

    if (matchedPreset !== undefined && inFiltered(matchedPreset)) {
      return matchedPreset;
    }
    if (custom) {
      return "anders";
    }
    if (!value.trim()) {
      const def = filteredOptions.find((o) => o.isDefault);
      if (def) {
        return def.preset;
      }
    }
    return undefined;
  }, [matchedPreset, custom, value, filteredOptions]);

  const scrollTargetRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    if (!menuOpen || scrollTargetKey === undefined) {
      return;
    }
    scrollTargetRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [menuOpen, scrollTargetKey, filteredOptions]);

  return (
    <div
      className="autocomplete-wrapper"
      onBlur={() => setTimeout(() => setMenuOpen(false), 120)}
    >
      <input
        aria-autocomplete="list"
        aria-expanded={menuOpen}
        autoComplete="off"
        placeholder="Typ aantal of kies een waarde"
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
          const next = normalizeValue(value);
          if (next !== value) {
            onChange(next);
          }
        }}
      />
      {menuOpen ? (
        <div
          className="autocomplete-menu autocomplete-menu--compact morfine-max-doses-per24-autocomplete-menu"
          role="listbox"
        >
          {filteredOptions.map((option) => {
            const isSelected = matchedPreset === option.preset;
            const isScrollTarget = scrollTargetKey === option.preset;
            return (
              <button
                key={`p-${option.preset}`}
                ref={isScrollTarget ? (el) => { scrollTargetRef.current = el; } : undefined}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`autocomplete-item${isSelected ? " autocomplete-item--selected" : ""}${
                  option.isDefault ? " morfine-max-doses-per24-option--default" : ""
                }`}
                onMouseDown={andersMouseDown}
                onClick={() => {
                  onChange(option.label);
                  setMenuOpen(false);
                }}
              >
                {option.label}
              </button>
            );
          })}
          <button
            type="button"
            role="option"
            aria-selected={custom}
            ref={scrollTargetKey === "anders" ? (el) => { scrollTargetRef.current = el; } : undefined}
            className={`autocomplete-item autocomplete-item--anders${custom ? " autocomplete-item--selected" : ""}`}
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
