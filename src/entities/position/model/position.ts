/**
 * 포지션 분류(PLAN.md §5). 선호 포지션과 포메이션 슬롯이 같은 코드를 쓴다.
 * 줄은 1선(공격) ~ 5선(수비)이고 줄마다 중앙 하나 · 측면 하나다. 골키퍼는 따로다.
 */
export const POSITIONS = [
  { code: "FW", label: "공격수" },
  { code: "AM", label: "공격형 미드필더" },
  { code: "WG", label: "윙" },
  { code: "MF", label: "중앙 미드필더" },
  { code: "WM", label: "와이드 미드필더" },
  { code: "DM", label: "수비형 미드필더" },
  { code: "WB", label: "윙백" },
  { code: "CB", label: "센터백" },
  { code: "FB", label: "풀백" },
  { code: "GK", label: "골키퍼" },
] as const;

export type Position = (typeof POSITIONS)[number]["code"];

/** 검증(zod enum)에 쓰는 코드 목록 */
export const POSITION_CODES = POSITIONS.map(({ code }) => code) as [Position, ...Position[]];

/** 줄마다 [중앙, 측면]. 선호 포지션 고르기가 이 묶음으로 보여 준다 */
export const POSITION_LINES: { label: string; codes: Position[] }[] = [
  { label: "1선", codes: ["FW"] },
  { label: "2선", codes: ["AM", "WG"] },
  { label: "3선", codes: ["MF", "WM"] },
  { label: "4선", codes: ["DM", "WB"] },
  { label: "5선", codes: ["CB", "FB"] },
  { label: "골키퍼", codes: ["GK"] },
];

const LABELS = Object.fromEntries(POSITIONS.map(({ code, label }) => [code, label])) as Record<
  Position,
  string
>;

export const positionLabel = (code: Position): string => LABELS[code];
