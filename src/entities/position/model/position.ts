/** 포지션 분류(PLAN.md §5). 선호 포지션과 포메이션 슬롯이 같은 코드를 쓴다. */
export const POSITIONS = [
  { code: "FW", label: "공격수" },
  { code: "AM", label: "공격형 미드필더" },
  { code: "WG", label: "윙" },
  { code: "MF", label: "미드필더" },
  { code: "WB", label: "윙백" },
  { code: "CB", label: "센터백" },
  { code: "GK", label: "골키퍼" },
] as const;

export type Position = (typeof POSITIONS)[number]["code"];

/** 검증(zod enum)에 쓰는 코드 목록 */
export const POSITION_CODES = POSITIONS.map(({ code }) => code) as [Position, ...Position[]];

const LABELS = Object.fromEntries(POSITIONS.map(({ code, label }) => [code, label])) as Record<
  Position,
  string
>;

export const positionLabel = (code: Position): string => LABELS[code];
