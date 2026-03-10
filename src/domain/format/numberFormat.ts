export function formatMedicalNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  const roundedInteger = Math.round(value);
  if (Math.abs(value - roundedInteger) < 1e-9) {
    return String(roundedInteger);
  }

  const doubled = value * 2;
  const roundedDoubled = Math.round(doubled);
  if (Math.abs(doubled - roundedDoubled) < 1e-9) {
    return (roundedDoubled / 2).toFixed(1);
  }

  return String(roundedInteger);
}
