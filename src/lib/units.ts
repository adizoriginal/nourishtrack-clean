// Weight and height units. Everything is stored in kg and cm; these helpers convert for display and input.

export type UnitSystem = "metric" | "imperial";

const KG_PER_LB = 0.45359237;
const CM_PER_IN = 2.54;

export const UNITS_STORAGE_KEY = "nourishtrack:units";

export const kgToLb = (kg: number) => kg / KG_PER_LB;
export const lbToKg = (lb: number) => lb * KG_PER_LB;

export const cmToFtIn = (cm: number) => {
  const totalIn = Math.round(cm / CM_PER_IN);
  return { ft: Math.floor(totalIn / 12), inch: totalIn % 12 };
};
export const ftInToCm = (ft: number, inch: number) => (ft * 12 + inch) * CM_PER_IN;

export const weightUnitLabel = (units: UnitSystem) => (units === "imperial" ? "lb" : "kg");

/** kg -> number in the user's unit, rounded to 1 decimal */
export const displayWeight = (kg: number, units: UnitSystem) =>
  Math.round((units === "imperial" ? kgToLb(kg) : kg) * 10) / 10;

/** number in the user's unit -> kg */
export const toKg = (value: number, units: UnitSystem) => (units === "imperial" ? lbToKg(value) : value);

export const formatWeight = (kg: number, units: UnitSystem) =>
  `${displayWeight(kg, units).toFixed(1)} ${weightUnitLabel(units)}`;

export const formatHeight = (cm: number, units: UnitSystem) => {
  if (units === "metric") return `${Math.round(cm)} cm`;
  const { ft, inch } = cmToFtIn(cm);
  return `${ft} ft ${inch} in`;
};

/** Best guess for a new user: the US, Liberia and Myanmar use pounds and feet; everyone else metric. */
export const guessUnits = (): UnitSystem => {
  try {
    const locale = navigator.language || "";
    const region = locale.split("-")[1]?.toUpperCase();
    if (region && ["US", "LR", "MM"].includes(region)) return "imperial";
  } catch {
    /* ignore */
  }
  return "metric";
};

export const readStoredUnits = (): UnitSystem | null => {
  try {
    const v = localStorage.getItem(UNITS_STORAGE_KEY);
    return v === "metric" || v === "imperial" ? v : null;
  } catch {
    return null;
  }
};

export const storeUnits = (units: UnitSystem) => {
  try {
    localStorage.setItem(UNITS_STORAGE_KEY, units);
  } catch {
    /* ignore */
  }
};
