import { describe, expect, it } from "vitest";
import { IMAGE_CACHE_CONTROL } from "./cacheControl";

describe("이미지 캐시 — 주소에 내용 버전(?v=)이 붙어 같은 주소는 같은 그림이다", () => {
  it("공개 이미지는 기기에 오래 두고, 서버(CDN)에는 하루만 둔다 — 공개를 취소하면 하루 안에 사라진다", () => {
    expect(IMAGE_CACHE_CONTROL.public).toBe("public, max-age=31536000, immutable, s-maxage=86400");
  });

  it("공개 전 이미지(관리자)는 그 기기에만 둔다 — 서버(CDN)에 남기면 주소를 아는 누구에게나 나간다", () => {
    expect(IMAGE_CACHE_CONTROL.private).toBe("private, max-age=31536000, immutable");
    expect(IMAGE_CACHE_CONTROL.private).not.toContain("s-maxage");
  });
});
