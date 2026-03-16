export function formatIsoToDutchDate(value: string): string {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!isoMatch) {
    return value.trim();
  }
  const [, yyyy, mm, dd] = isoMatch;
  return `${dd}-${mm}-${yyyy}`;
}

export function parseDutchDateToIso(value: string): string | null {
  const dutchMatch = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim());
  if (!dutchMatch) {
    return null;
  }
  const [, dd, mm, yyyy] = dutchMatch;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  const candidate = new Date(year, month - 1, day);
  const isSameDate =
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day;
  if (!isSameDate) {
    return null;
  }
  return `${yyyy}-${mm}-${dd}`;
}

export function parseFlexibleDateString(value: string): Date | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  const asIso = parseDutchDateToIso(trimmed) ?? trimmed;
  const parsed = new Date(asIso);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}
