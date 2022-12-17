import { reactive, Ref, unref, watch } from "vue";

export * from "./date";
export * from "./notification";

export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

export const debugRefs = (refs: Record<string, Ref>) => {
  watch(
    reactive(refs),
    (values) => {
      console.group("Debug Refs");
      Object.entries(values).forEach(([key, value]) => {
        console.log(key, JSON.parse(JSON.stringify(unref(value))));
      });
      console.groupEnd();
    },
    { deep: true, immediate: true }
  );
};
