import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("최소 서비스 워커 (PLAN.md §7 앱으로 설치)", () => {
  const sw = read("public/sw.js");

  it("화면 이동만 맡고, 인터넷이 끊기면 '연결 안 됨' 화면을 보인다 — 크롬이 설치 창을 띄우는 조건(fetch 처리)", () => {
    expect(sw).toMatch(/addEventListener\("fetch"/);
    expect(sw).toMatch(/mode !== "navigate"/);
    expect(sw).toMatch(/\/offline\.html/);
  });

  it("데이터 · 화면을 캐시에서 꺼내 주지 않는다 — 늘 서버에서 새로 읽는다", () => {
    expect(sw).toMatch(/fetch\(event\.request\)\.catch/);
    expect(sw).not.toMatch(/caches\.match\(event\.request\)/);
  });

  it("서비스 워커 파일은 기기에 캐시하지 않는다 — 고쳐도 옛 워커가 남지 않게", () => {
    const config = read("next.config.ts");
    expect(config).toMatch(/source: "\/sw\.js"/);
    expect(config).toMatch(/no-cache, no-store, must-revalidate/);
  });

  it("연결 안 됨 화면은 다른 파일 없이 혼자 그려진다", () => {
    const offline = read("public/offline.html");
    expect(offline).toContain("인터넷에 연결되지 않았어요");
    expect(offline).not.toMatch(/<script\b[^>]*\bsrc=|<link\b[^>]*stylesheet/);
  });
});
