import { describe, expect, it } from "vitest";
import { readSignUpForm, signUpFailure, toSignUpMetadata, validateSignUp } from "./signUpSchema";

const valid = {
  email: " Kim@Team.kr ",
  password: "password1",
  passwordConfirm: "password1",
  realName: " 김운영 ",
  feet: ["right"],
  preferredPositions: ["MF", "CB", "WB"],
  jerseyNumber: "7",
};

describe("가입 신청 검증 (PLAN.md §5)", () => {
  it("올바르면 다듬은 값을 돌려준다", () => {
    expect(validateSignUp(valid)).toEqual({
      ok: true,
      value: {
        email: "Kim@Team.kr",
        password: "password1",
        realName: "김운영",
        feet: ["right"],
        preferredPositions: ["MF", "CB", "WB"],
        jerseyNumber: 7,
      },
    });
  });

  it("등번호는 비워도 된다", () => {
    const result = validateSignUp({ ...valid, jerseyNumber: "" });
    expect(result.ok && result.value.jerseyNumber).toBeNull();
  });

  it("1순위 골키퍼는 골키퍼 하나로 신청한다", () => {
    expect(validateSignUp({ ...valid, preferredPositions: ["GK"] }).ok).toBe(true);
  });

  it("이메일 형식이 아니면 거부한다", () => {
    expect(validateSignUp({ ...valid, email: "kim" })).toEqual({
      ok: false,
      errors: { email: "이메일 형식이 맞지 않아요." },
    });
  });

  it("비밀번호는 8자 이상이다", () => {
    expect(validateSignUp({ ...valid, password: "short1", passwordConfirm: "short1" })).toEqual({
      ok: false,
      errors: { password: "비밀번호는 8자 이상이에요." },
    });
  });

  it("비밀번호 두 칸이 다르면 알려준다", () => {
    expect(validateSignUp({ ...valid, passwordConfirm: "password2" })).toEqual({
      ok: false,
      errors: { passwordConfirm: "비밀번호가 서로 달라요." },
    });
  });

  it("비밀번호는 공백까지 그대로 쓴다", () => {
    const result = validateSignUp({ ...valid, password: " spaced pw ", passwordConfirm: " spaced pw " });
    expect(result.ok && result.value.password).toBe(" spaced pw ");
  });

  it("포지션이 3개가 아니면 그 칸에 알려준다", () => {
    expect(validateSignUp({ ...valid, preferredPositions: ["MF"] })).toEqual({
      ok: false,
      errors: { preferredPositions: "선호 포지션을 3개 골라 주세요." },
    });
  });

  it("틀린 곳이 여럿이면 전부 알려준다", () => {
    const result = validateSignUp({
      email: "",
      password: "",
      passwordConfirm: "",
      realName: "",
      feet: [],
      preferredPositions: [],
      jerseyNumber: "100",
    });
    expect(result.ok).toBe(false);
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual(
      ["email", "feet", "jerseyNumber", "password", "preferredPositions", "realName"].sort(),
    );
  });
});

describe("DB 에 실어 보낼 신청 정보", () => {
  it("DB 트리거(create_member_from_signup)가 읽는 이름으로 보낸다", () => {
    expect(
      toSignUpMetadata({
        email: "a@b.kr",
        password: "password1",
        realName: "김운영",
        feet: ["left"],
        preferredPositions: ["GK"],
        jerseyNumber: null,
      }),
    ).toEqual({ real_name: "김운영", feet: ["left"], preferred_positions: ["GK"], jersey_number: null });
  });
});

describe("폼 데이터 읽기", () => {
  it("선호 포지션은 고른 순서를 지킨다", () => {
    const data = new FormData();
    for (const [key, value] of [
      ["email", "a@b.kr"],
      ["password", "p"],
      ["passwordConfirm", "p"],
      ["realName", "김"],
      ["feet", "left"],
      ["preferredPositions", "CB"],
      ["preferredPositions", "FW"],
      ["jerseyNumber", "9"],
    ]) {
      data.append(key, value);
    }
    expect(readSignUpForm(data)).toEqual({
      email: "a@b.kr",
      password: "p",
      passwordConfirm: "p",
      realName: "김",
      feet: ["left"],
      preferredPositions: ["CB", "FW"],
      jerseyNumber: "9",
    });
  });
});

describe("가입 실패 안내 (Supabase Auth 오류 코드)", () => {
  it("이미 가입한 이메일이면 이메일 칸에 알려준다", () => {
    expect(signUpFailure("user_already_exists")).toEqual({
      errors: { email: "이미 가입한 이메일이에요. 로그인해 주세요." },
    });
    expect(signUpFailure("email_exists")).toEqual({ errors: { email: "이미 가입한 이메일이에요. 로그인해 주세요." } });
  });

  it("쉬운 비밀번호는 비밀번호 칸에 알려준다", () => {
    expect(signUpFailure("weak_password").errors?.password).toBe("비밀번호가 너무 쉬워요. 다른 비밀번호를 써 주세요.");
  });

  it("DB 가 신청 정보를 거부하면(등번호가 방금 다른 사람에게 갔을 때 등) 다시 고르라고 한다", () => {
    expect(signUpFailure("unexpected_failure").message).toBe(
      "가입 정보를 저장하지 못했어요. 등번호가 방금 다른 사람에게 갔을 수 있어요. 다른 번호로 다시 신청해 주세요.",
    );
  });

  it("가입이 꺼져 있으면 그렇게 말한다", () => {
    expect(signUpFailure("signup_disabled").message).toBe("지금은 가입 신청을 받지 않아요. 관리자에게 알려 주세요.");
  });

  it("너무 자주 시도하면 잠시 기다리라고 한다", () => {
    expect(signUpFailure("over_request_rate_limit").message).toBe("시도가 너무 많아요. 잠시 뒤 다시 시도해 주세요.");
  });

  it("그 밖에는 일반 안내", () => {
    expect(signUpFailure(undefined).message).toBe("가입 신청을 보내지 못했어요. 잠시 뒤 다시 시도해 주세요.");
  });
});
