import { uiDisclaimer } from "../data/guidelineText";
import { GeneralFormData } from "../types/models";
import { FormField } from "./FormField";

interface GeneralSectionProps {
  data: GeneralFormData;
  onChange: (data: GeneralFormData) => void;
}

export function GeneralSection({ data, onChange }: GeneralSectionProps) {
  const physicianRole = data.physician.role ?? "huisarts";

  return (
    <section className="card">
      <h2>Algemeen</h2>
      <p className="small-muted">{uiDisclaimer}</p>
      <div className="grid-2">
        <FormField label="Patiënt naam *">
          <input
            value={data.patient.fullName}
            onChange={(event) =>
              onChange({ ...data, patient: { ...data.patient, fullName: event.target.value } })
            }
          />
        </FormField>
        <FormField label="Geboortedatum *">
          <input
            type="date"
            value={data.patient.birthDate}
            onChange={(event) =>
              onChange({ ...data, patient: { ...data.patient, birthDate: event.target.value } })
            }
          />
        </FormField>
        <FormField label="BSN / identificatie">
          <input
            value={data.patient.bsn}
            onChange={(event) =>
              onChange({ ...data, patient: { ...data.patient, bsn: event.target.value } })
            }
          />
        </FormField>
        <FormField label="Geslacht">
          <input
            value={data.patient.gender}
            onChange={(event) =>
              onChange({ ...data, patient: { ...data.patient, gender: event.target.value } })
            }
          />
        </FormField>
        <FormField label="Adres">
          <input
            value={data.patient.address}
            onChange={(event) =>
              onChange({ ...data, patient: { ...data.patient, address: event.target.value } })
            }
          />
        </FormField>
        <FormField label="Telefoon cliënt/contactpersoon">
          <input
            value={data.patient.contactPhone}
            onChange={(event) =>
              onChange({ ...data, patient: { ...data.patient, contactPhone: event.target.value } })
            }
          />
        </FormField>
        <FormField label="Verzekering">
          <input
            value={data.patient.insurance}
            onChange={(event) =>
              onChange({ ...data, patient: { ...data.patient, insurance: event.target.value } })
            }
          />
        </FormField>
      </div>

      <div className="grid-2">
        <FormField label="Functie *">
          <select
            value={physicianRole}
            onChange={(event) =>
              onChange({
                ...data,
                physician: {
                  ...data.physician,
                  role: event.target.value as
                    | "huisarts"
                    | "huisarts_io"
                    | "basisarts"
                    | "verpleegkundig_specialist"
                    | "physician_assistant"
                }
              })
            }
          >
            <option value="huisarts">Huisarts</option>
            <option value="huisarts_io">Huisarts i.o.</option>
            <option value="basisarts">Basisarts</option>
            <option value="verpleegkundig_specialist">Verpleegkundig Specialist</option>
            <option value="physician_assistant">Physician Assistant</option>
          </select>
        </FormField>
        <FormField label="Voorschrijver naam *">
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
        <FormField label="Praktijk">
          <input
            value={data.physician.practice}
            onChange={(event) =>
              onChange({ ...data, physician: { ...data.physician, practice: event.target.value } })
            }
          />
        </FormField>
        <FormField label="Datum *">
          <input
            type="date"
            value={data.physician.date}
            onChange={(event) =>
              onChange({ ...data, physician: { ...data.physician, date: event.target.value } })
            }
          />
        </FormField>
        <FormField label="Telefoon">
          <input
            value={data.physician.phone}
            onChange={(event) =>
              onChange({ ...data, physician: { ...data.physician, phone: event.target.value } })
            }
          />
        </FormField>
        <FormField label="ANW telefoon">
          <input
            value={data.physician.anwPhone}
            onChange={(event) =>
              onChange({ ...data, physician: { ...data.physician, anwPhone: event.target.value } })
            }
          />
        </FormField>
      </div>

      <div className="grid-2">
        <FormField label="Aan zorginstelling">
          <input value={data.organization} onChange={(event) => onChange({ ...data, organization: event.target.value })} />
        </FormField>
        <FormField label="Apotheek">
          <input value={data.pharmacy} onChange={(event) => onChange({ ...data, pharmacy: event.target.value })} />
        </FormField>
        <FormField label="Telefoon zorginstelling">
          <input
            value={data.organizationPhone}
            onChange={(event) => onChange({ ...data, organizationPhone: event.target.value })}
          />
        </FormField>
        <FormField label="Veilige e-mail zorginstelling">
          <input
            value={data.organizationSecureEmail}
            onChange={(event) => onChange({ ...data, organizationSecureEmail: event.target.value })}
          />
        </FormField>
        <FormField label="Telefoon apotheek">
          <input
            value={data.pharmacyPhone}
            onChange={(event) => onChange({ ...data, pharmacyPhone: event.target.value })}
          />
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
