import type { MouseEvent } from "react";

/** Vaste labeltekst voor vrije invoer onderaan keuzelijsten. */
export const AUTOCOMPLETE_ANDERS_LABEL = "anders...";

export function andersMouseDown(event: MouseEvent) {
  event.preventDefault();
}
