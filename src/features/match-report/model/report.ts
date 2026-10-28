import { OUTCOME_LABELS, outcomeOf, type ResultSummary } from "@/entities/result";

type Report = {
  /** "11월 2일 (일) vs FC 한강" */
  title: string;
  summary: ResultSummary;
  /** MVP(공동이면 여럿). 아직 없으면 빈 배열 */
  mvp: readonly { realName: string; votes: number }[];
  /** 실제로 온 사람 수(용병 포함). 모르면 0 */
  attendedCount: number;
  url: string;
};

/** "홍길동 2 · 김철수 1 · 모름 1" — 많이 한 순, 같으면 이름순, 모름은 맨 뒤 */
const ranking = (names: readonly (string | null)[]) => {
  const counts = new Map<string, number>();
  for (const name of names) counts.set(name ?? "", (counts.get(name ?? "") ?? 0) + 1);
  return [...counts.entries()]
    .sort(([a, x], [b, y]) => Number(a === "") - Number(b === "") || y - x || a.localeCompare(b, "ko"))
    .map(([name, count]) => `${name === "" ? "모름" : name} ${count}`)
    .join(" · ");
};

/**
 * 단톡방에 붙일 경기 리포트(PLAN.md §10). 정해진 틀로 만든다(AI 없음, 0원). 없는 줄(골 · 도움 · MVP · 참석)은 뺀다.
 * 링크는 마지막 줄에 둬서 카톡이 미리보기 카드를 붙이게 한다.
 */
export const matchReportText = ({ title, summary, mvp, attendedCount, url }: Report) => {
  const goals = summary.quarters.flatMap((quarter) => quarter.goals);
  const assists = goals.filter((goal) => goal.assistId !== null).map((goal) => goal.assistName);
  const { ours, theirs } = summary.total;
  const mvpLine =
    mvp.length === 0
      ? null
      : mvp.length === 1
        ? `MVP: ${mvp[0].realName} (${mvp[0].votes}표)`
        : `MVP: ${mvp.map((row) => row.realName).join(" · ")} (각 ${mvp[0].votes}표)`;
  return [
    `[${title}] ${ours} : ${theirs} ${OUTCOME_LABELS[outcomeOf({ ours, theirs })]}`,
    `쿼터: ${summary.quarters.map((quarter) => `${quarter.number}Q ${quarter.ours}:${quarter.theirs}`).join(" · ")}`,
    goals.length > 0 ? `득점: ${ranking(goals.map((goal) => goal.scorerName))}` : null,
    assists.length > 0 ? `도움: ${ranking(assists)}` : null,
    mvpLine,
    attendedCount > 0 ? `참석 ${attendedCount}명 · 모두 수고하셨습니다!` : "모두 수고하셨습니다!",
    url,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
};
