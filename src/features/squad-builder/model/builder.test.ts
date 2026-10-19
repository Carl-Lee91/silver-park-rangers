import { describe, expect, it } from "vitest";
import type { Formation } from "@/entities/formation";
import {
  applyFormation,
  applyLineup,
  copyQuarter,
  handleTap,
  initialBuilder,
  placeMember,
  removeMember,
  toLineup,
  toSavePayload,
  toSquadQuarters,
  type Builder,
} from "./builder";

const F442: Formation = {
  id: "f442",
  name: "4-4-2",
  isPreset: true,
  slots: [
    { position: "GK", x: 50, y: 92 },
    { position: "CB", x: 37, y: 78 },
    { position: "MF", x: 37, y: 52 },
    { position: "FW", x: 37, y: 20 },
  ],
};

const F_OTHER: Formation = {
  id: "fx",
  name: "다른",
  isPreset: false,
  slots: [
    { position: "FW", x: 50, y: 18 },
    { position: "GK", x: 50, y: 92 },
    { position: "MF", x: 50, y: 52 },
  ],
};

const filled = (...members: (string | null)[]): Builder =>
  initialBuilder(1, [], F442).map((quarter) => ({
    ...quarter,
    slots: quarter.slots.map((slot, index) => ({ ...slot, memberId: members[index] ?? null })),
  }));

const membersOf = (builder: Builder, quarter = 0) => builder[quarter].slots.map((slot) => slot.memberId);

describe("처음 상태", () => {
  it("저장된 쿼터는 그대로, 없는 쿼터는 기본 포메이션으로 빈 채 시작한다", () => {
    const builder = initialBuilder(
      2,
      [
        {
          number: 2,
          formationName: "저장된",
          slots: [{ slotIndex: 0, position: "GK", x: 50, y: 90, memberId: "k", memberName: "키퍼" }],
        },
      ],
      F442,
    );
    expect(builder[0]).toMatchObject({ formationName: "4-4-2" });
    expect(membersOf(builder, 0)).toEqual([null, null, null, null]);
    expect(builder[1]).toEqual({
      formationName: "저장된",
      slots: [{ position: "GK", x: 50, y: 90, memberId: "k" }],
    });
  });
});

describe("선수 넣고 빼기", () => {
  it("벤치에서 빈자리에 넣는다", () => {
    expect(membersOf(placeMember(filled(), 0, "a", 1))).toEqual([null, "a", null, null]);
  });

  it("벤치에서 찬 자리에 넣으면 있던 사람은 벤치로 간다", () => {
    expect(membersOf(placeMember(filled(null, "b"), 0, "a", 1))).toEqual([null, "a", null, null]);
  });

  it("이미 뛰는 사람을 다른 자리로 옮기면 서로 바꾼다", () => {
    expect(membersOf(placeMember(filled("k", "a", "b"), 0, "a", 2))).toEqual(["k", "b", "a", null]);
  });

  it("빈자리로 옮기면 원래 자리는 빈다", () => {
    expect(membersOf(placeMember(filled(null, "a"), 0, "a", 3))).toEqual([null, null, null, "a"]);
  });

  it("빼면 그 자리가 빈다", () => {
    expect(membersOf(removeMember(filled("k", "a"), 0, 1))).toEqual(["k", null, null, null]);
  });
});

