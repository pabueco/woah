import { useStorage } from "@vueuse/core";
import { computed } from "vue";
import { Content } from "../types";
import { nanoid } from "nanoid";
import { orderBy } from "lodash-es";

const CONTENTS: Content[] = [
  {
    id: "water",
    name: "Water",
  },
  {
    id: "coffee",
    name: "Coffee",
  },
  {
    id: "tea",
    name: "Tea",
  },
  {
    id: "multivitamin",
    name: "Multivitamin",
  },
  {
    id: "juice",
    name: "Juice",
  },
  {
    id: "ice-tea",
    name: "Ice Tea",
  },
  {
    id: "soft-drink",
    name: "Soft Drink",
  },
  {
    id: "beer",
    name: "Beer",
  },
  {
    id: "wine",
    name: "Wine",
  },
  {
    id: "coktail",
    name: "Cocktail",
  },
];

const rawContents = useStorage<Content[]>("contents", [], localStorage);

const contents = computed(() => {
  return orderBy([...CONTENTS, ...rawContents.value], (content) =>
    content.name.toLowerCase()
  );
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
