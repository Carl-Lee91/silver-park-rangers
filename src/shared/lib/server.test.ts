import { describe, expect, it } from "vitest";
import { loadImageEmblem } from "./server";

describe("서버 이미지에 넣을 엠블럼", () => {
  it("PNG 를 data URI 로 읽는다 — 서버 이미지(Satori)는 앱 주소의 파일을 못 읽는다", async () => {
    const emblem = await loadImageEmblem();
    expect(emblem).toMatch(/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/);
    expect(emblem.length).toBeGreaterThan(1000);
  });

  it("한 번 읽으면 다시 읽지 않는다", () => {
    expect(loadImageEmblem()).toBe(loadImageEmblem());
  });
});
