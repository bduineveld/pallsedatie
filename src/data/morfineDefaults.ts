export interface MorfineNaiveDefaults {
  continueDoseMgPer24h: number;
  lockoutHours: number;
}

export const morfineNaiveStandardDefaults: MorfineNaiveDefaults = {
  continueDoseMgPer24h: 15,
  lockoutHours: 4
};

export const morfineNaiveCautionDefaults: MorfineNaiveDefaults = {
  continueDoseMgPer24h: 10,
  lockoutHours: 6
};
