import { useStorage } from "@vueuse/core";
import { computed } from "vue";
import { Content } from "../types";
import { nanoid } from "nanoid";

const CONTENTS: Content[] = [
  {
    id: "1",
    name: "Water",
  },
  {
    id: "2",
    name: "Coffee",
  },
  {
    id: "3",
    name: "Tea",
  },
  {
    id: "4",
    name: "Multivitamin",
  },
  {
    id: "5",
    name: "Juice",
  },
  {
    id: "5",
    name: "Ice Tea",
  },
  {
    id: "7",
    name: "Soft Drink",
  },
  {
    id: "8",
    name: "Beer",
  },
  {
    id: "9",
    name: "Wine",
  },
  {
    id: "10",
    name: "Cocktail",
  },
  {
    id: "11",
    name: "Other",
  },
];

const rawContents = useStorage<Content[]>("contents", [], localStorage);

const contents = computed(() => {
  return [...CONTENTS, ...rawContents.value];
});

export function useContents() {
  const addContent = (content: { name: string; amount: number }) => {
    rawContents.value.push({
      id: nanoid(),
      name: content.name,
    });
  };

  const clearContents = () => {
    rawContents.value = [];
  };

  return {
    contents,
    addContent,
    clearContents,
  };
}
