import { describe, expect, it } from "vitest";
import { groupForAdmin, toAdminMember, type AdminMember } from "./adminMember";

const row = {
  id: "00000000-0000-0000-0000-000000000001",
  real_name: "김운영",
  kakao_nickname: "운영카톡",
  avatar_url: null,
  feet: ["right"],
  preferred_positions: ["MF"],
  role: "user",
  status: "approved",
  jersey_number: null,
  created_at: "2026-10-19T01:00:00+00:00",
  member_admin_info: { member_type: "guest" },
};

describe("관리 화면용 멤버", () => {
  it("멤버/용병 구분과 신청 시각을 함께 읽는다", () => {
    expect(toAdminMember(row)).toMatchObject({
      realName: "김운영",
      memberType: "guest",
      createdAt: "2026-10-19T01:00:00+00:00",
    });
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
    kakaoNickname: null,
    avatarUrl: null,
    feet: ["right"],
    preferredPositions: ["MF"],
    role: "user",
    status: "approved",
    memberType: "member",
    jerseyNumber: null,
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

  it("멤버는 관리자 먼저, 그다음 이름순이다", () => {
    const groups = groupForAdmin([
      make({ realName: "하멤버" }),
      make({ realName: "가멤버" }),
      make({ realName: "나관리", role: "admin" }),
    ]);
    expect(groups.approved.map((m) => m.realName)).toEqual(["나관리", "가멤버", "하멤버"]);
  });
});
