import { describe, expect, it } from "vitest";
import { squadStatus, SQUAD_STATUS_LABELS } from "./squadStatus";

describe("매치의 스쿼드 상태 (관리 › 스쿼드)", () => {
  it("저장한 스쿼드가 없으면 짜기 전이다", () => {
    expect(squadStatus({ hasSquad: false, squadPublishedAt: null })).toBe("none");
  });

  it("저장했지만 공개 전이면 저장됨이다", () => {
    expect(squadStatus({ hasSquad: true, squadPublishedAt: null })).toBe("saved");
  });

  it("공개했으면 공개됨이다", () => {
    expect(squadStatus({ hasSquad: true, squadPublishedAt: "2026-10-24T01:00:00Z" })).toBe("published");
  });

  it("공개 표시만 남고 스쿼드가 없으면 짜기 전으로 본다 — 팀원에게 보일 게 없다", () => {
    expect(squadStatus({ hasSquad: false, squadPublishedAt: "2026-10-24T01:00:00Z" })).toBe("none");
  });

  it("화면에 쓸 말이 있다", () => {
    expect(SQUAD_STATUS_LABELS).toEqual({ none: "짜기 전", saved: "저장됨 · 공개 전", published: "공개됨" });
  });
});
