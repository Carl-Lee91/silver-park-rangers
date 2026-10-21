import { describe, expect, it } from "vitest";
import { readProfileForm, validateProfile } from "./profileSchema";

describe("내 정보 수정", () => {
  it("올바르면 저장할 값을 돌려준다", () => {
    expect(validateProfile({ feet: ["right"], preferredPositions: ["CB", "WB", "MF"], jerseyNumber: "7" })).toEqual({
      ok: true,
      value: { feet: ["right"], preferredPositions: ["CB", "WB", "MF"], jerseyNumber: 7 },
    });
  });

  it("틀리면 칸마다 이유를 준다", () => {
    expect(validateProfile({ feet: [], preferredPositions: [], jerseyNumber: "" })).toEqual({
      ok: false,
      errors: { feet: "주로 쓰는 발을 골라 주세요.", preferredPositions: "선호 포지션을 3개 골라 주세요." },
    });
  });

  it("폼에서 고른 순서대로 읽는다", () => {
    const data = new FormData();
    data.append("feet", "left");
    data.append("preferredPositions", "FW");
    data.append("preferredPositions", "CB");
    data.append("jerseyNumber", "10");
    expect(readProfileForm(data)).toEqual({ feet: ["left"], preferredPositions: ["FW", "CB"], jerseyNumber: "10" });
  });

  it("등번호는 비워도 되고(없음), 0~99 정수만 받는다", () => {
    const base = { feet: ["left"], preferredPositions: ["GK"] };
    expect(validateProfile({ ...base, jerseyNumber: "" })).toMatchObject({ ok: true, value: { jerseyNumber: null } });
    expect(validateProfile({ ...base, jerseyNumber: "0" })).toMatchObject({ ok: true, value: { jerseyNumber: 0 } });
    expect(validateProfile({ ...base, jerseyNumber: "100" })).toEqual({
      ok: false,
      errors: { jerseyNumber: "등번호는 0~99 사이로 골라 주세요." },
    });
  });
});
