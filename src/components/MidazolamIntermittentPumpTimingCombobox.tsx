import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { AUTOCOMPLETE_ANDERS_LABEL, andersMouseDown } from "./autocompleteAnders";
import {
  buildIntermittentPumpStartTimingOptions,
  buildIntermittentPumpStopTimingOptions,
  matchIntermittentPumpTimingOption,
  MidazolamIntermittentPumpTimingOption,
  normalizeIntermittentPumpTimingStoredValue
} from "../domain/guidelineLogic/midazolamIntermittentPumpTimingOptions";

interface MidazolamIntermittentPumpTimingComboboxProps {
  variant: "start" | "stop";
  value: string;
  onChange: (next: string) => void;
}

function optionMatchesQuery(option: MidazolamIntermittentPumpTimingOption, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  if (option.listLabel.toLowerCase().includes(q)) {
    return true;
  }
  if (option.token.toLowerCase().includes(q)) {
    return true;
  }
  return false;
}

export function MidazolamIntermittentPumpTimingCombobox({
  variant,
  value,
  onChange
}: MidazolamIntermittentPumpTimingComboboxProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [narrowListByTyping, setNarrowListByTyping] = useState(false);

  const options = useMemo(
    () =>
      variant === "start"
        ? buildIntermittentPumpStartTimingOptions()
        : buildIntermittentPumpStopTimingOptions(),
    [variant]
  );

  const filteredOptions = useMemo(() => {
    if (!narrowListByTyping) {
      return options;
    }
    return options.filter((o) => optionMatchesQuery(o, value));
  }, [options, value, narrowListByTyping]);

  const matchedOption = matchIntermittentPumpTimingOption(options, value);
  const selectedToken = matchedOption?.token;

  const scrollTargetToken = useMemo(() => {
    const inFiltered = (tok: string) => filteredOptions.some((o) => o.token === tok);

    if (selectedToken !== undefined && inFiltered(selectedToken)) {
      return selectedToken;
    }
    if (!value.trim()) {
      const def = filteredOptions.find((o) => o.isDefault);
      if (def) {
        return def.token;
      }
    }
    return undefined;
  }, [selectedToken, value, filteredOptions]);

  const scrollTargetRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    if (!menuOpen || scrollTargetToken === undefined) {
      return;
    }
    scrollTargetRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [menuOpen, scrollTargetToken, filteredOptions]);

  const placeholder =
    variant === "start" ? "Typ of kies starttijd" : "Typ of kies stoptijd onderhoud";

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
          const next = normalizeIntermittentPumpTimingStoredValue(value, options);
          if (next !== value) {
            onChange(next);
          }
        }}
      />
      {menuOpen ? (
        <div
          className={`autocomplete-menu autocomplete-menu--compact midazolam-intermittent-timing-autocomplete-menu midazolam-intermittent-timing-autocomplete-menu--${variant}`}
          role="listbox"
        >
          {filteredOptions.map((option) => {
            const isSelected = selectedToken === option.token;
            const isScrollTarget = scrollTargetToken === option.token;
            return (
              <button
                key={option.token}
                ref={isScrollTarget ? (el) => { scrollTargetRef.current = el; } : undefined}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`autocomplete-item${isSelected ? " autocomplete-item--selected" : ""}${
                  option.isDefault ? " midazolam-intermittent-timing-option--default" : ""
                }`}
                onMouseDown={andersMouseDown}
                onClick={() => {
                  onChange(option.token);
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
