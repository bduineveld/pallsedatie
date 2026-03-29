import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { AUTOCOMPLETE_ANDERS_LABEL, andersMouseDown } from "./autocompleteAnders";
import {
  buildMorfineBolusFractionOptions,
  formatMorfineBolusMgString,
  matchBolusOptionToInput,
  MorfineBolusFractionOption,
  parseMorfineBolusMgInput
} from "../domain/guidelineLogic/morfineBolusFractionOptions";

interface MorfineBolusDoseComboboxProps {
  continueDoseMgPer24h: string;
  value: string;
  onChange: (nextBolusMg: string) => void;
}

function normalizeBolusValue(raw: string, options: MorfineBolusFractionOption[]): string {
  const t = raw.trim();
  if (t === "") {
    return "";
  }
  const matched = matchBolusOptionToInput(options, raw);
  if (matched) {
    return formatMorfineBolusMgString(matched.bolusMg);
  }
  const v = parseMorfineBolusMgInput(raw);
  if (Number.isFinite(v) && v > 0) {
    return formatMorfineBolusMgString(v);
  }
  return t;
}

function optionMatchesQuery(option: MorfineBolusFractionOption, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  if (option.listLabel.toLowerCase().includes(q)) {
    return true;
  }
  const mgStr = formatMorfineBolusMgString(option.bolusMg).toLowerCase();
  return mgStr.includes(q) || option.fractionDisplay.toLowerCase().includes(q);
}

export function MorfineBolusDoseCombobox({
  continueDoseMgPer24h,
  value,
  onChange
}: MorfineBolusDoseComboboxProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  /** Na focus: volledige lijst; na typen: gefilterd op invoer. */
  const [narrowListByTyping, setNarrowListByTyping] = useState(false);

  const continueParsed = Number.parseFloat(continueDoseMgPer24h.replace(",", "."));
  const options = useMemo(
    () =>
      Number.isFinite(continueParsed) && continueParsed > 0
        ? buildMorfineBolusFractionOptions(continueParsed)
        : [],
    [continueParsed]
  );

  const filteredOptions = useMemo(() => {
    if (!narrowListByTyping) {
      return options;
    }
    return options.filter((o) => optionMatchesQuery(o, value));
  }, [options, value, narrowListByTyping]);

  const disabled = options.length === 0;
  const placeholder = disabled
    ? "Vul eerst continue dosis (mg/24u) in"
    : "Typ mg of kies een advies";

  const selectedDenominator = matchBolusOptionToInput(options, value)?.denominator;

  const scrollTargetDenominator = useMemo(() => {
    const inFiltered = (d: number) => filteredOptions.some((o) => o.denominator === d);

    if (selectedDenominator !== undefined && inFiltered(selectedDenominator)) {
      return selectedDenominator;
    }
    if (!value.trim()) {
      const def = filteredOptions.find((o) => o.isDefault);
      if (def) {
        return def.denominator;
      }
    }
    return undefined;
  }, [selectedDenominator, value, filteredOptions]);

  const scrollTargetRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    if (!menuOpen || scrollTargetDenominator === undefined) {
      return;
    }
    scrollTargetRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [menuOpen, scrollTargetDenominator, filteredOptions]);

  return (
    <div
      className="autocomplete-wrapper"
      onBlur={() => setTimeout(() => setMenuOpen(false), 120)}
    >
      <input
        aria-autocomplete="list"
        aria-expanded={menuOpen}
        autoComplete="off"
        placeholder={placeholder}
        disabled={disabled}
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
          const next = normalizeBolusValue(value, options);
          if (next !== value) {
            onChange(next);
          }
        }}
      />
      {menuOpen && !disabled ? (
        <div className="autocomplete-menu autocomplete-menu--compact morfine-bolus-autocomplete-menu" role="listbox">
          {filteredOptions.map((option) => {
            const isSelected = selectedDenominator === option.denominator;
            const isScrollTarget = scrollTargetDenominator === option.denominator;
            return (
              <button
                key={`${option.denominator}-${option.bolusMg}`}
                ref={isScrollTarget ? (el) => { scrollTargetRef.current = el; } : undefined}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`autocomplete-item${isSelected ? " autocomplete-item--selected" : ""}${
                  option.isDefault ? " morfine-bolus-option--most-recommended" : ""
                }${option.recommended ? "" : " morfine-bolus-option--not-recommended"}`}
                onMouseDown={andersMouseDown}
                onClick={() => {
                  onChange(formatMorfineBolusMgString(option.bolusMg));
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
