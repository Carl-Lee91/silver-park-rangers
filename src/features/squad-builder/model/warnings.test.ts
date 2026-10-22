import { describe, expect, it } from "vitest";
import type { SquadWarning } from "@/entities/squad";
import { groupWarnings } from "./warnings";

const nameOf = (id: string) => ({ a: "이일찍", b: "정수비", c: "강센터" })[id] ?? id;

describe("확인할 것 묶기 — 20줄씩 늘어지지 않게", () => {
  it("키퍼가 빈 쿼터는 한 줄로 모은다", () => {
    const warnings: SquadWarning[] = [2, 3, 5].map((quarter) => ({ kind: "keeper-missing", quarter }));
    expect(groupWarnings(warnings, nameOf)).toEqual([{ title: "키퍼가 빈 쿼터: 3 · 4 · 6쿼터", details: [] }]);
  });

  it("필드가 모자란 쿼터와 보장을 못 채운 사람은 몇 개·몇 명인지 묶고, 펼치면 하나씩 본다", () => {
    const warnings: SquadWarning[] = [
      { kind: "field-short", quarter: 2, emptySlots: 10 },
      { kind: "field-short", quarter: 3, emptySlots: 4 },
      { kind: "below-guarantee", playerId: "a", guaranteed: 3, played: 1 },
      { kind: "below-guarantee", playerId: "b", guaranteed: 3, played: 2 },
    ];
    expect(groupWarnings(warnings, nameOf)).toEqual([
      { title: "필드가 모자란 쿼터 2개", details: ["3쿼터 10자리", "4쿼터 4자리"] },
      { title: "보장 출전을 못 채운 사람 2명", details: ["이일찍 1/3쿼터", "정수비 2/3쿼터"] },
    ]);
  });

  it("하나뿐이면 묶지 않고 그 문장을 그대로 쓴다", () => {
    const warnings: SquadWarning[] = [
      { kind: "field-short", quarter: 0, emptySlots: 1 },
      { kind: "below-guarantee", playerId: "c", guaranteed: 3, played: 2 },
    ];
    expect(groupWarnings(warnings, nameOf)).toEqual([
      { title: "1쿼터 필드가 1자리 비었어요.", details: [] },
      { title: "강센터님은 보장 3쿼터 중 2쿼터만 뛰어요.", details: [] },
    ]);
  });

  it("점검이 못 보는 배치 문제(불참·못 오는 쿼터·겹친 번호)는 그대로 뒤에 붙인다", () => {
    expect(groupWarnings([], nameOf, ["박조퇴님은 4쿼터에 못 와요."])).toEqual([
      { title: "박조퇴님은 4쿼터에 못 와요.", details: [] },
    ]);
  });
});
