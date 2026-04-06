import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { AUTOCOMPLETE_ANDERS_LABEL, andersMouseDown } from "./autocompleteAnders";
import {
  buildMidazolamBolusFixedOptions,
  matchMidazolamBolusOptionToInput,
  type MidazolamBolusFixedOption
} from "../domain/guidelineLogic/midazolamBolusFixedOptions";
import { formatMorfineBolusMgString, parseMorfineBolusMgInput } from "../domain/guidelineLogic/morfineBolusFractionOptions";

interface MidazolamBolusDoseComboboxProps {
  value: string;
  onChange: (nextBolusMg: string) => void;
}

function normalizeBolusValue(raw: string, options: MidazolamBolusFixedOption[]): string {
  const t = raw.trim();
  if (t === "") {
    return "";
  }
  const matched = matchMidazolamBolusOptionToInput(options, raw);
  if (matched) {
    return formatMorfineBolusMgString(matched.bolusMg);
  }
  const v = parseMorfineBolusMgInput(raw);
  if (Number.isFinite(v) && v > 0) {
    return formatMorfineBolusMgString(v);
  }
  return t;
}

function optionMatchesQuery(option: MidazolamBolusFixedOption, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  if (option.listLabel.toLowerCase().includes(q)) {
    return true;
  }
  const mgStr = formatMorfineBolusMgString(option.bolusMg).toLowerCase();
  return mgStr.includes(q);
}

export function MidazolamBolusDoseCombobox({ value, onChange }: MidazolamBolusDoseComboboxProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [narrowListByTyping, setNarrowListByTyping] = useState(false);

  const options = useMemo(() => buildMidazolamBolusFixedOptions(), []);

  const filteredOptions = useMemo(() => {
    if (!narrowListByTyping) {
      return options;
    }
    return options.filter((o) => optionMatchesQuery(o, value));
  }, [options, value, narrowListByTyping]);

  const selectedOption = matchMidazolamBolusOptionToInput(options, value);
  const selectedKey = selectedOption?.bolusMg;

  const scrollTargetKey = useMemo(() => {
    const inFiltered = (mg: number) => filteredOptions.some((o) => o.bolusMg === mg);

    if (selectedKey !== undefined && inFiltered(selectedKey)) {
      return selectedKey;
    }
    if (!value.trim()) {
      const def = filteredOptions.find((o) => o.isDefault);
      if (def) {
        return def.bolusMg;
      }
    }
    return undefined;
  }, [selectedKey, value, filteredOptions]);

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
        placeholder="Typ mg of kies een advies"
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
      {menuOpen ? (
        <div className="autocomplete-menu autocomplete-menu--compact morfine-bolus-autocomplete-menu" role="listbox">
          {filteredOptions.map((option) => {
            const isSelected = selectedKey === option.bolusMg;
            const isScrollTarget = scrollTargetKey === option.bolusMg;
            return (
              <button
                key={option.bolusMg}
                ref={isScrollTarget ? (el) => { scrollTargetRef.current = el; } : undefined}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`autocomplete-item${isSelected ? " autocomplete-item--selected" : ""}${
                  option.isDefault ? " morfine-bolus-option--most-recommended" : ""
                }`}
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
