<script setup lang="ts">
import { computed, reactive, ref } from "vue";

const isVisible = ref(false);
const triggerRef = ref<HTMLElement | null>(null);

const onTriggerClick = (e: MouseEvent) => {
  console.log("trigger clicked");
  isVisible.value = true;
};
</script>

<template>
  <div @click="onTriggerClick" class="flex-1" ref="triggerRef">
    <slot name="trigger" />
  </div>
  <div v-show="isVisible" class="fixed inset-0 z-40 grid p-5 place-items-start">
    <div class="absolute inset-0 bg-white/80" @click="isVisible = false"></div>
    <div
      @click="isVisible = false"
      class="w-full max-w-md bg-blue-100 rounded-md p-6 z-10 transition duration-500"
    >
      <slot />
    </div>
  </div>
</template>
