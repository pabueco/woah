import { MaybeRef } from "@vueuse/core";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import { unref } from "vue";

dayjs.extend(isToday);

export { dayjs };

export const getDateWithCurrentTime = (date: MaybeRef<dayjs.Dayjs>) => {
  const now = dayjs();
  return unref(date)
    .clone()
    .hour(now.hour())
    .minute(now.minute())
    .second(now.second())
    .millisecond(now.millisecond());
};
