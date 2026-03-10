export function mgPerHourToMlPerHour(mgPerHour: number, concentrationMgPerMl: number): number {
  if (concentrationMgPerMl <= 0) {
    return Number.NaN;
  }
  return mgPerHour / concentrationMgPerMl;
}

export function mlPerHourToMgPerHour(mlPerHour: number, concentrationMgPerMl: number): number {
  return mlPerHour * concentrationMgPerMl;
}
