<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  TransitionPresets,
  useDeviceOrientation,
  useEventBus,
  useIntervalFn,
  useMediaQuery,
  useStorage,
  useTransition,
} from "@vueuse/core";
import { useClamp } from "@vueuse/math";
import Modal from "./components/Modal.vue";
import {
  PlusIcon,
  DropletIcon,
  SettingsIcon,
  MugIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  TrashIcon,
  CornerDownLeftIcon,
  BellIcon,
  TriangleIcon,
} from "vue-tabler-icons";
import { useDrinks } from "./composables/drinks";
import { useCups } from "./composables/cups";
import { useContents } from "./composables/contents";
import { mapRange } from "./utils";
import { DrinkData } from "./types";
import { uniqueId } from "lodash-es";
import {
  PING_DURATION,
  MAX_TILT_ANGLE,
  EVENT_DELETED_EVERYTHING,
} from "./constants";
import { useSettings } from "./composables/settings";
import { useHydrateReminder } from "./composables/reminder";
import confetti from "canvas-confetti";
import { UseTimeAgo } from "@vueuse/components";
import Settings from "./components/Settings.vue";
import NotificationInfo from "./components/NotificationInfo.vue";

const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

const eventDeletedEverything = useEventBus(EVENT_DELETED_EVERYTHING);
eventDeletedEverything.on(() => {
  newDrinkData.value = getDefaultNewDrinkData();
  settingsModalRef.value?.close();
});

const {
  drinksToday,
  recentDrinks,
  amountToday,
  percentageToday,
  addDrink,
  date,
  setDate,
  onAddDrink,
  onDailGoalReached,
  deleteDrink,
  checkIsDehydrated,
  getExpectedAmountNow,
  getDefaultNewDrinkData,
} = useDrinks();

const { hasNotificationPermission, cancelCurrentReminder, runReminder } =
  useHydrateReminder();
runReminder();

const { settings } = useSettings();
const { cups, addCup } = useCups();
const { contents, addContent } = useContents();

const bowlRef = ref<HTMLElement>();
const settingsModalRef = ref<InstanceType<typeof Modal> | null>(null);

const pings = ref<string[]>([]);
const wasPingJustAdded = ref(false);

const expectedAmountNow = ref(0);
const setExpectedAmountNow = () => {
  expectedAmountNow.value = getExpectedAmountNow();
};
useIntervalFn(
  () => {
    setExpectedAmountNow();
  },
  1000,
  { immediate: true, immediateCallback: true }
);
const exptectedAmoutNowPercentage = computed(() => {
  return Math.min(
    (expectedAmountNow.value / settings.value.dailyTargetAmount) * 100,
    100
  );
});
const exptectedAmountRotation = computed(() => {
  return mapRange(exptectedAmoutNowPercentage.value, 0, 100, 90, -90);
});
const isDehydratedNow = computed(() => {
  return checkIsDehydrated();
});

// Not updating the expected amount when the daily target amount changes causes the indicator to jump around.
watch(
  () => settings.value.dailyTargetAmount,
  () => setExpectedAmountNow()
);

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

onAddDrink.on(() => {
  doPing();
  cancelCurrentReminder();
});

onDailGoalReached.on(() => {
  const rect = bowlRef.value?.getBoundingClientRect()!;
  confetti({
    particleCount: 420,
    spread: 360,
    startVelocity: 36,
    origin: {
      x: (rect.x + rect.width / 2) / window.innerWidth,
      y: (rect.y + rect.height / 2) / window.innerHeight,
    },
    colors: ["#c7d2fe", "#a5b4fc", "#818cf8", "#6366f1"],
  });
});

const newDrinkData = useStorage<Partial<DrinkData>>(
  "new-drink",
  getDefaultNewDrinkData(),
  localStorage,
  {
    mergeDefaults: true,
  }
);

const newDrink = computed(() => {
  return {
    ...newDrinkData.value,
    content: contents.value.find(
      (content) => content.id === newDrinkData.value.contentId
    ),
    cup: cups.value.find((cup) => cup.id === newDrinkData.value.cupId),
  };
});

