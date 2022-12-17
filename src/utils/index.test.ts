import { describe, expect, test } from "vitest";
import { mapRange } from ".";

describe("mapRange", () => {
  test("maps a value from one range to another", () => {
    expect(mapRange(50, 0, 100, 0, 1)).toBe(0.5);
    expect(mapRange(0, 0, 100, 0, 1)).toBe(0);
    expect(mapRange(0.43, 0, 1, 0, 100)).toBe(43);
    expect(mapRange(0.5, 0, 1, -90, 90)).toBe(0);
    expect(mapRange(0.75, 0, 1, -90, 90)).toBe(45);
  });
});
