import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const APP = join(process.cwd(), "src/app");
const pages = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return pages(path);
    return name === "page.tsx" ? [relative(APP, path).split(sep).join("/")] : [];
  });

/** 팀원 화면 묶음 밖에 있어도 되는 화면: 로그인 전 · 승인 전 · 관리 · 공유 링크 · 개인 링크 */
const OUTSIDE_MEMBER = /^(login|signup|onboarding|pending|admin|s|j)\//;

describe("팀원 화면의 내 정보 · 로그아웃 줄 (PLAN.md §7)", () => {
  it("팀원 화면은 모두 (member) 묶음 안에 있다 — 새 화면도 맨 아래 내 정보 · 로그아웃 줄을 받는다", () => {
    const strays = pages(APP).filter((page) => !page.startsWith("(member)/") && !OUTSIDE_MEMBER.test(page));
    expect(strays).toEqual([]);
  });

  it("(member) 묶음의 레이아웃이 내 정보 링크와 로그아웃을 나란히 둔다", () => {
    const layout = readFileSync(join(APP, "(member)/layout.tsx"), "utf8");
    expect(layout).toMatch(/<MyPageLink\b/);
    expect(layout).toMatch(/<SignOutButton\b/);
  });

  it("레이아웃을 새로 만들었으니 그 아래 불러오는 중 화면도 있다(CLAUDE.md)", () => {
    expect(() => statSync(join(APP, "(member)/loading.tsx"))).not.toThrow();
  });
});
