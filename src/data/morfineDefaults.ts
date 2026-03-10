export interface MorfineNaiveDefaults {
  continueDoseMgPer24h: number;
  startDoseMg: number;
  bolusMg: number;
  lockoutHours: number;
}

export const morfineNaiveStandardDefaults: MorfineNaiveDefaults = {
  continueDoseMgPer24h: 15,
  startDoseMg: 5,
  bolusMg: 5,
  lockoutHours: 4
};

export const morfineNaiveCautionDefaults: MorfineNaiveDefaults = {
  continueDoseMgPer24h: 10,
  startDoseMg: 5,
  bolusMg: 5,
  lockoutHours: 6
};
