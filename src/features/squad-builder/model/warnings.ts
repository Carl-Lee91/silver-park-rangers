import type { SquadWarning } from "@/entities/squad";

/** 점검 결과(evaluateSquad)를 빌더에 띄울 문장으로 바꾼다. 쿼터 번호는 1부터 쓴다. */
export const warningMessage = (warning: SquadWarning, nameOf: (memberId: string) => string) => {
  switch (warning.kind) {
    case "keeper-missing":
      return `${warning.quarter + 1}쿼터 키퍼가 비었어요.`;
    case "field-short":
      return `${warning.quarter + 1}쿼터 필드가 ${warning.emptySlots}자리 비었어요.`;
    case "below-guarantee":
      return `${nameOf(warning.playerId)}님은 보장 ${warning.guaranteed}쿼터 중 ${warning.played}쿼터만 뛰어요.`;
  }
};