const transitionedPercentage = useTransition(percentageToday, {
  duration: 500,
  transition: TransitionPresets.easeInOutSine,
});
const waterLevelPercentage = computed(() => {
  return Math.min(percentageToday.value ? percentageToday.value - 5 : 0, 100);
});

const isShowingHistory = ref(false);

const newCupData = ref({
  name: "",
  amount: undefined as number | undefined,
});
const handleCreateCup = () => {
  if (!newCupData.value.name || Number.isNaN(newCupData.value.amount)) return;
  addCup(newCupData.value as any);
  newCupData.value = {
    name: "",
    amount: undefined,
  };
};

const newContentData = ref({
  name: "",
});
const handleCreateContent = () => {
  if (!newContentData.value.name) return;
  addContent(newContentData.value as any);
  newContentData.value = {
    name: "",
  };
};

/**
 * Handle liquid animation on device tilt.
 */
const deviceOrientation = computed(() => {
  if (prefersReducedMotion.value) return null;
  const orientation = useDeviceOrientation();
  return orientation;
});
const tiltAngle = computed(() => {
  if (!deviceOrientation.value) return 0;
  return (deviceOrientation.value.gamma.value || 0) * -0.5;
});
const waterTilt = useClamp(tiltAngle, -MAX_TILT_ANGLE, MAX_TILT_ANGLE);
</script>

