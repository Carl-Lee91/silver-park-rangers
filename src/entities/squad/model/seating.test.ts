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

  it("선호 점수가 같으면 그 자리의 포지션 점수(능력치) 합이 큰 쪽으로 앉힌다", () => {
    // 어느 쪽이든 선호 합은 3 + 2 = 5 다. a 는 풀백, b 는 센터백 능력치가 좋다.
    const seats = seatByPreference(
      [
        { id: "a", preferredPositions: ["FB", "CB"], positionScores: { FB: 8, CB: 5 } },
        { id: "b", preferredPositions: ["FB", "CB"], positionScores: { FB: 5, CB: 8 } },
      ],
      ["CB", "FB"],
    );
    expect(seats).toEqual(["b", "a"]);
  });

  it("🔴 선호 우선 — 능력치가 아무리 차이 나도 선호 점수 합을 줄이지 않는다", () => {
    // a 는 센터백 1순위, b 는 풀백 1순위. 능력치만 보면 서로 바꾸는 게 낫지만 선호가 먼저다.
    const seats = seatByPreference(
      [
        { id: "a", preferredPositions: ["CB", "FB"], positionScores: { CB: 2, FB: 9 } },
        { id: "b", preferredPositions: ["FB", "CB"], positionScores: { CB: 9, FB: 2 } },
      ],
      ["CB", "FB"],
    );
    expect(seats).toEqual(["a", "b"]);
  });

  it("사람이 자리보다 많고 선호가 같으면 포지션 점수가 높은 사람이 앉는다", () => {
    const seats = seatByPreference(
      [
        { id: "weak", preferredPositions: ["FW"], positionScores: { FW: 4 } },
        { id: "strong", preferredPositions: ["FW"], positionScores: { FW: 8 } },
      ],
      ["FW"],
    );
    expect(seats).toEqual(["strong"]);
  });

  it("아무도 없으면 모두 빈자리다", () => {
    expect(seatByPreference([], ["FW", "CB"])).toEqual([null, null]);
  });
});
