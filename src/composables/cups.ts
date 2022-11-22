import { useStorage } from "@vueuse/core";
import { nanoid } from "nanoid";
import { computed } from "vue";
import { Cup } from "../types";

const CUPS: Cup[] = [
  { id: "1", name: "Small Cup", amount: 200 },
  { id: "2", name: "Normal Cup", amount: 300 },
  { id: "3", name: "Large Cup", amount: 400 },
  { id: "4", name: "Small Bottle", amount: 500 },
  { id: "5", name: "Normal Bottle", amount: 1000 },
  { id: "6", name: "Large Bottle", amount: 1500 },
];

const rawCups = useStorage<Cup[]>("cups", [], localStorage);

const cups = computed(() => {
  return [...CUPS, ...rawCups.value];
});

export function useCups() {
  const addCup = (cup: { name: string; amount: number }) => {
    rawCups.value.push({
      id: nanoid(),
      name: cup.name,
      amount: Number(cup.amount),
    });
  };

  const clearCups = () => {
    rawCups.value = [];
  };

  return {
    cups,
    addCup,
    clearCups,
  };
}
