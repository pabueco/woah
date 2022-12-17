import { Pausable, useIntervalFn, usePermission, useTitle } from "@vueuse/core";
import { computed } from "vue";
import { MINUTE_IN_MS, TITLE_BASE } from "../constants";
import { showNotification } from "../utils/notification";
import { useDrinks } from "./drinks";
import { useCups } from "./cups";

export function useHydrateReminder() {
  const { checkIsDehydrated, getExpectedAmountDifference } = useDrinks();
  const { getCupsCoveringAmount } = useCups();

  const title = useTitle();
  title.value = TITLE_BASE;
  let titleDrinkReminder: Pausable;

  const notificationPermission = usePermission("notifications", {
    controls: true,
  });
  const hasNotificationPermission = computed(() => {
    return notificationPermission.state.value === "granted";
  });

  const startTitleDrinkReminder = () => {
    let show = true;
    titleDrinkReminder = useIntervalFn(() => {
      title.value = show
        ? "Drink something!"
        : "############################################";
      show = !show;
    }, 1000);
  };

  const stopTitleDrinkReminder = () => {
    titleDrinkReminder?.pause();
    title.value = TITLE_BASE;
  };

  const runReminder = () => {
    useIntervalFn(
      () => {
        const isDehydrated = checkIsDehydrated();
        if (!isDehydrated) return;

        const missing = getExpectedAmountDifference();
        const cupsToCatchUp = getCupsCoveringAmount(missing);
        let textBody = `You are ${Math.round(missing)} ml short!`;
        if (cupsToCatchUp.text) {
          textBody += ` ${cupsToCatchUp.text} should do it!`;
        }

        startTitleDrinkReminder();

        if (hasNotificationPermission.value) {
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
  };

  const cancelCurrentReminder = () => {
    stopTitleDrinkReminder();
  };

  const requestNotificationPermission = async () => {
    await notificationPermission.query();
  };

  return {
    hasNotificationPermission,
    requestNotificationPermission,
    runReminder,
    cancelCurrentReminder,
  };

  /**
   * Scrolling message in tab title.
   * Looks cool, but gets slow when tab is inactive.
   * This is due to the fact that the interval for inactive tabs is reduced by the browser.
   */
  // const TITLE_BASE = `woah!`;
  // const title = useTitle();
  // title.value = TITLE_BASE;
  // const REMINDER_TITLE = `----- DRINK SOMETHING! ----- DRINK SOMETHING! `;
  // let reminderTitleIndex = 0;

  // useIntervalFn(() => {
  //   const [cut, remainder] = [
  //     REMINDER_TITLE.slice(0, reminderTitleIndex),
  //     REMINDER_TITLE.slice(reminderTitleIndex),
  //   ];
  //   title.value = remainder + cut;
  //   reminderTitleIndex = (reminderTitleIndex + 1) % REMINDER_TITLE.length;
  // }, 100);
}
