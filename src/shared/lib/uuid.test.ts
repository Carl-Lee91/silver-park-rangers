import { describe, expect, it } from "vitest";
import { isUuid } from "./uuid";

describe("uuid 모양", () => {
  it("uuid 면 참", () => {
    expect(isUuid("10000000-0000-0000-0000-000000000001")).toBe(true);
    expect(isUuid("9F1C2E3D-4A5B-4C6D-8E7F-0123456789AB")).toBe(true);
  });

  it("아니면 거짓 — 주소에 아무 글자나 넣은 경우", () => {
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("")).toBe(false);
    expect(isUuid("10000000-0000-0000-0000-00000000000")).toBe(false);
  });
});
