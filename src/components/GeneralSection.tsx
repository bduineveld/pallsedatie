import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { uiDisclaimer } from "../data/guidelineText";
import { GeneralFormData, PhysicianData } from "../types/models";
import { FormField } from "./FormField";

const calendarIcon = "/icons/healthicons/calendar.svg";
const personIcon = "/icons/healthicons/person.svg";
const doctorIcon = "/icons/healthicons/doctor.svg";
const hospitalIcon = "/icons/healthicons/ambulatory-clinic.svg";
const pharmacyIcon = "/icons/healthicons/pharmacy.svg";
const settingsIcon = "/icons/healthicons/settings.svg";
const saveIcon = "/icons/save-feather.svg";
const savedCheckIcon = "/icons/check-square-feather.svg";

interface GeneralSectionProps {
  data: GeneralFormData;
  onChange: (data: GeneralFormData) => void;
}

interface SavedOrganizationEntry {
  name: string;
  phone: string;
  secureEmail: string;
}

interface SavedPharmacyEntry {
  name: string;
  phone: string;
}

type SavedPhysicianProfile = Omit<PhysicianData, "date">;

export function GeneralSection({ data, onChange }: GeneralSectionProps) {
  const PHYSICIAN_STORAGE_KEY = "pallsedatie.savedPhysician";
  const ORGANIZATION_STORAGE_KEY = "pallsedatie.savedOrganizations";
  const PHARMACY_STORAGE_KEY = "pallsedatie.savedPharmacies";
  const hasLoadedSavedPhysician = useRef(false);
  const hasLoadedSavedOrganizations = useRef(false);
  const hasLoadedSavedPharmacies = useRef(false);
  const [lastSavedPhysicianPayload, setLastSavedPhysicianPayload] = useState("");
  const [lastSavedOrganizationPayload, setLastSavedOrganizationPayload] = useState("");
  const [lastSavedPharmacyPayload, setLastSavedPharmacyPayload] = useState("");
  const [savedOrganizations, setSavedOrganizations] = useState<SavedOrganizationEntry[]>([]);
  const [savedPharmacies, setSavedPharmacies] = useState<SavedPharmacyEntry[]>([]);
  const [organizationMenuOpen, setOrganizationMenuOpen] = useState(false);
  const [pharmacyMenuOpen, setPharmacyMenuOpen] = useState(false);
  const physicianRole = data.physician.role ?? "huisarts";
  const currentPhysicianPayload = useMemo(
    () =>
      JSON.stringify({
        role: data.physician.role,
        fullName: data.physician.fullName,
        practice: data.physician.practice,
        place: data.physician.place,
        practiceAddress: data.physician.practiceAddress,
        phone: data.physician.phone,
        anwPhone: data.physician.anwPhone
      } as SavedPhysicianProfile),
    [
      data.physician.role,
      data.physician.fullName,
      data.physician.practice,
      data.physician.place,
      data.physician.practiceAddress,
      data.physician.phone,
      data.physician.anwPhone
    ]
  );
  const currentOrganizationPayload = useMemo(
    () =>
      JSON.stringify({
        name: data.organization,
        phone: data.organizationPhone,
        secureEmail: data.organizationSecureEmail
      }),
    [data.organization, data.organizationPhone, data.organizationSecureEmail]
  );
  const currentPharmacyPayload = useMemo(
    () =>
      JSON.stringify({
        name: data.pharmacy,
        phone: data.pharmacyPhone
      }),
    [data.pharmacy, data.pharmacyPhone]
  );
  const physicianIsSaved =
    lastSavedPhysicianPayload.length > 0 &&
    currentPhysicianPayload === lastSavedPhysicianPayload;
  const organizationIsSaved =
    lastSavedOrganizationPayload.length > 0 &&
    currentOrganizationPayload === lastSavedOrganizationPayload;
  const pharmacyIsSaved =
    lastSavedPharmacyPayload.length > 0 &&
    currentPharmacyPayload === lastSavedPharmacyPayload;
  const filteredOrganizations = useMemo(() => {
    const needle = data.organization.trim().toLowerCase();
    if (!needle) {
      return savedOrganizations;
    }
    return savedOrganizations.filter((entry) =>
      entry.name.toLowerCase().includes(needle)
    );
  }, [data.organization, savedOrganizations]);
  const filteredPharmacies = useMemo(() => {
    const needle = data.pharmacy.trim().toLowerCase();
    if (!needle) {
      return savedPharmacies;
    }
    return savedPharmacies.filter((entry) =>
      entry.name.toLowerCase().includes(needle)
    );
  }, [data.pharmacy, savedPharmacies]);
  const requiredLabel = (text: string) => (
    <>
      {text} <span className="required-mark">*</span>
    </>
  );
  const SectionHeader = ({
    iconSrc,
    title,
    action
  }: {
    iconSrc: string;
    title: string;
    action?: ReactNode;
  }) => (
    <div className="general-group-header">
      <span className="general-group-icon" aria-hidden="true">
        <img src={iconSrc} alt="" className="general-group-icon-image" />
      </span>
      <div className="general-group-header-text">
        <h3 className="general-group-title">{title}</h3>
      </div>
      {action ? <div className="general-group-header-actions">{action}</div> : null}
    </div>
  );

  useEffect(() => {
    if (hasLoadedSavedPhysician.current || typeof window === "undefined") {
      return;
    }
    hasLoadedSavedPhysician.current = true;
    const rawSavedPhysician = window.localStorage.getItem(PHYSICIAN_STORAGE_KEY);
    if (!rawSavedPhysician) {
      return;
    }
    try {
      const savedPhysician = JSON.parse(rawSavedPhysician) as Partial<SavedPhysicianProfile>;
      const mergedPhysician = {
        ...data.physician,
        ...savedPhysician,
        // Date should always default to today and remain user-controlled in this form.
        date: data.physician.date
      };
      onChange({
        ...data,
        physician: mergedPhysician
      });
      setLastSavedPhysicianPayload(JSON.stringify(mergedPhysician));
    } catch {
      // Ignore invalid local data; form remains editable.
    }
  }, [data, onChange]);

  useEffect(() => {
    if (hasLoadedSavedOrganizations.current || typeof window === "undefined") {
      return;
    }
    hasLoadedSavedOrganizations.current = true;
    const rawSavedOrganizations = window.localStorage.getItem(ORGANIZATION_STORAGE_KEY);
    if (!rawSavedOrganizations) {
      return;
    }
    try {
      const parsed = JSON.parse(rawSavedOrganizations) as SavedOrganizationEntry[];
      const valid = parsed.filter(
        (entry) =>
          typeof entry?.name === "string" &&
          typeof entry?.phone === "string" &&
          typeof entry?.secureEmail === "string"
      );
      setSavedOrganizations(valid);
    } catch {
      // Ignore invalid local data; user can save again.
    }
  }, []);

  useEffect(() => {
    if (hasLoadedSavedPharmacies.current || typeof window === "undefined") {
      return;
    }
    hasLoadedSavedPharmacies.current = true;
    const rawSavedPharmacies = window.localStorage.getItem(PHARMACY_STORAGE_KEY);
    if (!rawSavedPharmacies) {
      return;
    }
    try {
      const parsed = JSON.parse(rawSavedPharmacies) as SavedPharmacyEntry[];
      const valid = parsed.filter(
        (entry) =>
          typeof entry?.name === "string" &&
          typeof entry?.phone === "string"
      );
      setSavedPharmacies(valid);
    } catch {
      // Ignore invalid local data; user can save again.
    }
  }, []);

  const savePhysicianToBrowser = () => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(PHYSICIAN_STORAGE_KEY, currentPhysicianPayload);
    setLastSavedPhysicianPayload(currentPhysicianPayload);
  };

  const saveOrganizationToBrowser = () => {
    if (typeof window === "undefined") {
      return;
    }
    const name = data.organization.trim();
    if (!name) {
      return;
    }
    const entryToSave: SavedOrganizationEntry = {
      name,
      phone: data.organizationPhone.trim(),
      secureEmail: data.organizationSecureEmail.trim()
    };
    const nextOrganizations = [...savedOrganizations];
    const existingIndex = nextOrganizations.findIndex(
      (entry) => entry.name.toLowerCase() === name.toLowerCase()
    );
    if (existingIndex >= 0) {
      nextOrganizations[existingIndex] = entryToSave;
    } else {
      nextOrganizations.push(entryToSave);
    }
    window.localStorage.setItem(ORGANIZATION_STORAGE_KEY, JSON.stringify(nextOrganizations));
    setSavedOrganizations(nextOrganizations);
    setLastSavedOrganizationPayload(JSON.stringify(entryToSave));
  };

  const selectSavedOrganization = (entry: SavedOrganizationEntry) => {
    onChange({
      ...data,
      organization: entry.name,
      organizationPhone: entry.phone,
      organizationSecureEmail: entry.secureEmail
    });
    setOrganizationMenuOpen(false);
  };

  const savePharmacyToBrowser = () => {
    if (typeof window === "undefined") {
      return;
    }
    const name = data.pharmacy.trim();
    if (!name) {
      return;
    }
    const entryToSave: SavedPharmacyEntry = {
      name,
      phone: data.pharmacyPhone.trim()
    };
    const nextPharmacies = [...savedPharmacies];
    const existingIndex = nextPharmacies.findIndex(
      (entry) => entry.name.toLowerCase() === name.toLowerCase()
    );
    if (existingIndex >= 0) {
      nextPharmacies[existingIndex] = entryToSave;
    } else {
      nextPharmacies.push(entryToSave);
    }
    window.localStorage.setItem(PHARMACY_STORAGE_KEY, JSON.stringify(nextPharmacies));
    setSavedPharmacies(nextPharmacies);
    setLastSavedPharmacyPayload(JSON.stringify(entryToSave));
  };

  const selectSavedPharmacy = (entry: SavedPharmacyEntry) => {
    onChange({
      ...data,
      pharmacy: entry.name,
      pharmacyPhone: entry.phone
    });
    setPharmacyMenuOpen(false);
  };

  return (
    <section className="card">
      <h2>Gegevens cliënt en zorgverleners, instellingen</h2>
      <p className="small-muted">{uiDisclaimer}</p>

      <div className="general-group">
        <SectionHeader iconSrc={calendarIcon} title="Datum verzoek" />
        <div className="grid-2">
          <FormField label={requiredLabel("Datum uitvoeringsverzoek")}>
            <input
              type="date"
              lang="nl-NL"
              value={data.physician.date}
              onChange={(event) =>
                onChange({ ...data, physician: { ...data.physician, date: event.target.value } })
              }
            />
          </FormField>
        </div>
      </div>

      <div className="general-group">
        <SectionHeader iconSrc={personIcon} title="Cliënt" />
        <div className="grid-2">
          <FormField label={requiredLabel("Naam")}>
            <input
              value={data.patient.fullName}
              onChange={(event) =>
                onChange({ ...data, patient: { ...data.patient, fullName: event.target.value } })
              }
            />
          </FormField>
          <FormField label={requiredLabel("Geboortedatum")}>
            <input
              type="date"
              lang="nl-NL"
              value={data.patient.birthDate}
              onChange={(event) =>
                onChange({ ...data, patient: { ...data.patient, birthDate: event.target.value } })
              }
            />
          </FormField>
          <FormField label="BSN">
            <input
              value={data.patient.bsn}
              onChange={(event) =>
                onChange({ ...data, patient: { ...data.patient, bsn: event.target.value } })
              }
            />
          </FormField>
          <FormField label="Geslacht">
            <select
              value={data.patient.gender}
              onChange={(event) =>
                onChange({ ...data, patient: { ...data.patient, gender: event.target.value } })
              }
            >
              <option value="">-</option>
              <option value="vrouw">vrouw</option>
              <option value="man">man</option>
              <option value="onzijdig">onzijdig</option>
            </select>
          </FormField>
          <FormField label="Adres">
            <input
              value={data.patient.address}
              onChange={(event) =>
                onChange({ ...data, patient: { ...data.patient, address: event.target.value } })
              }
            />
          </FormField>
          <FormField label="Woonplaats">
            <input
              value={data.patient.city}
              onChange={(event) =>
                onChange({ ...data, patient: { ...data.patient, city: event.target.value } })
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
      </div>

      <div className="general-group">
        <SectionHeader
          iconSrc={doctorIcon}
          title="Aanvragend zorgverlener"
          action={
            <button
              type="button"
              className="header-action-button"
              title="zorgverlener opslaan in browser"
              aria-label="zorgverlener opslaan in browser"
              onClick={savePhysicianToBrowser}
            >
              {physicianIsSaved ? (
                <img src={savedCheckIcon} alt="" className="header-action-icon header-action-icon--saved" />
              ) : (
                <img src={saveIcon} alt="" className="header-action-icon" />
              )}
            </button>
          }
        />
        <div className="grid-2">
          <FormField label={requiredLabel("Functie")}>
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
          <FormField label={requiredLabel("Naam")}>
            <input
              value={data.physician.fullName}
              onChange={(event) =>
                onChange({ ...data, physician: { ...data.physician, fullName: event.target.value } })
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
          <FormField label="Plaats">
            <input
              value={data.physician.place}
              onChange={(event) =>
                onChange({ ...data, physician: { ...data.physician, place: event.target.value } })
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
          <FormField label="Praktijkadres">
            <input
              value={data.physician.practiceAddress}
              onChange={(event) =>
                onChange({ ...data, physician: { ...data.physician, practiceAddress: event.target.value } })
              }
            />
          </FormField>
        </div>
      </div>

      <div className="general-group general-group--allow-overflow">
        <SectionHeader
          iconSrc={hospitalIcon}
          title="Uitvoerende zorginstelling"
          action={
            <button
              type="button"
              className="header-action-button"
              title="zorginstelling opslaan in browser"
              aria-label="zorginstelling opslaan in browser"
              onClick={saveOrganizationToBrowser}
            >
              {organizationIsSaved ? (
                <img src={savedCheckIcon} alt="" className="header-action-icon header-action-icon--saved" />
              ) : (
                <img src={saveIcon} alt="" className="header-action-icon" />
              )}
            </button>
          }
        />
        <div className="grid-2">
          <FormField label="Naam instelling">
            <div
              className="autocomplete-wrapper"
              onBlur={() => setTimeout(() => setOrganizationMenuOpen(false), 120)}
            >
              <input
                value={data.organization}
                onFocus={() => setOrganizationMenuOpen(true)}
                onChange={(event) => {
                  onChange({ ...data, organization: event.target.value });
                  setOrganizationMenuOpen(true);
                }}
              />
              {organizationMenuOpen && filteredOrganizations.length > 0 ? (
                <div className="autocomplete-menu">
                  {filteredOrganizations.map((entry) => (
                    <button
                      key={entry.name.toLowerCase()}
                      type="button"
                      className="autocomplete-item"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectSavedOrganization(entry)}
                    >
                      {entry.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </FormField>
          <FormField label="Telefoon">
            <input
              value={data.organizationPhone}
              onChange={(event) => onChange({ ...data, organizationPhone: event.target.value })}
            />
          </FormField>
          <FormField label="Veilige e-mail">
            <input
              value={data.organizationSecureEmail}
              onChange={(event) => onChange({ ...data, organizationSecureEmail: event.target.value })}
            />
          </FormField>
        </div>
      </div>

      <div className="general-group general-group--allow-overflow">
        <SectionHeader
          iconSrc={pharmacyIcon}
          title="Apotheek"
          action={
            <button
              type="button"
              className="header-action-button"
              title="apotheek opslaan in browser"
              aria-label="apotheek opslaan in browser"
              onClick={savePharmacyToBrowser}
            >
              {pharmacyIsSaved ? (
                <img src={savedCheckIcon} alt="" className="header-action-icon header-action-icon--saved" />
              ) : (
                <img src={saveIcon} alt="" className="header-action-icon" />
              )}
            </button>
          }
        />
        <div className="grid-2">
          <FormField label="Naam apotheek">
            <div
              className="autocomplete-wrapper"
              onBlur={() => setTimeout(() => setPharmacyMenuOpen(false), 120)}
            >
              <input
                value={data.pharmacy}
                onFocus={() => setPharmacyMenuOpen(true)}
                onChange={(event) => {
                  onChange({ ...data, pharmacy: event.target.value });
                  setPharmacyMenuOpen(true);
                }}
              />
              {pharmacyMenuOpen && filteredPharmacies.length > 0 ? (
                <div className="autocomplete-menu">
                  {filteredPharmacies.map((entry) => (
                    <button
                      key={entry.name.toLowerCase()}
                      type="button"
                      className="autocomplete-item"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectSavedPharmacy(entry)}
                    >
                      {entry.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </FormField>
          <FormField label="Telefoon apotheek">
            <input
              value={data.pharmacyPhone}
              onChange={(event) => onChange({ ...data, pharmacyPhone: event.target.value })}
            />
          </FormField>
        </div>
      </div>

      <div className="general-group">
        <SectionHeader iconSrc={settingsIcon} title="Weergave uitvoeringsverzoek" />
        <div className="stack">
          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={data.showMlPerHour}
              onChange={(event) => onChange({ ...data, showMlPerHour: event.target.checked })}
            />
            toon doseringen naast mg/24u ook in ml/uur
          </label>
          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={data.hideLogoOnPdf}
              onChange={(event) => onChange({ ...data, hideLogoOnPdf: event.target.checked })}
            />
            verberg pallsedatie-logo op uitvoeringsverzoek
          </label>
        </div>
      </div>
    </section>
  );
}
