import { describe, expect, it } from "vitest";
import { canMeetBounds, canMeetNeeds } from "./feasibility";

const anywhere = () => true;

describe("보장 수를 채울 수 있는지 (canMeetNeeds)", () => {
  it("필요한 합이 남은 자리보다 많으면 불가능하다", () => {
    expect(canMeetNeeds([{ id: "a", need: 2 }, { id: "b", need: 1 }], [1, 1], anywhere)).toBe(false);
  });

  it("각자 뛸 수 있는 쿼터 안에서만 센다", () => {
    const onlyFirst = (_: string, quarter: number) => quarter === 0;
    expect(canMeetNeeds([{ id: "a", need: 1 }, { id: "b", need: 1 }], [1, 5], onlyFirst)).toBe(false);
    expect(canMeetNeeds([{ id: "a", need: 1 }, { id: "b", need: 1 }], [2, 5], onlyFirst)).toBe(true);
  });

  it("아무도 더 뛸 필요가 없으면 가능하다", () => {
    expect(canMeetNeeds([{ id: "a", need: 0 }], [0], anywhere)).toBe(true);
  });
});

describe("하한·상한을 지키며 쿼터를 다 채울 수 있는지 (canMeetBounds)", () => {
  it("하한·상한·쿼터 인원이 맞으면 가능하다", () => {
    const players = [
      { id: "a", min: 1, max: 2 },
      { id: "b", min: 1, max: 1 },
    ];
    expect(canMeetBounds(players, [1, 1], anywhere)).toBe(true);
  });

  it("하한만 보면 되지만 상한까지 보면 안 되는 경우를 잡는다", () => {
    // b 는 1쿼터에만 올 수 있는데 상한이 0이다. 두 쿼터를 다 채우려면 a 가 2번 뛰어야 하지만
    // a 의 상한은 1이다. 하한(전부 0)만 보는 canMeetNeeds 로는 이 문제가 안 보인다.
    const canPlay = (id: string, quarter: number) => id === "a" || quarter === 1;
    const players = [
      { id: "a", min: 0, max: 1 },
      { id: "b", min: 0, max: 0 },
    ];
    expect(canMeetBounds(players, [1, 1], canPlay)).toBe(false);
    expect(canMeetNeeds(players.map(({ id, min }) => ({ id, need: min })), [1, 1], canPlay)).toBe(true);
  });

  it("상한 합이 채울 인원보다 적으면 불가능하다", () => {
    expect(canMeetBounds([{ id: "a", min: 0, max: 1 }], [1, 1], anywhere)).toBe(false);
  });

  it("하한 합이 채울 인원보다 많으면 불가능하다", () => {
    expect(canMeetBounds([{ id: "a", min: 2, max: 2 }, { id: "b", min: 1, max: 1 }], [1, 1], anywhere)).toBe(
      false,
    );
  });

  it("상한이 하한보다 작으면 불가능하다", () => {
    expect(canMeetBounds([{ id: "a", min: 1, max: 0 }], [1], anywhere)).toBe(false);
  });

  it("한 사람이 한 쿼터에 두 번 들어갈 수는 없다", () => {
    expect(canMeetBounds([{ id: "a", min: 2, max: 2 }], [2], anywhere)).toBe(false);
  });
});
