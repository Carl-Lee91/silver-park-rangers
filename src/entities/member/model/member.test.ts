import { describe, expect, it } from "vitest";
import { FEET, footLabel, toMember } from "./member";

describe("주발", () => {
  it("왼발·오른발 둘이다", () => {
    expect(FEET.map((foot) => foot.code)).toEqual(["left", "right"]);
    expect(footLabel("left")).toBe("왼발");
  });
});

describe("DB 행 → 멤버", () => {
  const row = {
    id: "00000000-0000-0000-0000-000000000001",
    real_name: "김운영",
    kakao_nickname: "운영카톡",
    avatar_url: null,
    feet: ["right"],
    preferred_positions: ["MF", "CB"],
    role: "user",
    status: "pending",
  };

  it("화면이 쓰는 이름으로 바꾼다", () => {
    expect(toMember(row)).toEqual({
      id: row.id,
      realName: "김운영",
      kakaoNickname: "운영카톡",
      avatarUrl: null,
      feet: ["right"],
      preferredPositions: ["MF", "CB"],
      role: "user",
      status: "pending",
    });
  });

  it("모르는 값이 오면 조용히 넘기지 않는다", () => {
    expect(() => toMember({ ...row, status: "deleted" })).toThrowError();
    expect(() => toMember({ ...row, preferred_positions: ["ST"] })).toThrowError();
  });
});
