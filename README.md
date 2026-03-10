# Pallsedatie.nl static app

## Privacy model
- Deze applicatie draait volledig client-side in de browser.
- Er is geen backend, geen database en geen serveropslag van patiëntgegevens.
- Er worden geen analytics of externe API-calls gebruikt voor patiëntdata of doseringslogica.

## Technologie
- TypeScript + React + Vite.
- PDF-generatie gebeurt lokaal met `pdf-lib`.
- Alle berekeningen staan in `src/domain`, los van UI-componenten.

## Organisatie van berekeningen
- Conversie- en tabeldata: `src/data/opioidRotationTable.ts`
- Interpolatie en doseerconversies: `src/domain/conversions`
- Richtlijnlogica/suggesties: `src/domain/guidelineLogic` en `src/domain/dosageSuggestions`
- Validatie: `src/domain/validation`
- Receptadvies: `src/domain/prescriptionAdvice`

## Belangrijke veiligheidspunten
- Dit is een ondersteuningstool; de voorschrijver blijft volledig verantwoordelijk.
- Interpolatie is expliciet zichtbaar in UI en in codecommentaar.
- Suggesties blijven altijd handmatig aanpasbaar.
- Waarschuwingen worden alleen getoond op basis van expliciete, vastgelegde regels.

## Medisch te reviewen voor productie
- Volledige afstemming van alle tabelvoetnoten (II/III/IV/V) met de originele bron.
- Definitieve midazolam start-/bolus-/lockout-regels 1-op-1 valideren met lokale protocolkeuze.
- Bevestiging van lokale afgeleide aannames (zoals startbolusverhouding bij morfine).
- End-to-end inhoudelijke review van PDF-tekstvelden door medisch eindverantwoordelijke.
