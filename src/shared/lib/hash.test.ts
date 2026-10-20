import { describe, expect, it } from "vitest";
import { shortHash } from "./hash";

describe("짧은 해시", () => {
  it("같은 글은 늘 같은 값이다", () => {
    expect(shortHash("스쿼드")).toBe(shortHash("스쿼드"));
  });

  it("글이 조금만 달라도 값이 바뀐다", () => {
    expect(shortHash('{"a":1}')).not.toBe(shortHash('{"a":2}'));
  });

  it("주소에 그대로 붙일 수 있는 8자리 16진수다", () => {
    expect(shortHash("x")).toMatch(/^[0-9a-f]{8}$/);
  });
});
