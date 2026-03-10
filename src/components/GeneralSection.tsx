import { uiDisclaimer } from "../data/guidelineText";
import { GeneralFormData } from "../types/models";
import { FormField } from "./FormField";

interface GeneralSectionProps {
  data: GeneralFormData;
  onChange: (data: GeneralFormData) => void;
}

export function GeneralSection({ data, onChange }: GeneralSectionProps) {
  return (
    <section className="card">
      <h2>Algemeen</h2>
      <p className="small-muted">{uiDisclaimer}</p>
      <div className="grid-2">
        <FormField label="Patiënt naam">
          <input
            value={data.patient.fullName}
            onChange={(event) =>
              onChange({ ...data, patient: { ...data.patient, fullName: event.target.value } })
            }
          />
        </FormField>
        <FormField label="Geboortedatum">
          <input
            type="date"
            value={data.patient.birthDate}
            onChange={(event) =>
              onChange({ ...data, patient: { ...data.patient, birthDate: event.target.value } })
            }
          />
        </FormField>
        <FormField label="BSN / identificatie (optioneel)">
          <input
            value={data.patient.bsn}
            onChange={(event) =>
              onChange({ ...data, patient: { ...data.patient, bsn: event.target.value } })
            }
          />
        </FormField>
        <FormField label="Geslacht (optioneel)">
          <input
            value={data.patient.gender}
            onChange={(event) =>
              onChange({ ...data, patient: { ...data.patient, gender: event.target.value } })
            }
          />
        </FormField>
        <FormField label="Adres (optioneel)">
          <input
            value={data.patient.address}
            onChange={(event) =>
              onChange({ ...data, patient: { ...data.patient, address: event.target.value } })
            }
          />
        </FormField>
      </div>

      <div className="grid-2">
        <FormField label="Voorschrijver naam">
          <input
            value={data.physician.fullName}
            onChange={(event) =>
              onChange({ ...data, physician: { ...data.physician, fullName: event.target.value } })
            }
          />
        </FormField>
        <FormField label="Plaats">
          <input
            value={data.physician.place}
            onChange={(event) =>
              onChange({ ...data, physician: { ...data.physician, place: event.target.value } })
            }
          />
        </FormField>
        <FormField label="Datum">
          <input
            type="date"
            value={data.physician.date}
            onChange={(event) =>
              onChange({ ...data, physician: { ...data.physician, date: event.target.value } })
            }
          />
        </FormField>
        <FormField label="Telefoon (optioneel)">
          <input
            value={data.physician.phone}
            onChange={(event) =>
              onChange({ ...data, physician: { ...data.physician, phone: event.target.value } })
            }
          />
        </FormField>
        <FormField label="ANW telefoon (optioneel)">
          <input
            value={data.physician.anwPhone}
            onChange={(event) =>
              onChange({ ...data, physician: { ...data.physician, anwPhone: event.target.value } })
            }
          />
        </FormField>
      </div>

      <div className="grid-2">
        <FormField label="Organisatie / zorginstelling (optioneel)">
          <input value={data.organization} onChange={(event) => onChange({ ...data, organization: event.target.value })} />
        </FormField>
        <FormField label="Apotheek (optioneel)">
          <input value={data.pharmacy} onChange={(event) => onChange({ ...data, pharmacy: event.target.value })} />
        </FormField>
      </div>

      <div className="stack">
        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={data.showMlPerHour}
            onChange={(event) => onChange({ ...data, showMlPerHour: event.target.checked })}
          />
          Toon ook ml/uur
        </label>
        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={data.includeGeneratedByFooter}
            onChange={(event) =>
              onChange({ ...data, includeGeneratedByFooter: event.target.checked })
            }
          />
          Toon "gegenereerd via pallsedatie.nl" in PDF-footer
        </label>
      </div>
    </section>
  );
}
