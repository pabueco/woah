import { useStorage } from "@vueuse/core";
import { capitalize, orderBy } from "lodash-es";
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

const getClosestCupCoveringAmount = (amount: number) => {
  return orderBy(cups.value, (cup) => Math.abs(cup.amount - amount), "asc")[0];
};

const getCupsCoveringAmount = (amount: number) => {
  const cupsCoveringAmount = new Map();
  let remainingAmount = amount;

  while (remainingAmount > 0) {
    const closestCup = getClosestCupCoveringAmount(remainingAmount);
    const exisitingCup = cupsCoveringAmount.get(closestCup.id);
    if (exisitingCup) {
      cupsCoveringAmount.set(closestCup.id, {
        ...closestCup,
        count: exisitingCup.count + 1,
      });
    } else {
      cupsCoveringAmount.set(closestCup.id, {
        ...closestCup,
        count: 1,
      });
    }

    remainingAmount -= closestCup.amount;
  }

  const array = Array.from(cupsCoveringAmount.values());

  let text = "";
  if (array.length) {
    const formattedCups = array.map((cup) => {
      return `${cup.count === 1 ? "a" : cup.count} ${cup.name}`;
    });
    const formatter = new Intl.ListFormat("en", {
      style: "long",
      type: "conjunction",
    });
    text = capitalize(formatter.format(formattedCups).toLowerCase());
  }

  return {
    cups: array,
    text,
  };
};

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
    getCupsCoveringAmount,
  };
}
