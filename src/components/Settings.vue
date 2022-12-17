<script setup lang="ts">
import { useColorMode, useEventBus } from "@vueuse/core";
import { useContents } from "../composables/contents";
import { useCups } from "../composables/cups";
import { useDrinks } from "../composables/drinks";
import { useSettings } from "../composables/settings";
import { COLOR_THEMES, EVENT_DELETED_EVERYTHING } from "../constants";
import BaseInput from "./BaseInput.vue";
import BaseSelect from "./BaseSelect.vue";

const eventDeletedEverything = useEventBus(EVENT_DELETED_EVERYTHING);

const colorMode = useColorMode({
  emitAuto: true,
  modes: COLOR_THEMES.reduce((acc, cur) => Object.assign(acc, { cur }), {}),
});

const { settings } = useSettings();

const { clearDrinks } = useDrinks();

const { clearCups } = useCups();
const { clearContents } = useContents();

const handleDeleteEverything = () => {
  if (confirm("Are you sure you want to delete everything?")) {
    clearDrinks();
    clearCups();
    clearContents();
    eventDeletedEverything.emit();
  }
};
</script>

<template>
  <div class="p-8 space-y-7">
    <h4 class="font-extrabold text-2xl">Settings</h4>

    <div class="!mt-3">
      <div class="text-xs text-gray-400">Settings are saved automatically.</div>
    </div>

    <div>
      <BaseSelect label="Theme" :options="COLOR_THEMES" v-model="colorMode" />
    </div>

    <div>
      <BaseInput
        label="Daily Target Amount (ml)"
        v-model="settings.dailyTargetAmount"
        type="number"
      />
      <div class="text-sm mt-3 text-gray-300">
        An average guideline is 35 ml/kg of body weight, but your required
        amount can vary based on many factors!
      </div>
    </div>

    <div>
      <h3 class="font-bold text-lg mb-3">Your daily routine</h3>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <BaseInput
            label="Day starts at"
            v-model="settings.dayStartHour"
            type="number"
          />
        </div>
        <div>
          <BaseInput
            label="Day ends at"
            v-model="settings.dayEndHour"
            type="number"
            :min="settings.dayStartHour + 1"
            :max="24"
          />
        </div>
      </div>
      <div class="text-sm mt-3 text-gray-300 mb-3">
        Used to calculate how much you should have been drinking at each moment.
        All time values are in 24-hour format.
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
</template>
