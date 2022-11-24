<script setup lang="ts">
import { useVModel } from "@vueuse/core";
import { uniqueId } from "lodash-es";

const props = defineProps<{
  modelValue?: any;
  label?: string;
  type?: string;
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
};
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="font-medium mb-2 inline-block">{{
      label
    }}</label>
    <input
      :type="type || 'text'"
      v-model="model"
      class="border-gray-400 border-2 px-3.5 py-2.5 rounded-xl w-full bg-transparent outline-none focus:border-indigo-400 transition"
      :id="id"
      v-bind="$attrs"
    />
  </div>
</template>
