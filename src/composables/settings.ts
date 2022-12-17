import { useStorage } from "@vueuse/core";
import { DAY_END, DAY_START } from "../constants";

const settings = useStorage(
  "settings",
  {
    dailyTargetAmount: 2500,
    dayStartHour: DAY_START,
    dayEndHour: DAY_END,
  },
  localStorage,
  { mergeDefaults: true }
);

export function useSettings() {
  return {
    settings,
  };
}
