import { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  children: ReactNode;
  hint?: string;
}

export function FormField({ label, children, hint }: FormFieldProps) {
  return (
    <label className="form-field">
      <span className="form-label">{label}</span>
      {children}
      {hint ? <small className="form-hint">{hint}</small> : null}
    </label>
  );
}
