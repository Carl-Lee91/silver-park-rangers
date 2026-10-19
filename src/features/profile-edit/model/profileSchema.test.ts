import { describe, expect, it } from "vitest";
import { readProfileForm, validateProfile } from "./profileSchema";

describe("내 정보 수정", () => {
  it("올바르면 저장할 값을 돌려준다", () => {
    expect(validateProfile({ feet: ["right"], preferredPositions: ["CB", "WB"] })).toEqual({
      ok: true,
      value: { feet: ["right"], preferredPositions: ["CB", "WB"] },
    });
  });

  it("틀리면 칸마다 이유를 준다", () => {
    expect(validateProfile({ feet: [], preferredPositions: [] })).toEqual({
      ok: false,
      errors: { feet: "주로 쓰는 발을 골라 주세요.", preferredPositions: "선호 포지션을 하나 이상 골라 주세요." },
    });
  });

  it("폼에서 고른 순서대로 읽는다", () => {
    const data = new FormData();
    data.append("feet", "left");
    data.append("preferredPositions", "FW");
    data.append("preferredPositions", "CB");
    expect(readProfileForm(data)).toEqual({ feet: ["left"], preferredPositions: ["FW", "CB"] });
  });
});
