import { describe, expect, it } from "vitest";
import { passwordChangeFailure, validatePasswordChange } from "./passwordChange";

describe("비밀번호 바꾸기 검증", () => {
  it("두 칸이 같고 8자 이상이면 통과한다", () => {
    expect(validatePasswordChange({ password: "newpass12", passwordConfirm: "newpass12" })).toEqual({
      ok: true,
      value: "newpass12",
    });
  });

  it("짧으면 비밀번호 칸에 알려준다", () => {
    expect(validatePasswordChange({ password: "short", passwordConfirm: "short" })).toEqual({
      ok: false,
      errors: { password: "비밀번호는 8자 이상이에요." },
    });
  });

  it("두 칸이 다르면 확인 칸에 알려준다", () => {
    expect(validatePasswordChange({ password: "newpass12", passwordConfirm: "newpass13" })).toEqual({
      ok: false,
      errors: { passwordConfirm: "비밀번호가 서로 달라요." },
    });
  });
});

describe("비밀번호 바꾸기 실패 안내 (Supabase Auth 오류 코드)", () => {
  it("지금 비밀번호와 같으면 그렇게 말한다", () => {
    expect(passwordChangeFailure("same_password")).toEqual({ errors: { password: "지금 비밀번호와 같아요." } });
  });

  it("쉬운 비밀번호는 비밀번호 칸에 알려준다", () => {
    expect(passwordChangeFailure("weak_password")).toEqual({
      errors: { password: "비밀번호가 너무 쉬워요. 다른 비밀번호를 써 주세요." },
    });
  });

  it("다시 로그인해야 하면 그렇게 말한다", () => {
    expect(passwordChangeFailure("reauthentication_needed").message).toBe(
      "로그인한 지 오래돼서 바꾸지 못했어요. 로그아웃했다가 다시 로그인한 뒤 바꿔 주세요.",
    );
  });

  it("그 밖에는 일반 안내", () => {
    expect(passwordChangeFailure(undefined).message).toBe("비밀번호를 바꾸지 못했어요. 잠시 뒤 다시 시도해 주세요.");
  });
});
