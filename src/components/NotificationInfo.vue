<script setup lang="ts">
import { AlertTriangleIcon, InfoCircleIcon } from "vue-tabler-icons";
import { useHydrateReminder } from "../composables/reminder";

const { hasNotificationPermission, requestNotificationPermission } =
  useHydrateReminder();
</script>

<template>
  <div class="p-8 space-y-5 prose prose-invert">
    <h4 class="font-extrabold text-2xl">Notifications</h4>

    <div
      v-if="!hasNotificationPermission"
      class="text-indigo-400 text-base flex items-start"
    >
      <InfoCircleIcon class="w-6 h-6 mr-2 shrink-0" />
      <div>
        You have to allow notifications for reminders to work!
        <button class="underline inline" @click="requestNotificationPermission">
          Enable notifications now
        </button>
        or check your browser settings.
      </div>
    </div>

    <p>
      This site does not talk to any server, so there are two things you should
      know if you want to use reminders.
    </p>

    <ol>
      <li>
        <strong>You need to have this site open in a tab.</strong> <br />
        If you don't want to think about opening it every day, you can tell your
        browser to open it automatically. Look for "start-up" in your browser's
        settings.
      </li>
      <li>
        <strong>The tab should not be put to sleep.</strong> <br />
        Most modern browsers put websites to sleep when they are not used for a
        while to save resources. This means that the reminders might not work
        reliably. You can disable it for this website by looking for "sleep" in
        your browser's settings or just visit this tab from time to time.
      </li>
    </ol>

    <div class="text-yellow-500 text-base flex items-start !mt-10">
      <AlertTriangleIcon class="w-6 h-6 mr-2 shrink-0" /> iOS does not support
      web notifications yet so you won't get any reminders on iPhones or iPads.
    </div>
  </div>
</template>
