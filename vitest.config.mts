import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // 지금은 순수 함수만 테스트한다. 컴포넌트 테스트가 생기면 jsdom 과
    // Testing Library 를 그때 넣는다(CLAUDE.md "라이브러리는 첫 기능이 필요로 할 때").
    environment: "node",
    // 테스트는 대상 코드 옆에 둔다(co-locate). 슬라이스 밖으로 빼지 않는다.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
});
