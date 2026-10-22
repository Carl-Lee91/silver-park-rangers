import { z } from "zod";
import { POSITION_CODES, type Position } from "@/entities/position";
import { FEET, type Foot } from "./member";

/** 선호 포지션은 3개(PLAN.md §5). 1순위가 골키퍼면 골키퍼 하나다. */
export const MAX_PREFERRED_POSITIONS = 3;

/** 누른 순서와 상관없이 왼발·오른발 순서로 둔다. 다시 누르면 뺀다. */
export const toggleFoot = (current: readonly Foot[], foot: Foot): Foot[] =>
  FEET.map(({ code }) => code).filter((code) => (code === foot ? !current.includes(code) : current.includes(code)));

/**
 * 더 고를 수 없는 포지션인지. 3개를 다 골랐거나 1순위가 골키퍼면 나머지는 막힌다.
 * 1순위 골키퍼는 전담 키퍼라 필드를 뛰지 않는다(PLAN.md §6).
 */
export const isPositionLocked = (current: readonly Position[], position: Position) =>
  !current.includes(position) && (current[0] === "GK" || current.length >= MAX_PREFERRED_POSITIONS);

/**
 * 누른 순서가 우선순위다. 빼면 뒤 순위가 당겨진다. 막힌 포지션은 눌러도 그대로다.
 * 빼서 골키퍼가 1순위가 되면 골키퍼 하나만 남긴다 — 1순위 골키퍼는 다른 포지션을 갖지 않는다.
 */
export const togglePosition = (current: readonly Position[], position: Position): Position[] => {
  if (current.includes(position)) {
    const next = current.filter((code) => code !== position);
    return next[0] === "GK" ? ["GK"] : next;
  }
  return isPositionLocked(current, position) ? [...current] : [...current, position];
};

/** 몇 개 더 골라야 하는지. 1순위 골키퍼 하나면 0 */
const positionsLeft = (positions: readonly Position[]) =>
  positions[0] === "GK" ? 0 : Math.max(0, MAX_PREFERRED_POSITIONS - positions.length);

/**
 * 아직 남은 프로필 항목(화면 순서). 막힌 단추 아래에 "남은 것: …"으로 보여 준다 — 무엇이 빠져서
 * 안 눌리는지 모르면 사람들이 멈춘다. 실명이 없는 폼(내 정보)은 `realName` 을 넘기지 않는다.
 */
export const missingProfileItems = ({
  realName,
  feet,
  positions,
}: {
  realName?: string;
  feet: readonly Foot[];
  positions: readonly Position[];
}): string[] => {
  const left = positionsLeft(positions);
  return [
    realName !== undefined && realName.trim() === "" ? "실명" : null,
    feet.length === 0 ? "주발" : null,
    left === 0 ? null : positions.length === 0 ? `선호 포지션 ${left}개` : `선호 포지션 ${left}개 더`,
  ].filter((item): item is string => item !== null);
};

/** 다 골랐는지: 3개, 또는 1순위 골키퍼 하나 */
export const isPositionChoiceComplete = (positions: readonly Position[]) =>
  positions[0] === "GK" ? positions.length === 1 : positions.length === MAX_PREFERRED_POSITIONS;

const distinct = (items: readonly string[]) => new Set(items).size === items.length;

/** 실명. DB 제약(members.real_name)과 같다. 가입 신청·온보딩·그날 용병이 같이 쓴다. */
export const realNameField = z
  .string()
  .trim()
  .min(1, "실명을 입력해 주세요.")
  .max(20, "실명은 20자까지 입력할 수 있어요.");

/** 등번호. 폼 값(문자열)을 읽는다 — 비우면 없음(null), 아니면 0~99 정수. DB 제약과 같다. */
export const jerseyNumberField = z.string().transform((value, context) => {
  if (value === "") return null;
  const number = Number(value);
  if (Number.isInteger(number) && number >= 0 && number <= 99) return number;
  context.addIssue({ code: "custom", message: "등번호는 0~99 사이로 골라 주세요." });
  return z.NEVER;
});

/** 주발·선호 포지션 규칙. DB 제약(members 테이블)과 같다. 가입 신청과 내 정보 수정이 같이 쓴다. */
export const profileFieldsSchema = z.object({
  feet: z
    .array(z.enum(["left", "right"]), "주로 쓰는 발을 골라 주세요.")
    .min(1, "주로 쓰는 발을 골라 주세요.")
    .refine(distinct, "같은 발을 두 번 고를 수 없어요."),
  preferredPositions: z
    .array(z.enum(POSITION_CODES), "선호 포지션을 골라 주세요.")
    .refine(distinct, "같은 포지션을 두 번 고를 수 없어요.")
    .refine((positions) => positions[0] !== "GK" || positions.length === 1, "1순위가 골키퍼면 골키퍼 하나만 골라요.")
    .refine(
      (positions) => positions[0] === "GK" || positions.length === MAX_PREFERRED_POSITIONS,
      `선호 포지션을 ${MAX_PREFERRED_POSITIONS}개 골라 주세요.`,
    ),
});

/**
 * 사람 한 명의 프로필: 실명·주발·선호 포지션·등번호. 온보딩과 그날 용병(PLAN.md §4)이 같이 쓴다.
 * 가입 신청은 여기에 이메일·비밀번호를 더한다.
 */
export const memberProfileSchema = z
  .object({ realName: realNameField, jerseyNumber: jerseyNumberField })
  .extend(profileFieldsSchema.shape);
