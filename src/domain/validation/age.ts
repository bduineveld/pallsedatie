import { parseFlexibleDateString } from "../format/dateInputFormat";

export function isOlderThan70(birthDate: string, today = new Date()): boolean {
  if (!birthDate) {
    return false;
  }
  const birth = parseFlexibleDateString(birthDate);
  if (!birth) {
    return false;
  }
  let age = today.getFullYear() - birth.getFullYear();
  const hadBirthday =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hadBirthday) {
    age -= 1;
  }
  return age > 70;
}
