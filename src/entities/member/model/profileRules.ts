import { z } from "zod";
import { POSITION_CODES, type Position } from "@/entities/position";
import { FEET, type Foot } from "./member";

/** 선호 포지션은 1~3개(PLAN.md §5) */
export const MAX_PREFERRED_POSITIONS = 3;

/** 누른 순서와 상관없이 왼발·오른발 순서로 둔다. 다시 누르면 뺀다. */
export const toggleFoot = (current: readonly Foot[], foot: Foot): Foot[] =>
  FEET.map(({ code }) => code).filter((code) => (code === foot ? !current.includes(code) : current.includes(code)));

/** 누른 순서가 우선순위다. 3개를 넘게 고르지 못하고, 빼면 뒤 순위가 당겨진다. */
export const togglePosition = (current: readonly Position[], position: Position): Position[] => {
  if (current.includes(position)) return current.filter((code) => code !== position);
  return current.length >= MAX_PREFERRED_POSITIONS ? [...current] : [...current, position];
};

const distinct = (items: readonly string[]) => new Set(items).size === items.length;

/** 주발·선호 포지션 규칙. DB 제약(members 테이블)과 같다. 가입 신청과 내 정보 수정이 같이 쓴다. */
export const profileFieldsSchema = z.object({
  feet: z
    .array(z.enum(["left", "right"]), "주로 쓰는 발을 골라 주세요.")
    .min(1, "주로 쓰는 발을 골라 주세요.")
    .refine(distinct, "같은 발을 두 번 고를 수 없어요."),
  preferredPositions: z
    .array(z.enum(POSITION_CODES), "선호 포지션을 골라 주세요.")
    .min(1, "선호 포지션을 하나 이상 골라 주세요.")
    .max(MAX_PREFERRED_POSITIONS, `선호 포지션은 ${MAX_PREFERRED_POSITIONS}개까지 고를 수 있어요.`)
    .refine(distinct, "같은 포지션을 두 번 고를 수 없어요."),
});