<template>
  <div class="container mx-auto max-w-sm px-5 py-10 flex flex-col min-h-screen">
    <div class="absolute top-10 left-10 flex gap-4">
      <Modal title="Notifications">
        <template #trigger>
          <button class="relative">
            <div
              v-if="!hasNotificationPermission"
              class="absolute top-0 right-0 w-3 h-3 rounded-full bg-indigo-500 border-2 border-gray-10 dark:border-gray-900"
            ></div>
            <BellIcon class="w-6 h-6 transition" />
          </button>
        </template>

        <NotificationInfo />
      </Modal>
    </div>
    <div class="absolute top-10 right-10 flex gap-4">
      <Modal title="Settings" ref="settingsModalRef">
        <template #trigger>
          <button>
            <SettingsIcon class="w-6 h-6" />
          </button>
        </template>

        <Settings />
      </Modal>
    </div>

    <div class="flex justify-center">
      <div
        class="text-center mb-10 text-[1.65rem] font-black italic leading-none"
      >
        woah!
      </div>
    </div>

    <div class="flex items-center mb-10">
      <button
        class="order-first px-2 py-5 -ml-2"
        @click="setDate(date.subtract(1, 'day'))"
      >
        <ChevronLeftIcon class="w-6 h-6 stroke-[3px]" />
      </button>
      <button
        class="order-last px-2 py-5 [&:disabled]:opacity-25 -mr-2"
        @click="setDate(date.add(1, 'day'))"
        :disabled="date.isToday()"
      >
        <ChevronRightIcon class="w-6 h-6 stroke-[3px]" />
      </button>

      <div ref="bowlRef" class="relative w-60 mx-auto shrink-0">
        <Transition name="date-badge">
          <div
            v-if="!date.isToday()"
            class="text-center absolute -translate-y-1/2 left-1/2 top-1 -translate-x-1/2 bg-black dark:bg-gray-100 rounded-full text-white dark:text-black font-medium px-4 z-20 text-xs py-1.5 leading-none origin-center flex"
          >
            {{ date.isToday() ? "Today" : date.format("ddd, DD. MMM") }}
          </div>
        </Transition>
        <div
          class="absolute w-full aspect-square transition duration-300"
          :style="{
            transform: `rotate(${exptectedAmountRotation}deg)`,
          }"
        >
          <div class="absolute top-1/2 -translate-y-1/2 -right-6 -rotate-90">
            <TriangleIcon
              class="w-[15px] h-[15px] text-black dark:text-white stroke-none fill-current"
              :class="{
                'animate-bounce': isDehydratedNow,
              }"
            />
          </div>
        </div>
        <div
          class="aspect-square z-10 w-full mx-auto rounded-full border-[7px] border-gray-100 dark:border-gray-900 ring ring-black dark:ring-gray-100 flex flex-col items-center justify-center relative overflow-hidden transition"
          :class="{
            'scale-105': wasPingJustAdded,
          }"
        >
          <div
            class="font-black text-[3.3rem] flex items-center z-10 leading-none"
          >
            <span>{{ Math.floor(transitionedPercentage) }}</span>
            <span class="font-normal ml-1">%</span>
          </div>
          <div class="text-base flex items-center mt-1 z-10">
            <div>{{ Number(amountToday / 1000).toFixed(1) }}</div>
            <div class="mx-1">of</div>
            <div>
              {{ Number(settings.dailyTargetAmount / 1000).toFixed(1) }} l
            </div>
          </div>
          <div
            class="absolute inset-0 w-full h-full top-full transition duration-500 ease-in-out origin-top"
            :style="{
              transform: `translateY(-${waterLevelPercentage}%)`,
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
                  class="fill-indigo-300 dark:fill-indigo-700"
                  fill-opacity="1"
                  d="M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,117.3C672,117,768,171,864,181.3C960,192,1056,160,1152,154.7C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                ></path>
              </svg>
              <div class="flex-1 bg-indigo-300 dark:bg-indigo-700"></div>
            </div>
          </div>
        </div>

        <div
          v-for="ping in pings"
          :key="ping"
          class="absolute inset-0 bg-indigo-400 rounded-full pointer-events-none"
          :style="{
            animation: `custom-ping ${PING_DURATION}ms cubic-bezier(0, 0, 0.2, 1)`,
          }"
        ></div>
      </div>
    </div>

    <h3 class="font-extrabold mb-3 text-lg">What did you drink?</h3>
    <div class="flex gap-3">
      <div class="flex flex-col flex-1 gap-3">
        <Modal v-model="newDrinkData.cupId" :options="cups" hint-key="amount">
          <template #trigger>
            <button
              class="bg-gray-200 dark:bg-gray-800 rounded-xl px-4 py-3 w-full text-left flex items-center gap-2 font-medium"
            >
              <MugIcon class="w-5 h-5" />
              <div>{{ newDrink.cup?.name || newDrink.amount }}</div>
              <ChevronDownIcon class="h-6 w-6 text-gray-400 ml-auto" />
            </button>
          </template>

          <template #option-hint="{ option }">
            {{ option.amount }} ml
          </template>

          <template #bottom>
            <h4 class="font-bold text-lg mb-2">Create your own</h4>
            <div class="flex gap-4">
              <div
                class="border-2 border-white rounded-xl w-full flex items-center pr-3 focus-within:border-indigo-400"
              >
                <input
                  v-model="newCupData.name"
                  type="text"
                  placeholder="Name"
                  class="bg-transparent px-3.5 py-2.5 outline-none flex-1 min-w-0"
                  @keyup.enter.exact="handleCreateCup"
                />
                <input
                  v-model="newCupData.amount"
                  type="text"
                  placeholder="300"
                  class="bg-transparent pl-3.5 pr-2 py-2.5 outline-none w-32 text-right"
                  @keyup.enter.exact="handleCreateCup"
                />
                <div>ml</div>
                <button
                  class="rounded-md bg-white p-0.5 ml-6"
                  @click="handleCreateCup"
                >
                  <CornerDownLeftIcon class="w-5 h-5 text-black" />
                </button>
              </div>
            </div>
          </template>
        </Modal>
        <Modal v-model="newDrinkData.contentId" :options="contents">
          <template #trigger>
            <button
              class="bg-gray-200 dark:bg-gray-800 rounded-xl px-4 py-3 w-full text-left flex items-center gap-2 font-medium"
            >
              <DropletIcon class="h-5 w-5" />
              <div>{{ newDrink.content?.name }}</div>
              <ChevronDownIcon class="h-6 w-6 text-gray-400 ml-auto" />
            </button>
          </template>

          <template #bottom>
            <h4 class="font-bold text-lg mb-2">Create your own</h4>
            <div class="flex gap-4">
              <div
                class="border-2 border-white rounded-xl w-full flex items-center pr-3 focus-within:border-indigo-400"
              >
                <input
                  v-model="newContentData.name"
                  type="text"
                  placeholder="Name"
                  class="bg-transparent px-3.5 py-2.5 outline-none flex-1 min-w-0"
                  @keyup.enter.exact="handleCreateContent"
                />
                <button
                  class="rounded-md bg-white p-0.5 ml-6"
                  @click="handleCreateContent"
                >
                  <CornerDownLeftIcon class="w-5 h-5 text-black" />
                </button>
              </div>
            </div>
          </template>
        </Modal>
      </div>
      <button
        @click="addDrink(newDrinkData)"
        class="rounded-xl bg-indigo-300 dark:bg-indigo-600 text-black dark:text-white w-14 flex flex-col items-center justify-center"
      >
        <PlusIcon class="h-7 w-7 stroke-[2.5px]" />
      </button>
    </div>

    <h3 class="font-extrabold mt-10 mb-2 text-lg">Recent drinks</h3>
    <div class="flex flex-col items-start">
      <div v-if="!recentDrinks.length">
        <p class="text-gray-500 text-sm">Drink something, dude!</p>
      </div>
      <button
        v-for="drink in recentDrinks"
        :key="drink.id"
        @click="addDrink(drink)"
        class="py-2 hover:text-indigo-500 inline-flex items-center"
      >
        <div class="text-base leading-tight flex items-center space-x-1">
          <div v-if="drink.cup">{{ drink.cup?.name }}</div>
          <div v-else>{{ drink.amount }} ml</div>

          <div class="font-normal">of</div>
          <div>{{ drink.content?.name }}</div>
        </div>
      </button>
    </div>

    <template v-if="drinksToday.length">
      <button
        @click="isShowingHistory = !isShowingHistory"
        class="flex w-full items-center justify-between mt-10 mb-2"
      >
        <h3 class="font-extrabold text-lg">Drinks you had today</h3>
        <div>
          <ChevronDownIcon
            class="h-5 w-5 stroke-[3px] transition"
            :class="{
              'rotate-180': isShowingHistory,
            }"
          />
        </div>
      </button>
      <div v-if="isShowingHistory" class="flex flex-col">
        <div
          v-for="drink in [...drinksToday].reverse()"
          :key="drink.id"
          class="py-2 text-left flex items-center justify-between group"
        >
          <div>
            <button
              @click="addDrink(drink)"
              class="text-base leading-tight flex items-center space-x-1 hover:text-indigo-500"
            >
              <div v-if="drink.cup">{{ drink.cup?.name }}</div>
              <div v-else>{{ drink.amount }} ml</div>
              <div class="font-normal">of</div>
              <div>{{ drink.content?.name }}</div>
            </button>
            <div class="text-xs mt-0.5 text-gray-500">
              <UseTimeAgo v-slot="{ timeAgo }" :time="drink.date.toDate()">
                {{ timeAgo }}
              </UseTimeAgo>
            </div>
          </div>
          <div
            class="flex items-center gap-1 md:opacity-0 transition md:-translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 pointer-events-none group-hover:pointer-events-auto"
          >
            <button @click="deleteDrink(drink)" class="hover:text-red-500">
              <TrashIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </template>

    <div
      class="mt-auto pt-14 text-gray-400 dark:text-gray-400/75 text-xs italic text-center"
    >
      By
      <a
        href="https://pabue.co"
        target="_blank"
        class="dark:hover:text-indigo-500 hover:text-indigo-400 transition"
        >pabue.co</a
      >
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

button {
  @apply transition active:translate-y-0.5;
}

.date-badge-enter-active,
.date-badge-leave-active {
  transition: all 0.15s;
}

.date-badge-enter-from,
.date-badge-leave-to {
  opacity: 0;
  @apply scale-75 -translate-y-3;
}
</style>
