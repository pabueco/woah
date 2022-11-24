<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import {
  TransitionPresets,
  useDeviceOrientation,
  useIntervalFn,
  useStorage,
  useTransition,
  useWebNotification,
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
  AlertTriangleIcon,
} from "vue-tabler-icons";
import { useDrinks } from "./composables/drinks";
import { useCups } from "./composables/cups";
import { useContents } from "./composables/contents";
import { Drink, DrinkData } from "./types";
import { uniqueId } from "lodash-es";
import { MINUTE_IN_MS, PING_DURATION } from "./constants";
import { useSettings } from "./composables/settings";
import confetti from "canvas-confetti";
import { UseTimeAgo } from "@vueuse/components";
import BaseInput from "./components/BaseInput.vue";
import { showNotification } from "./utils/notification";

const getDefaultNewDrinkData = () => ({
  contentId: "water",
  cupId: "md-cup",
  amount: 0,
});

const settingsModal = ref<InstanceType<typeof Modal> | null>(null);

const deviceOrientation = reactive(useDeviceOrientation());
const tiltAngle = computed(() => (deviceOrientation.gamma || 0) * -0.5);
const waterTilt = useClamp(tiltAngle, -45, 45);

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
  clearDrinks,
  deleteDrink,
  checkIsDehydrated,
  getExpectedAmountDifference,
} = useDrinks();

const { settings } = useSettings();
const { cups, addCup, clearCups, getCupsCoveringAmount } = useCups();
const { contents, addContent, clearContents } = useContents();

const bowlRef = ref<HTMLElement>();

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

