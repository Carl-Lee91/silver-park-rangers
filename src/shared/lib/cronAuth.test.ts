import { describe, expect, it } from "vitest";
import { isCronAuthorized } from "./cronAuth";

describe("Cron 요청 확인", () => {
  it("비밀값이 있으면 Vercel 이 보내는 Bearer 값과 같아야 한다", () => {
    expect(isCronAuthorized("Bearer s3cret", "s3cret")).toBe(true);
    expect(isCronAuthorized("Bearer wrong", "s3cret")).toBe(false);
    expect(isCronAuthorized(null, "s3cret")).toBe(false);
  });

  it("비밀값을 안 정했으면 누구나 부를 수 있다 — DB 에 핑만 보내는 일이라 해가 없다", () => {
    expect(isCronAuthorized(null, "")).toBe(true);
  });
});
