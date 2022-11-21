import { useStorage } from "@vueuse/core";
import { computed } from "vue";
import { Content, Cup, Drink, DrinkData } from "../types";
import { uniqueId } from "lodash-es";
import dayjs from "dayjs";
import { DAILY_TARGET_AMOUNT } from "../constants";

const rawDrinks = useStorage<DrinkData[]>("drinks", [], localStorage);

const CONTENTS: Content[] = [
  {
    id: "1",
    name: "Water",
  },
  {
    id: "2",
    name: "Coffee",
  },
  {
    id: "3",
    name: "Tea",
  },
  {
    id: "4",
    name: "Multivitamin",
  },
  {
    id: "5",
    name: "Juice",
  },
  {
    id: "6",
    name: "Soda",
  },
  {
    id: "7",
    name: "Beer",
  },
  {
    id: "8",
    name: "Wine",
  },
  {
    id: "9",
    name: "Cocktail",
  },
  {
    id: "10",
    name: "Other",
  },
];

const CUPS: Cup[] = [
  { id: "1", name: "Small cup", amount: 200 },
  { id: "2", name: "Normal cup", amount: 300 },
  { id: "3", name: "Large cup", amount: 400 },
  { id: "4", name: "Small bottle", amount: 500 },
  { id: "5", name: "Normal bottle", amount: 1000 },
  { id: "6", name: "Large bottle", amount: 1500 },
];

const enrichDrink = (drink: DrinkData): Drink => {
  const content = CONTENTS.find((c) => c.id === drink.contentId);
  const cup = CUPS.find((c) => c.id === drink.cupId);
  return {
    ...drink,
    content,
    cup,
    date: dayjs(drink.date),
  };
};

const drinksToday = computed(() => {
  return rawDrinks.value
    .filter((drink) => dayjs(drink.date).isToday())
    .map(enrichDrink);
});

const recentDrinks = computed(() => {
  const unique: Drink[] = [];

  for (const drink of rawDrinks.value) {
    const existing = unique.find(
      (u) => u.contentId === drink.contentId && u.amount === drink.amount
    );

    if (existing) continue;

    unique.push({ ...enrichDrink(drink) });
  }

  return unique;
});

const cups = computed(() => {
  return CUPS;
});

const contents = computed(() => {
  return CONTENTS;
});

const amountToday = computed(() => {
  return drinksToday.value.reduce((acc, drink) => acc + drink.amount, 0);
});

const percentageToday = computed(() => {
  return Math.round((amountToday.value / DAILY_TARGET_AMOUNT) * 100);
});

const addDrink = (drink: Partial<DrinkData> | Drink) => {
  const cup = CUPS.find((c) => c.id === drink.cupId)!;
  rawDrinks.value.push({
    id: uniqueId(),
    contentId: drink.contentId || CONTENTS[0].id,
    cupId: drink.cupId,
    amount: drink.amount || cup.amount || 0,
    date: new Date().toISOString(),
  });
};

export function useDrinks() {
  return {
    drinksToday,
    recentDrinks,
    amountToday,
    percentageToday,
    addDrink,
    cups,
    contents,
  };
}
