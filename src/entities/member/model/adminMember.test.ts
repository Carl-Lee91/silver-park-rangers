import { describe, expect, it } from "vitest";
import { attachLogins, groupForAdmin, loginNote, regularMembers, takenJerseyNumbers, toAdminMember, type AdminMember } from "./adminMember";

const row = {
  id: "00000000-0000-0000-0000-000000000001",
  real_name: "김운영",
  feet: ["right"],
  preferred_positions: ["MF", "CB", "WB"],
  role: "user",
  status: "approved",
  jersey_number: null,
  created_at: "2026-10-19T01:00:00+00:00",
  member_admin_info: { member_type: "guest" },
  match_guests: null,
};

describe("관리 화면용 멤버", () => {
  it("멤버/용병 구분과 신청 시각을 함께 읽는다", () => {
    expect(toAdminMember(row)).toMatchObject({
      realName: "김운영",
      memberType: "guest",
      createdAt: "2026-10-19T01:00:00+00:00",
    });
  });

  it("그날 용병이면 그 매치 id 를 읽는다", () => {
    expect(toAdminMember(row).guestMatchId).toBeNull();
    expect(toAdminMember({ ...row, match_guests: { match_id: "m1" } }).guestMatchId).toBe("m1");
    expect(toAdminMember({ ...row, match_guests: [{ match_id: "m1" }] }).guestMatchId).toBe("m1");
  });

  it("이메일은 따로 읽어 붙인다 — 처음엔 없다", () => {
    expect(toAdminMember(row).email).toBeNull();
    expect(toAdminMember(row).login).toBeNull();
  });

  it("구분이 아직 없으면(가입 대기) null 이다", () => {
    expect(toAdminMember({ ...row, member_admin_info: null }).memberType).toBeNull();
  });

  it("구분이 배열로 와도 읽는다", () => {
    expect(toAdminMember({ ...row, member_admin_info: [{ member_type: "member" }] }).memberType).toBe("member");
    expect(toAdminMember({ ...row, member_admin_info: [] }).memberType).toBeNull();
  });
});

describe("관리 화면 묶음", () => {
  const make = (overrides: Partial<AdminMember>): AdminMember => ({
    id: overrides.realName ?? "id",
    realName: "이름",
    feet: ["right"],
    preferredPositions: ["MF", "CB", "WB"],
    role: "user",
    status: "approved",
    memberType: "member",
    jerseyNumber: null,
    guestMatchId: null,
    email: null,
    login: null,
    createdAt: "2026-10-19T00:00:00Z",
    ...overrides,
  });

  it("상태별로 나눈다", () => {
    const groups = groupForAdmin([
      make({ realName: "대기", status: "pending", memberType: null }),
      make({ realName: "승인", status: "approved" }),
      make({ realName: "휴면", status: "inactive" }),
      make({ realName: "거절", status: "rejected", memberType: null }),
    ]);
    expect(groups.pending.map((m) => m.realName)).toEqual(["대기"]);
    expect(groups.approved.map((m) => m.realName)).toEqual(["승인"]);
    expect(groups.inactive.map((m) => m.realName)).toEqual(["휴면"]);
    expect(groups.rejected.map((m) => m.realName)).toEqual(["거절"]);
  });

  it("가입 신청은 먼저 온 순서다", () => {
    const groups = groupForAdmin([
      make({ realName: "늦게", status: "pending", createdAt: "2026-10-19T09:00:00Z" }),
      make({ realName: "일찍", status: "pending", createdAt: "2026-10-19T08:00:00Z" }),
    ]);
    expect(groups.pending.map((m) => m.realName)).toEqual(["일찍", "늦게"]);
  });

  it("그날 용병은 멤버 관리 묶음에 넣지 않는다 — 매치 화면에서만 다룬다", () => {
    const groups = groupForAdmin([make({ realName: "멤버" }), make({ realName: "그날", guestMatchId: "m1" })]);
    expect(groups.approved.map((m) => m.realName)).toEqual(["멤버"]);
  });

  it("멤버는 관리자 먼저, 그다음 이름순이다", () => {
    const groups = groupForAdmin([
      make({ realName: "하멤버" }),
      make({ realName: "가멤버" }),
      make({ realName: "나관리", role: "admin" }),
    ]);
    expect(groups.approved.map((m) => m.realName)).toEqual(["나관리", "가멤버", "하멤버"]);
  });
});

describe("매치마다 볼 사람", () => {
  const make = (realName: string, guestMatchId: string | null, status: AdminMember["status"] = "approved") =>
    ({ id: realName, realName, status, guestMatchId }) as AdminMember;

  it("승인된 사람 중 그날 용병은 그 매치 사람만 남긴다", () => {
    const members = [make("멤버", null), make("이번", "m1"), make("지난", "m0"), make("대기", null, "pending")];
    expect(regularMembers(members, "m1").map((m) => m.realName)).toEqual(["멤버", "이번"]);
  });

  it("매치를 정하지 않으면 그날 용병을 모두 뺀다", () => {
    expect(regularMembers([make("멤버", null), make("이번", "m1")]).map((m) => m.realName)).toEqual(["멤버"]);
  });
});

describe("로그인 방법 (PLAN.md §4 개인 링크)", () => {
  const member = toAdminMember(row);

  it("이메일로 가입한 사람은 이메일을 붙이고 email 로 본다", () => {
    const [result] = attachLogins([member], [{ member_id: member.id, email: "kim@example.com", via_link: false }]);
    expect(result).toMatchObject({ email: "kim@example.com", login: "email" });
  });

  it("링크로 들어온 사람은 link 다 — 메일이 가지 않는 표시용 주소는 보이지 않는다", () => {
    const [result] = attachLogins([member], [{ member_id: member.id, email: `${member.id}@link.invalid`, via_link: true }]);
    expect(result).toMatchObject({ email: null, login: "link" });
  });

  it("아직 계정이 없으면(관리자가 등록만 했다) 둘 다 없다", () => {
    const [result] = attachLogins([member], []);
    expect(result).toMatchObject({ email: null, login: null });
  });
});

describe("멤버 목록의 로그인 줄", () => {
  const member = toAdminMember(row);

  it("이메일 · 개인 링크 · 아직 안 들어옴을 알려 준다", () => {
    expect(loginNote({ ...member, email: "kim@example.com", login: "email" })).toBe("kim@example.com");
    expect(loginNote({ ...member, login: "link" })).toBe("개인 링크로 들어옴");
    expect(loginNote({ ...member, login: null })).toBe("아직 안 들어옴 · 개인 링크를 보내 주세요");
  });
});

describe("등록 · 고치기에서 고를 수 없는 등번호", () => {
  const people = [
    { ...toAdminMember(row), id: "a", jerseyNumber: 7 },
    { ...toAdminMember(row), id: "b", jerseyNumber: 10 },
    { ...toAdminMember(row), id: "c", jerseyNumber: null },
    { ...toAdminMember(row), id: "g", jerseyNumber: 9, guestMatchId: "m1" },
  ];

  it("누가 쓰는 번호다 — 그날 용병 번호는 겹쳐도 돼서 뺀다", () => {
    expect(takenJerseyNumbers(people)).toEqual([7, 10]);
  });

  it("고칠 때는 그 사람 번호를 뺀다", () => {
    expect(takenJerseyNumbers(people, "a")).toEqual([10]);
  });
});
