import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/** src 아래 화면 파일(테스트 제외) */
const sources = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return path.endsWith(".tsx") && !path.endsWith(".test.tsx") ? [path] : [];
  });

const root = join(process.cwd(), "src");
const files = sources(root).map((path) => ({ path: relative(root, path), text: readFileSync(path, "utf8") }));

describe("입력칸 규칙 (CLAUDE.md 코딩 스타일)", () => {
  it("드롭다운은 shared/ui 의 Select 만 쓴다 — 브라우저 기본 화살표가 테두리에 붙는다", () => {
    const offenders = files.filter(({ path, text }) => path !== "shared/ui/Select.tsx" && text.includes("<select"));
    expect(offenders.map(({ path }) => path)).toEqual([]);
  });

  it("입력칸 글자를 16px 보다 작게 쓰지 않는다 — 아이폰이 누를 때 화면을 확대한다", () => {
    const small = files.flatMap(({ path, text }) =>
      // 화살표 함수(=>)의 > 에서 태그가 끊기지 않게 => 는 건너뛴다.
      [...text.matchAll(/<(input|textarea)\b(?:=>|[^>])*>/g)]
        .map((match) => match[0])
        .filter((tag) => !tag.includes('type="hidden"') && /\btext-(xs|sm)\b|text-\[/.test(tag))
        .map(() => path),
    );
    expect(small).toEqual([]);
  });
});
