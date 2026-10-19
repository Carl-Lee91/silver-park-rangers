import { describe, expect, it } from "vitest";
import { dbErrorMessage } from "./dbError";

describe("DB 오류 안내", () => {
  it("권한이 없으면(42501) 권한 안내", () => {
    expect(dbErrorMessage("42501")).toBe("권한이 없어요.");
  });

  it("대상이 이미 바뀌었으면(P0002) 새로고침 안내", () => {
    expect(dbErrorMessage("P0002")).toBe("이미 처리됐거나 상태가 바뀌었어요. 새로고침해 주세요.");
  });

  it("그 밖에는 다시 시도 안내", () => {
    expect(dbErrorMessage("XX000")).toBe("처리하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
    expect(dbErrorMessage(undefined)).toBe("처리하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
  });
});
