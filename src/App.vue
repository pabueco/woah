<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useDeviceOrientation } from "@vueuse/core";
import { useClamp } from "@vueuse/math";
import SelectModal from "./components/SelectModal.vue";
import { CheckIcon, PlusIcon, CupIcon, DropletIcon } from "vue-tabler-icons";
import { useDrinks } from "./composables/drinks";
import { Drink, DrinkData } from "./types";

const DAILY_TARGET_AMOUNT = 2400;

const deviceOrientation = reactive(useDeviceOrientation());
const tiltAngle = computed(() => (deviceOrientation.gamma || 0) * -0.5);
const waterTilt = useClamp(tiltAngle, -45, 45);

const { drinks, cups, contents, addDrink } = useDrinks();

const amountToday = computed(() => {
  return drinks.value.reduce((acc, drink) => acc + drink.amount, 0);
});

const percentageToday = computed(() => {
  return Math.round((amountToday.value / DAILY_TARGET_AMOUNT) * 100);
});

const newDrinkData = ref<Partial<DrinkData>>({
  contentId: "1",
  cupId: "1",
  amount: 0,
});

const newDrink = computed(() => {
  return {
    ...newDrinkData.value,
    content: contents.value.find(
      (content) => content.id === newDrinkData.value.contentId
    ),
    cup: cups.value.find((cup) => cup.id === newDrinkData.value.cupId),
  };
});

const recentDrinks = computed(() => {
  const unique: Drink[] = [];

  for (const drink of drinks.value) {
    const existing = unique.find(
      (u) => u.contentId === drink.contentId && u.amount === drink.amount
    );

    if (existing) continue;

    unique.push({ ...drink });
  }

  return unique;
});
</script>

<template>
  <div class="container mx-auto max-w-xs py-10">
    <div
      class="h-48 w-48 mx-auto mb-10 rounded-full border-2 border-black flex flex-col items-center justify-center relative overflow-hidden"
    >
      <div class="font-extrabold text-5xl flex items-center z-10">
        <span>{{ percentageToday }}</span>
        <span class="font-normal text-2xl ml-1">%</span>
      </div>
      <div class="text-base flex items-center mt-2 z-10">
        <div>{{ amountToday / 1000 }} l</div>
        <div class="mx-1">of</div>
        <div>{{ DAILY_TARGET_AMOUNT / 1000 }} l</div>
      </div>

      <div
        class="absolute inset-0 w-full h-full top-full transition duration-300 origin-top"
        :style="{
          transform: `translateY(-${Math.min(percentageToday - 5, 100)}%)`,
        }"
      >
        <div
          class="origin-top absolute inset-y-0 -inset-x-10 h-full flex flex-col"
          :style="{
            transform: `rotate(${waterTilt}deg)`,
          }"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            class="absolute bottom-full translate-y-[1.1rem]"
          >
            <path
              class="fill-blue-400"
              fill-opacity="1"
              d="M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,117.3C672,117,768,171,864,181.3C960,192,1056,160,1152,154.7C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
          <div class="flex-1 bg-blue-400"></div>
        </div>
      </div>
    </div>

    <div class="flex gap-3">
      <div class="flex flex-col flex-1 gap-3">
        <SelectModal>
          <template #trigger>
            <button
              class="bg-gray-200 rounded-2xl px-4 py-3 w-full text-left flex items-center gap-2 font-medium"
            >
              <CupIcon class="w-6 h-6" />
              {{ newDrink.cup?.name || newDrink.amount }}
            </button>
          </template>

          <div class="grid grid-cols-2 gap-4">
            <button
              v-for="cup in cups"
              :key="cup.name"
              @click="newDrinkData.cupId = cup.id"
              class="aspect-square bg-blue-50 rounded-xl"
            >
              <div class="text-base font-medium leading-tight">
                {{ cup.name }}
              </div>
              <div class="text-xs mt-2 text-gray-500">{{ cup.amount }} ml</div>
            </button>
          </div>
        </SelectModal>
        <SelectModal>
          <template #trigger>
            <button
              class="bg-gray-200 rounded-2xl px-4 py-3 w-full text-left flex items-center gap-2 font-medium"
            >
              <DropletIcon class="h-6 w-6" />
              {{ newDrink.content?.name }}
            </button>
          </template>
        </SelectModal>
      </div>
      <button
        @click="addDrink(newDrinkData)"
        class="rounded-2xl bg-black text-white w-14 grid place-items-center"
      >
        <PlusIcon class="h-7 w-7" />
      </button>
    </div>
    <h3 class="font-semibold text-lg border-b border-black py-2 mt-10">
      Recent drinks
    </h3>

    <div class="flex flex-col divide-y divide-black">
      <button
        v-for="drink in recentDrinks"
        :key="drink.id"
        @click="addDrink(drink)"
        class="py-2 flex"
      >
        <div class="text-base leading-tight flex items-center space-x-1">
          <div v-if="drink.cup">{{ drink.cup?.name }}</div>
          <div v-else>{{ drink.amount }} ml</div>

          <div class="font-normal">of</div>
          <div>{{ drink.content?.name }}</div>
        </div>
      </button>
    </div>
  </div>
</template>
