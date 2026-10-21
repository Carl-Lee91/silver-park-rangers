import { describe, expect, it } from "vitest";
import { passwordLoginErrorMessage, readPasswordLogin } from "./passwordLogin";

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
};

describe("로그인 입력", () => {
  it("이메일 앞뒤 공백을 지우고 비밀번호는 그대로 둔다", () => {
    expect(readPasswordLogin(form({ email: "  kim@team.kr ", password: " pass " }))).toEqual({
      ok: true,
      value: { email: "kim@team.kr", password: " pass " },
    });
  });

  it("둘 중 하나라도 비면 알려준다", () => {
    expect(readPasswordLogin(form({ email: "", password: "x" }))).toEqual({
      ok: false,
      error: "이메일과 비밀번호를 입력해 주세요.",
    });
    expect(readPasswordLogin(form({ email: "a@b.c" })).ok).toBe(false);
  });
});

describe("로그인 실패 안내", () => {
  it("이메일·비밀번호가 틀리면 그렇게 말한다", () => {
    expect(passwordLoginErrorMessage("invalid_credentials")).toBe("이메일 또는 비밀번호가 맞지 않아요.");
  });

  it("너무 자주 시도하면 잠시 기다리라고 한다", () => {
    expect(passwordLoginErrorMessage("over_request_rate_limit")).toBe(
      "시도가 너무 많아요. 잠시 뒤 다시 시도해 주세요.",
    );
  });

  it("이메일 확인이 안 된 계정이면 관리자에게 알리라고 한다 — 이메일 확인은 꺼 둬야 한다", () => {
    expect(passwordLoginErrorMessage("email_not_confirmed")).toBe(
      "이메일 확인이 안 된 계정이에요. 관리자에게 알려 주세요.",
    );
  });

  it("그 밖에는 일반 안내", () => {
    expect(passwordLoginErrorMessage(undefined)).toBe("로그인하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
  });
});
