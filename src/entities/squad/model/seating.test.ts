import { describe, expect, it } from "vitest";
import { seatByPreference } from "./seating";

describe("선호 포지션에 맞게 앉히기", () => {
  it("선호 점수 합이 가장 크게 앉힌다", () => {
    // a 를 FW 에 앉히면 b 는 CB(0점)로 밀린다. a 가 2순위 CB 로 가는 쪽이 합이 크다.
    const seats = seatByPreference(
      [
        { id: "a", preferredPositions: ["FW", "CB"] },
        { id: "b", preferredPositions: ["FW"] },
      ],
      ["FW", "CB"],
    );
    expect(seats).toEqual(["b", "a"]);
  });

  it("사람이 자리보다 적으면 남는 자리는 비운다", () => {
    expect(seatByPreference([{ id: "a", preferredPositions: ["CB"] }], ["FW", "CB", "MF"])).toEqual([null, "a", null]);
  });

  it("사람이 자리보다 많으면 점수 합이 가장 큰 사람들을 앉히고 나머지는 앉히지 않는다", () => {
    const seats = seatByPreference(
      [
        { id: "cb", preferredPositions: ["CB"] },
        { id: "mf", preferredPositions: ["MF"] },
        { id: "fw", preferredPositions: ["FW"] },
      ],
      ["FW", "MF"],
    );
    expect(seats).toEqual(["fw", "mf"]);
  });

  it("아무도 없으면 모두 빈자리다", () => {
    expect(seatByPreference([], ["FW", "CB"])).toEqual([null, null]);
  });
});
