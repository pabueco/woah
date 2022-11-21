<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import { useDeviceOrientation } from "@vueuse/core";
import { useClamp } from "@vueuse/math";
import SelectModal from "./components/SelectModal.vue";
import { CheckIcon, PlusIcon, CupIcon, DropletIcon } from "vue-tabler-icons";
import { useDrinks } from "./composables/drinks";
import { Drink, DrinkData } from "./types";
import { uniqueId } from "lodash-es";
import { PING_DURATION, DAILY_TARGET_AMOUNT } from "./constants";

const deviceOrientation = reactive(useDeviceOrientation());
const tiltAngle = computed(() => (deviceOrientation.gamma || 0) * -0.5);
const waterTilt = useClamp(tiltAngle, -45, 45);

const {
  drinksToday,
  recentDrinks,
  amountToday,
  percentageToday,
  cups,
  contents,
  addDrink,
} = useDrinks();

const pings = ref<string[]>([]);
const wasPingJustAdded = ref(false);

const doPing = () => {
  const id = uniqueId("ping-");
  pings.value.push(id);
  wasPingJustAdded.value = true;
  setTimeout(() => {
    wasPingJustAdded.value = false;
  }, 100);

  setTimeout(() => {
    pings.value.splice(pings.value.indexOf(id), 1);
  }, PING_DURATION);
};
watch(drinksToday, (value, oldValue) => {
  if (value.length > oldValue.length) {
    console.log("ping");

    doPing();
  }
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
</script>

<template>
  <div class="container mx-auto max-w-xs py-10">
    <div class="relative w-60 mx-auto">
      <div
        class="aspect-square z-10 w-full mx-auto mb-10 rounded-full border-[7px] border-gray-100 ring ring-black flex flex-col items-center justify-center relative overflow-hidden transition"
        :class="{
          'scale-105': wasPingJustAdded,
        }"
      >
        <div
          class="font-black text-[3.3rem] flex items-center z-10 leading-none"
        >
          <span>{{ percentageToday }}</span>
          <span class="font-normal ml-1">%</span>
        </div>
        <div class="text-lg flex items-center mt-2 z-10">
          <div>{{ amountToday / 1000 }}</div>
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
                class="fill-indigo-300"
                fill-opacity="1"
                d="M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,117.3C672,117,768,171,864,181.3C960,192,1056,160,1152,154.7C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              ></path>
            </svg>
            <div class="flex-1 bg-indigo-300"></div>
          </div>
        </div>
      </div>

      <div
        v-for="(ping, index) in pings"
        :key="ping"
        class="absolute inset-0 bg-indigo-400 rounded-full pointer-events-none"
        :style="{
          animation: `custom-ping ${PING_DURATION}ms cubic-bezier(0, 0, 0.2, 1)`,
        }"
      ></div>
    </div>

    <div class="flex gap-3">
      <div class="flex flex-col flex-1 gap-3">
        <SelectModal
          v-model="newDrinkData.cupId"
          :options="cups"
          hint-key="amount"
        >
          <template #trigger>
            <button
              class="bg-gray-200 rounded-xl px-4 py-3 w-full text-left flex items-center gap-2 font-medium transition active:scale-95"
            >
              <CupIcon class="w-6 h-6" />
              {{ newDrink.cup?.name || newDrink.amount }}
            </button>
          </template>

          <template #option-hint="{ option }">
            {{ option.amount }} ml
          </template>
        </SelectModal>
        <SelectModal v-model="newDrinkData.contentId" :options="contents">
          <template #trigger>
            <button
              class="bg-gray-200 rounded-xl px-4 py-3 w-full text-left flex items-center gap-2 font-medium transition active:scale-95"
            >
              <DropletIcon class="h-6 w-6" />
              {{ newDrink.content?.name }}
            </button>
          </template>
        </SelectModal>
      </div>
      <button
        @click="addDrink(newDrinkData)"
        class="rounded-xl bg-black text-white w-14 grid place-items-center transition active:scale-90"
      >
        <PlusIcon class="h-7 w-7 stroke-[3px]" />
      </button>
    </div>
    <h3 class="font-bold mt-16 mb-2 text-lg">Recent Drinks</h3>

    <div class="flex flex-col divide- divide-gray-300">
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

<style>
@keyframes custom-ping {
  75%,
  100% {
    transform: scale(2);
    opacity: 0;
  }
}
</style>