onAddDrink.on(() => {
  doPing();
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

const handleDeleteEverything = () => {
  if (confirm("Are you sure you want to delete everything?")) {
    clearDrinks();
    clearCups();
    clearContents();
    newDrinkData.value = getDefaultNewDrinkData();
    settingsModal.value?.close();
  }
};

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

useIntervalFn(
  () => {
    const isDehydrated = checkIsDehydrated();
    if (isDehydrated) {
      const missing = getExpectedAmountDifference();
      const cupsToCatchUp = getCupsCoveringAmount(missing);
      let textBody = `You are ${Math.round(missing)} ml short!`;
      if (cupsToCatchUp.text) {
        textBody += ` ${cupsToCatchUp.text} should do it!`;
      }

      showNotification({
        title: `Drink something!`,
        body: textBody,
        tag: "drink-notification",
        renotify: true,
      });
    }
  },
  15 * MINUTE_IN_MS,
  {
    immediateCallback: true,
  }
);
</script>

<template>
  <div class="container mx-auto max-w-sm px-5 py-10">
    <div class="absolute top-10 left-10 flex gap-4">
      <Modal title="Notifications">
        <template #trigger>
          <button>
            <BellIcon class="w-6 h-6 text-black transition hover:text-black" />
          </button>
        </template>

        <div class="p-8 space-y-5 prose prose-invert">
          <h4 class="font-extrabold text-2xl">Notifications</h4>

          <p>
            This site does not talk to any server, so there are two things you
            should know if you want to use reminders.
          </p>

          <ol>
            <li>
              <strong>You need to have this site open in a tab.</strong> <br />
              If you don't want to think about opening it every day, you can
              tell your browser to open it automatically. Look for "start-up" in
              your browser's settings.
            </li>
            <li>
              <strong>The tab should not be put to sleep.</strong> <br />
              Most modern browsers put websites to sleep when they are not used
              for a while to save resources. This means that the reminders might
              not work reliably. You can disable it for this website by looking
              for "sleep" in your browser's settings or just visit this tab from
              time to time.
            </li>
          </ol>

          <div class="text-yellow-500 text-base flex items-start !mt-10">
            <AlertTriangleIcon class="w-6 h-6 mr-2 shrink-0" /> iOS does not
            support web notifications yet so you won't get any reminders on
            iPhones or iPads.
          </div>
        </div>
      </Modal>
    </div>
    <div class="absolute top-10 right-10 flex gap-4">
      <Modal title="Settings" ref="settingsModal">
        <template #trigger>
          <button>
            <SettingsIcon
              class="w-6 h-6 text-black transition hover:text-black"
            />
          </button>
        </template>

        <div class="p-8 space-y-5">
          <h4 class="font-extrabold text-2xl">Settings</h4>

          <div>
            <BaseInput
              label="Daily Target Amount (ml)"
              v-model="settings.dailyTargetAmount"
              type="number"
            />
          </div>

          <div class="">
            <div class="text-xs text-gray-400">
              Settings are applied and saved automatically.
            </div>
          </div>

          <div class="!mt-10">
            <h4 class="font-extrabold text-lg mb-3">Danger Zone</h4>
            <button
              @click="handleDeleteEverything"
              class="rounded-xl bg-red-500 px-4 py-2.5 font-semibold text-sm hover:bg-red-400 transition"
            >
              Delete everything
            </button>
          </div>
        </div>
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
        class="order-first px-2 py-5"
        @click="setDate(date.subtract(1, 'day'))"
      >
        <ChevronLeftIcon
          class="w-6 h-6 text-black transition hover:text-black stroke-[3px]"
        />
      </button>
      <button
        class="order-last px-2 py-5 [&:disabled]:opacity-25"
        @click="setDate(date.add(1, 'day'))"
        :disabled="date.isToday()"
      >
        <ChevronRightIcon
          class="w-6 h-6 text-black transition hover:text-black stroke-[3px]"
        />
      </button>

      <div ref="bowlRef" class="relative w-60 mx-auto shrink-0">
        <Transition name="date-badge">
          <div
            v-if="!date.isToday()"
            class="text-center absolute -translate-y-1/2 left-1/2 top-1 -translate-x-1/2 bg-black rounded-full text-white px-4 z-20 text-xs py-1.5 leading-none origin-center flex"
          >
            {{ date.isToday() ? "Today" : date.format("ddd, DD. MMM") }}
          </div>
        </Transition>
        <div
          class="aspect-square z-10 w-full mx-auto rounded-full border-[7px] border-gray-100 ring ring-black flex flex-col items-center justify-center relative overflow-hidden transition"
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
              transform: `translateY(-${Math.min(
                percentageToday ? percentageToday - 5 : 0,
                100
              )}%)`,
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
    </div>

    <h3 class="font-extrabold mb-3 text-lg">What did you drink?</h3>
    <div class="flex gap-3">
      <div class="flex flex-col flex-1 gap-3">
        <Modal v-model="newDrinkData.cupId" :options="cups" hint-key="amount">
          <template #trigger>
            <button
              class="bg-gray-200 rounded-xl px-4 py-3 w-full text-left flex items-center gap-2 font-medium"
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
              class="bg-gray-200 rounded-xl px-4 py-3 w-full text-left flex items-center gap-2 font-medium"
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
        class="rounded-xl bg-black text-white w-14 flex flex-col items-center justify-center"
      >
        <PlusIcon class="h-7 w-7 stroke-[2.5px]" />
      </button>
    </div>

    <h3 class="font-extrabold mt-10 mb-2 text-lg">Recent drinks</h3>
    <div class="flex flex-col">
      <div v-if="!recentDrinks.length">
        <p class="text-gray-500 text-sm">Drink something, dude!</p>
      </div>
      <button
        v-for="drink in recentDrinks"
        :key="drink.id"
        @click="addDrink(drink)"
        class="py-2 flex hover:text-indigo-500"
      >
        <div class="text-base leading-tight flex items-center space-x-1">
          <div v-if="drink.cup">{{ drink.cup?.name }}</div>
          <div v-else>{{ drink.amount }} ml</div>

          <div class="font-normal">of</div>
          <div>{{ drink.content?.name }}</div>
        </div>
      </button>
    </div>

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
      <div v-if="!recentDrinks.length">
        <p class="text-gray-500 text-sm">Are you kidding me?</p>
      </div>
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
          class="flex items-center gap-1 opacity-0 transition -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
        >
          <button @click="deleteDrink(drink)" class="hover:text-red-500">
            <TrashIcon class="h-5 w-5" />
          </button>
        </div>
      </div>
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
