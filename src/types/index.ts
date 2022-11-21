import dayjs from "dayjs";

export type DrinkData = {
  id: string;
  contentId: string;
  cupId?: string;
  date: string;
  amount: number;
};

export type Content = {
  id: string;
  name: string;
};

export type Cup = {
  id: string;
  name: string;
  amount: number;
};

export type Drink = Omit<DrinkData, "date"> & {
  content?: Content;
  cup?: Cup;
  date: dayjs.Dayjs;
};
