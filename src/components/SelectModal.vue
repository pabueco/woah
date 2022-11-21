<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";

const props = defineProps<{
  title?: string;
  options: {
    id: string;
    name: string;
    description?: string;
    hint?: string;
    [key: string]: any;
  }[];
  modelValue: any;
  hintKey?: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: any): void;
}>();

const isVisible = ref(false);
const triggerRef = ref<HTMLElement | null>(null);

const isShowingContent = ref(false);

watch(isVisible, (value) => {
  isShowingContent.value = true;
});

const onTriggerClick = (e: MouseEvent) => {
  console.log("trigger clicked");
  isVisible.value = true;
};
</script>

<template>
  <div @click="onTriggerClick" class="flex-1" ref="triggerRef">
    <slot name="trigger" />
  </div>
  <Transition name="modal">
    <div
      v-show="isVisible"
      class="fixed inset-0 z-40 px-5 flex items-center justify-center"
    >
      <div
        class="absolute inset-0 bg-white/90"
        @click="isVisible = false"
      ></div>
      <div
        @click="isVisible = false"
        class="content w-full max-w-md bg-black text-white py-4 z-10 transition duration-500 rounded-xl"
      >
        <slot>
          <div class="flex flex-col">
            <button
              v-for="option in options"
              :key="option.id"
              @click="emit('update:modelValue', option.id)"
              class="flex items-center justify-between py-3 px-8"
              :class="{
                'text-indigo-300': option.id === modelValue,
              }"
            >
              <div class="font-medium">
                {{ option.name }}
              </div>
              <div
                v-if="
                  $slots['option-hint'] ||
                  option.hint ||
                  (hintKey && option[hintKey])
                "
                class="text-xs"
              >
                <slot name="option-hint" :option="option">
                  {{ option[hintKey!] || option.hint }}
                </slot>
              </div>
            </button>
          </div>
        </slot>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .content,
.modal-leave-active .content {
  transition: inherit;
}

.modal-enter-from .content,
.modal-leave-to .content {
  transform: translateY(-10px) scale(0.9);
}
</style>
