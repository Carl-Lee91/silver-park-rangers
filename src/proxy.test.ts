import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** proxy.ts 의 matcher. Next 가 글자 그대로 읽어야 해서 상수로 뺄 수 없다 — 파일에서 꺼내 정규식으로 만든다 */
const source = readFileSync(join(process.cwd(), "src/proxy.ts"), "utf8");
const pattern = source.match(/matcher: \["(.+)"\]/)![1].replace(/\\\\/g, "\\");
const runsOn = (path: string) => new RegExp(`^${pattern}$`).test(path);

describe("게이트가 도는 주소 (proxy matcher)", () => {
  it("화면 주소에서는 돈다 — 로그인 · 승인 안 된 사람을 보낸다", () => {
    for (const path of ["/", "/me", "/matches/m1", "/admin", "/admin/stats", "/login"]) expect(runsOn(path), path).toBe(true);
  });

  it("로그인 전에도 열려야 하는 파일에서는 돌지 않는다 — 엠블럼 · 아이콘 · 매니페스트 · 서비스 워커 · 연결 안 됨 화면", () => {
    for (const path of ["/emblem.png", "/icons/icon-192.png", "/manifest.webmanifest", "/sw.js", "/offline.html", "/opengraph-image.png"]) {
      expect(runsOn(path), path).toBe(false);
    }
  });
});
