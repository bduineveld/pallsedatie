import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { AUTOCOMPLETE_ANDERS_LABEL, andersMouseDown } from "./autocompleteAnders";
import {
  buildMaxExtraDoseOptions,
  isCustomMaxExtraDose,
  matchMaxExtraPreset,
  MaxExtraDoseOption,
  parseMaxExtraDosesInput
} from "../domain/guidelineLogic/morfineMaxExtraDosesOptions";

interface MorfineMaxExtraDosesComboboxProps {
  value: string;
  onChange: (next: string) => void;
}

function normalizeMaxExtraValue(raw: string): string {
  const t = raw.trim();
  if (t === "") {
    return "";
  }
  const preset = matchMaxExtraPreset(t);
  if (preset !== undefined) {
    return String(preset);
  }
  const v = parseMaxExtraDosesInput(t);
  if (Number.isFinite(v) && v > 0) {
    return String(Math.round(v));
  }
  return "";
}

function optionMatchesQuery(option: MaxExtraDoseOption, query: string): boolean {
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

export function MorfineMaxExtraDosesCombobox({ value, onChange }: MorfineMaxExtraDosesComboboxProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [narrowListByTyping, setNarrowListByTyping] = useState(false);

  const options = useMemo(() => buildMaxExtraDoseOptions(), []);

  const filteredOptions = useMemo(() => {
    if (!narrowListByTyping) {
      return options;
    }
    return options.filter((o) => optionMatchesQuery(o, value));
  }, [options, value, narrowListByTyping]);

  const matchedPreset = matchMaxExtraPreset(value);
  const custom = isCustomMaxExtraDose(value);

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
          const next = normalizeMaxExtraValue(value);
          if (next !== value) {
            onChange(next);
          }
        }}
      />
      {menuOpen ? (
        <div
          className="autocomplete-menu autocomplete-menu--compact morfine-max-extra-autocomplete-menu"
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
                  option.isDefault ? " morfine-max-extra-option--default" : ""
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