describe("탭으로 고르고 놓기", () => {
  it("벤치 선수를 고르고 자리를 누르면 넣는다", () => {
    const first = handleTap(filled(), 0, null, { kind: "bench", memberId: "a" });
    expect(first.selection).toEqual({ kind: "bench", memberId: "a" });
    const second = handleTap(first.builder, 0, first.selection, { kind: "slot", index: 2 });
    expect(membersOf(second.builder)).toEqual([null, null, "a", null]);
    expect(second.selection).toBeNull();
  });

  it("자리를 먼저 고르고 벤치 선수를 눌러도 넣는다", () => {
    const first = handleTap(filled(), 0, null, { kind: "slot", index: 1 });
    const second = handleTap(first.builder, 0, first.selection, { kind: "bench", memberId: "a" });
    expect(membersOf(second.builder)).toEqual([null, "a", null, null]);
  });

  it("뛰는 사람을 고르고 다른 자리를 누르면 서로 바꾼다", () => {
    const first = handleTap(filled("k", "a", "b"), 0, null, { kind: "slot", index: 1 });
    const second = handleTap(first.builder, 0, first.selection, { kind: "slot", index: 2 });
    expect(membersOf(second.builder)).toEqual(["k", "b", "a", null]);
  });

  it("빈자리를 고르고 뛰는 사람을 누르면 그 사람이 빈자리로 온다", () => {
    const first = handleTap(filled(null, "a"), 0, null, { kind: "slot", index: 3 });
    const second = handleTap(first.builder, 0, first.selection, { kind: "slot", index: 1 });
    expect(membersOf(second.builder)).toEqual([null, null, null, "a"]);
  });

  it("같은 것을 다시 누르면 고르기를 푼다", () => {
    const first = handleTap(filled(), 0, null, { kind: "slot", index: 1 });
    expect(handleTap(first.builder, 0, first.selection, { kind: "slot", index: 1 }).selection).toBeNull();
    const bench = handleTap(filled(), 0, null, { kind: "bench", memberId: "a" });
    expect(handleTap(bench.builder, 0, bench.selection, { kind: "bench", memberId: "a" }).selection).toBeNull();
  });
});

describe("포메이션 바꾸기", () => {
  const preferences = (id: string) =>
    ({ k: ["GK"], cb: ["CB"], mf: ["MF"], fw: ["FW"] })[id] as ("GK" | "CB" | "MF" | "FW")[];

  it("키퍼는 키퍼 자리에, 필드 선수는 선호 포지션에 맞게 다시 앉힌다", () => {
    const builder = applyFormation(filled("k", "cb", "mf", "fw"), 0, F_OTHER, preferences);
    expect(builder[0].formationName).toBe("다른");
    // 새 포메이션: FW, GK, MF — 자리가 둘뿐이라 필드 선수 하나는 벤치로 간다.
    expect(builder[0].slots[1].memberId).toBe("k");
    expect([builder[0].slots[0].memberId, builder[0].slots[2].memberId].sort()).toEqual(["fw", "mf"]);
  });
});

describe("이전 쿼터 복사", () => {
  it("포메이션과 배치를 복사하고, 그 쿼터에 못 오는 사람은 뺀다", () => {
    const two = [...filled("k", "a", "b"), ...filled()];
    const copied = copyQuarter(two, 0, 1, (memberId) => memberId !== "b");
    expect(membersOf(copied, 1)).toEqual(["k", "a", null, null]);
    expect(membersOf(copied, 0)).toEqual(["k", "a", "b", null]);
  });
});

describe("자동 배치와 저장", () => {
  it("자동 배치 결과를 키퍼 자리와 필드 자리에 넣는다", () => {
    const builder = applyLineup(filled(), [{ keeperId: "k", fieldIds: ["a", null, "b"] }]);
    expect(membersOf(builder)).toEqual(["k", "a", null, "b"]);
  });

  it("자동 배치에 넘길 모양으로 바꾼다 — 키퍼 자리는 따로 뺀다", () => {
    const builder = filled("k", "a", null, "b");
    expect(toSquadQuarters(builder)).toEqual([{ fieldSlots: ["CB", "MF", "FW"] }]);
    expect(toLineup(builder)).toEqual([{ keeperId: "k", fieldIds: ["a", null, "b"] }]);
  });

  it("키퍼 자리가 없는 포메이션은 키퍼가 없다", () => {
    const builder: Builder = [{ formationName: "x", slots: [{ position: "FW", x: 50, y: 20, memberId: "a" }] }];
    expect(toLineup(builder)).toEqual([{ keeperId: null, fieldIds: ["a"] }]);
  });

  it("저장할 모양(save_squad)으로 바꾼다", () => {
    expect(toSavePayload(filled("k"))).toEqual([
      {
        number: 1,
        formation_name: "4-4-2",
        slots: [
          { slot_index: 0, position: "GK", x: 50, y: 92, member_id: "k" },
          { slot_index: 1, position: "CB", x: 37, y: 78, member_id: null },
          { slot_index: 2, position: "MF", x: 37, y: 52, member_id: null },
          { slot_index: 3, position: "FW", x: 37, y: 20, member_id: null },
        ],
      },
    ]);
  });
});
