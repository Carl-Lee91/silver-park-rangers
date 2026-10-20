import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

/**
 * FSD 레이어 경계를 여기서 강제한다. 위반하면 `pnpm lint` 가 실패한다.
 *
 * 의존 방향: app → views → widgets → features → entities → shared
 * 같은 레이어의 다른 슬라이스끼리도 import 하지 않는다
 * (`allow` 에 자기 타입이 없다. shared 만 예외다).
 *
 * 예외 둘:
 * - entities 끼리는 **타입만** 가져올 수 있다. 값(함수·상수)을 가져오면 실패한다.
 * - 단 `entities/position` 은 값도 가져올 수 있다. 동작 없는 공통 어휘(포지션 코드·이름)라서,
 *   막으면 멤버·포메이션·스쿼드가 같은 목록을 각자 베껴 두게 된다.
 */
const LAYERS = ["app", "views", "widgets", "features", "entities", "shared"];

const allowBelow = (type) =>
  LAYERS.slice(LAYERS.indexOf(type) + 1).map((to) => ({
    to: { element: { type: to } },
  }));

const fsd = {
  plugins: { boundaries },
  settings: {
    "boundaries/include": ["src/**/*"],
    "boundaries/elements": [
      { type: "app", pattern: "src/app/**" },
      { type: "views", pattern: "src/views/*" },
      { type: "widgets", pattern: "src/widgets/*" },
      { type: "features", pattern: "src/features/*" },
      { type: "entities", pattern: "src/entities/*", capture: ["slice"] },
      { type: "shared", pattern: "src/shared/*" },
    ],
  },
  rules: {
    "boundaries/dependencies": [
      "error",
      {
        default: "disallow",
        policies: [
          ...LAYERS.filter((t) => t !== "shared").map((type) => ({
            from: { element: { type } },
            allow: allowBelow(type),
          })),
          {
            from: { element: { type: "entities" } },
            allow: [
              { to: { element: { type: "entities" } }, dependency: { kind: "type" } },
              { to: { element: { type: "entities", captured: { slice: "position" } } } },
            ],
          },
          // shared 는 가장 아래라 같은 레이어끼리만 참조한다.
          {
            from: { element: { type: "shared" } },
            allow: [{ to: { element: { type: "shared" } } }],
          },
        ],
      },
    ],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  fsd,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "coverage/**"]),
]);

export default eslintConfig;
