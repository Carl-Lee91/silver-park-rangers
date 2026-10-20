import { describe, expect, it } from "vitest";
import { parseEnv, parseServerEnv } from "./env";

const valid = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
};

describe("공개 환경변수", () => {
  it("값이 다 있으면 그대로 돌려준다", () => {
    expect(parseEnv(valid)).toEqual(valid);
  });

  it("빠진 변수의 이름을 메시지에 남긴다", () => {
    expect(() => parseEnv({ ...valid, NEXT_PUBLIC_SUPABASE_URL: undefined })).toThrowError(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it("빈 문자열은 값이 없는 것으로 본다", () => {
    expect(() => parseEnv({ ...valid, NEXT_PUBLIC_SUPABASE_ANON_KEY: "" })).toThrowError(
      /NEXT_PUBLIC_SUPABASE_ANON_KEY/,
    );
  });

  it("여러 개가 빠지면 한 번에 알려준다", () => {
    expect(() => parseEnv({})).toThrowError(/NEXT_PUBLIC_SUPABASE_URL.*NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });
});

describe("서버 전용 환경변수", () => {
  it("끝 슬래시를 떼어 둔다 — 뒤에 경로를 붙이기 때문이다", () => {
    expect(parseServerEnv({ SITE_URL: "http://localhost:3000/" })).toEqual({
      SITE_URL: "http://localhost:3000",
      CRON_SECRET: "",
    });
  });

  it("Cron 비밀값은 없어도 된다", () => {
    expect(parseServerEnv({ SITE_URL: "http://localhost:3000", CRON_SECRET: "s3cret" }).CRON_SECRET).toBe("s3cret");
  });

  it("절대 주소가 아니면 거부한다 — 로그인 후 돌아올 주소다", () => {
    expect(() => parseServerEnv({ SITE_URL: "/callback" })).toThrowError(/SITE_URL/);
  });
});
