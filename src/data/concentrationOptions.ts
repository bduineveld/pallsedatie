export interface ConcentrationOption {
  value: number;
  label: string;
}

export const morfineConcentrations: ConcentrationOption[] = [
  { value: 1, label: "morfine 1mg/ml" },
  { value: 10, label: "morfine 10mg/ml (standaard)" },
  { value: 20, label: "morfine 20mg/ml" }
];

export const midazolamConcentrations: ConcentrationOption[] = [
  { value: 1, label: "midazolam 1mg/ml" },
  { value: 2, label: "midazolam 2mg/ml" },
  { value: 5, label: "midazolam 5mg/ml (standaard)" }
];

export const productText = {
  morfine: "Veelgebruikt: 100 ml Sendolor zakje",
  midazolam: "Veelgebruikt: 100 ml Senozam zakje of Deltec cassette"
};
