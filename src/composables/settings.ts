import { useStorage } from "@vueuse/core";

const settings = useStorage(
  "settings",
  {
    dailyTargetAmount: 2400,
  },
  localStorage,
  { mergeDefaults: true }
);

export function useSettings() {
  return {
    settings,
  };
}
