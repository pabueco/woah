import { useEventBus, useStorage } from "@vueuse/core";
import { computed, ref } from "vue";
import { Drink, DrinkData } from "../types";
import { dayjs, getDateWithCurrentTime } from "../utils/date";
import { useSettings } from "./settings";
import { useCups } from "./cups";
import { useContents } from "./contents";
import { nanoid } from "nanoid";

const date = ref(dayjs());

const rawDrinks = useStorage<DrinkData[]>("drinks", [], localStorage);

const setDate = (newDate: dayjs.Dayjs) => {
  date.value = newDate;
};

const clearDrinks = () => {
  rawDrinks.value = [];
};

const getDefaultNewDrinkData = () => ({
  contentId: "water",
  cupId: "md-cup",
  amount: 0,
});

const onAddDrink = useEventBus<Drink>("add-drink");
const onDailGoalReached = useEventBus("daily-goal-reached");

export function useDrinks() {
  const { settings } = useSettings();
  const { cups } = useCups();
  const { contents } = useContents();

  const amountToday = computed(() => {
    return drinksToday.value.reduce((acc, drink) => acc + drink.amount, 0);
  });

  const percentageToday = computed(() => {
    const percentage = Math.round(
      (amountToday.value / settings.value.dailyTargetAmount) * 100
    );
    return isNaN(percentage) ? 0 : percentage;
  });

  const enrichDrink = (drink: DrinkData): Drink => {
    const content = contents.value.find((c) => c.id === drink.contentId);
    const cup = cups.value.find((c) => c.id === drink.cupId);
    return {
      ...drink,
      content,
      cup,
      date: dayjs(drink.date),
    };
  };

  const drinksToday = computed(() => {
    return rawDrinks.value
      .filter(
        (drink) =>
          dayjs(drink.date).format("YYYY-MM-DD") ===
          date.value.format("YYYY-MM-DD")
      )
      .map(enrichDrink);
  });

  const recentDrinks = computed(() => {
    const unique: Drink[] = [];

    for (const drink of rawDrinks.value) {
      const existing = unique.find(
        (u) => u.contentId === drink.contentId && u.amount === drink.amount
      );

      if (existing) {
        unique.splice(unique.indexOf(existing), 1);
      }

      unique.unshift({ ...enrichDrink(drink) });
    }

    return unique.slice(0, 5);
  });

  const addDrink = (drink: Partial<DrinkData> | Drink) => {
    const amountBefore = amountToday.value;

    const cup = cups.value.find((c) => c.id === drink.cupId)!;
    const newDrink = {
      id: nanoid(),
      contentId: drink.contentId || contents.value[0].id,
      cupId: drink.cupId,
      amount: drink.amount || cup.amount || 0,
      date: getDateWithCurrentTime(date).toISOString(),
    };
    rawDrinks.value.push(newDrink);
    onAddDrink.emit(enrichDrink(newDrink));

    if (
      amountBefore < settings.value.dailyTargetAmount &&
      amountToday.value >= settings.value.dailyTargetAmount
    ) {
      onDailGoalReached.emit();
    }
  };

  const deleteDrink = (drink: Drink) => {
    rawDrinks.value.splice(
      rawDrinks.value.findIndex((d) => d.id === drink.id),
      1
    );
  };

  const getExpectedAmountNow = () => {
    const now = dayjs();
    const start = dayjs().hour(settings.value.dayStartHour);
    let end = dayjs().hour(settings.value.dayEndHour);

    // If day ends after midnight, add a day to the end date.
    if (settings.value.dayStartHour > settings.value.dayEndHour) {
      end = end.add(1, "day");
    }

    if (now.isBefore(start)) return 0;
    if (now.isAfter(end)) return settings.value.dailyTargetAmount;

    const duration = end.diff(start);
    const elapsed = now.diff(start);
    const expected = (elapsed / duration) * settings.value.dailyTargetAmount;

    return expected;
  };

  const getExpectedAmountDifference = () => {
    return getExpectedAmountNow() - amountToday.value;
  };

  const checkIsDehydrated = () => {
    return amountToday.value < getExpectedAmountNow();
  };

  return {
    drinksToday,
    recentDrinks,
    amountToday,
    percentageToday,
    addDrink,
    contents,
    getDefaultNewDrinkData,

    deleteDrink,
    clearDrinks,

    onAddDrink,
    onDailGoalReached,

    date,
    setDate,

    checkIsDehydrated,
    getExpectedAmountDifference,
    getExpectedAmountNow,
  };
}
