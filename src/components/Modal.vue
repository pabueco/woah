<script setup lang="ts">
import { onKeyStroke, useScrollLock } from "@vueuse/core";
import { computed, reactive, ref, watch } from "vue";
import { XIcon } from "vue-tabler-icons";
import { isIOS } from "../utils/browser";
import BaseInput from "./BaseInput.vue";

const usingIOS = computed(() => {
  return isIOS();
});

const props = defineProps<{
  title?: string;
  options?: {
    id: string;
    name: string;
    description?: string;
    hint?: string;
    [key: string]: any;
  }[];
  modelValue?: any;
  hintKey?: string;
  origin?: string;
  creatable?: boolean;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: any): void;
  (event: "create", value: string): void;
}>();

const isVisible = ref(false);
const triggerRef = ref<HTMLElement | null>(null);

const isShowingContent = ref(false);

const scrollLock = useScrollLock(document.body);

watch(isVisible, (value) => {
  isShowingContent.value = true;

  // Locking body scroll breaks scrolling in modal on iOS.
  if (!usingIOS.value) {
    scrollLock.value = value;
  }
});

const onTriggerClick = (e: MouseEvent) => {
  isVisible.value = true;
};

const handleOptionClick = (option: any) => {
  emit("update:modelValue", option.id);
  isVisible.value = false;
};

onKeyStroke("Escape", () => {
  isVisible.value = false;
});

defineExpose({
  close: () => {
    isVisible.value = false;
  },
});

const createData = ref({
  name: "",
});

const handleCreate = () => {
  emit("create", createData.value.name);
  createData.value.name = "";
};
</script>

<template>
  <div @click="onTriggerClick" class="flex-1" ref="triggerRef">
    <slot name="trigger" />
  </div>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-show="isVisible"
        class="fixed inset-0 z-50 px-5 flex items-center justify-center"
      >
        <div
          class="absolute inset-0 bg-gray-100/90 dark:bg-gray-900/95"
          @click="isVisible = false"
        ></div>
        <div
          class="content w-full max-w-md bg-black text-white z-10 transition duration-500 rounded-xl relative"
          :class="[
            origin || 'origin-center',
            {
              'py-4': !!options?.length,
            },
          ]"
        >
          <div class="absolute bottom-full right-3 -translate-y-2">
            <button class="opacity-50" @click="isVisible = false">
              <XIcon class="w-5 h-5" />
            </button>
          </div>
          <div class="max-h-[75vh] w-full overflow-y-auto">
            <slot>
              <div class="flex flex-col">
                <button
                  v-for="option in options"
                  :key="option.id"
                  @click="handleOptionClick(option)"
                  class="flex items-center justify-between py-3 px-8 hover:text-indigo-200 transition"
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

                <div v-if="creatable" class="px-8 mb-4 mt-8">
                  <BaseInput
                    label="Create your own"
                    @keyup.enter.exact="handleCreate"
                  />
                </div>

                <div v-if="$slots.bottom" class="px-8 mb-4 mt-8">
                  <slot name="bottom" />
                </div>
              </div>
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
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
  transform: translateY(10px) scale(0.9);
}
</style>
