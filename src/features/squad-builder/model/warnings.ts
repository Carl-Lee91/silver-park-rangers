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

/** 확인할 것 한 줄. 묶었으면 펼쳐 볼 세부(details)가 있다 */
export type WarningGroup = { title: string; details: string[] };

type Of<K extends SquadWarning["kind"]> = Extract<SquadWarning, { kind: K }>;

/**
 * 확인할 것을 종류별로 묶는다. 6쿼터를 비워 두면 키퍼·필드·보장 경고가 20줄 넘게 늘어져서 정작 볼 것을 못 찾는다.
 * 키퍼가 빈 쿼터는 한 줄로, 필드가 모자란 쿼터·보장을 못 채운 사람은 "몇 개·몇 명"으로 묶고 펼치면 하나씩 보인다.
 * 하나뿐이면 묶지 않고 그 문장을 그대로 쓴다. 점검이 못 보는 배치 문제(`issues`)는 뒤에 그대로 붙인다.
 */
export const groupWarnings = (
  warnings: readonly SquadWarning[],
  nameOf: (memberId: string) => string,
  issues: readonly string[] = [],
): WarningGroup[] => {
  const keepers = warnings.filter((warning): warning is Of<"keeper-missing"> => warning.kind === "keeper-missing");
  const short = warnings.filter((warning): warning is Of<"field-short"> => warning.kind === "field-short");
  const below = warnings.filter((warning): warning is Of<"below-guarantee"> => warning.kind === "below-guarantee");
  const single = (warning: SquadWarning): WarningGroup => ({ title: warningMessage(warning, nameOf), details: [] });

  const groups: WarningGroup[] = [];
  if (keepers.length === 1) groups.push(single(keepers[0]));
  if (keepers.length > 1) {
    groups.push({ title: `키퍼가 빈 쿼터: ${keepers.map((warning) => warning.quarter + 1).join(" · ")}쿼터`, details: [] });
  }
  if (short.length === 1) groups.push(single(short[0]));
  if (short.length > 1) {
    groups.push({
      title: `필드가 모자란 쿼터 ${short.length}개`,
      details: short.map((warning) => `${warning.quarter + 1}쿼터 ${warning.emptySlots}자리`),
    });
  }
  if (below.length === 1) groups.push(single(below[0]));
  if (below.length > 1) {
    groups.push({
      title: `보장 출전을 못 채운 사람 ${below.length}명`,
      details: below.map((warning) => `${nameOf(warning.playerId)} ${warning.played}/${warning.guaranteed}쿼터`),
    });
  }
  return [...groups, ...issues.map((title) => ({ title, details: [] }))];
};
