<script setup lang="ts">
import { useVModel } from "@vueuse/core";
import { uniqueId } from "lodash-es";
import { ChevronDownIcon } from "vue-tabler-icons";

const props = defineProps<{
  modelValue?: any;
  label?: string;
  options: string[];
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: any): void;
}>();

const model = useVModel(props, "modelValue", emit);

const id = uniqueId("input-");
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
  components: { ChevronDownIcon },
};
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="font-medium mb-2 inline-block">{{
      label
    }}</label>
    <div class="w-full relative">
      <select
        v-model="model"
        class="border-gray-400 border-2 px-3.5 py-2.5 rounded-xl w-full bg-transparent outline-none focus:border-indigo-400 transition capitalize appearance-none"
        :id="id"
        v-bind="$attrs"
      >
        <option
          v-for="option in options"
          :key="option"
          :value="option"
          class="capitalize bg-gray-900"
        >
          {{ option }}
        </option>
      </select>

      <div class="absolute top-1/2 -translate-y-1/2 right-4">
        <ChevronDownIcon class="w-5 h-5" />
      </div>
    </div>
  </div>
</template>
