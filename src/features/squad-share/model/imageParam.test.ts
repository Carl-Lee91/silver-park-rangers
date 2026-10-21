import { describe, expect, it } from "vitest";
import { readImageParam, withImageParam } from "./imageParam";

describe("주소의 이미지 보기 상태(?image=)", () => {
  it("쿼터별·출전표만 알아본다", () => {
    expect(readImageParam("?image=quarters")).toBe("quarters");
    expect(readImageParam("?tab=a&image=rotation")).toBe("rotation");
    expect(readImageParam("?image=card")).toBeNull();
    expect(readImageParam("")).toBeNull();
  });

  it("다른 값은 그대로 두고 이미지 보기만 넣고 뺀다", () => {
    expect(withImageParam("?tab=a", "rotation")).toBe("?tab=a&image=rotation");
    expect(withImageParam("?tab=a&image=rotation", "quarters")).toBe("?tab=a&image=quarters");
    expect(withImageParam("?tab=a&image=rotation", null)).toBe("?tab=a");
    expect(withImageParam("?image=rotation", null)).toBe("");
  });
});
