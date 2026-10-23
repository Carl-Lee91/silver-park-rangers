/**
 * 매치 날짜·시각은 한국 시간이다. 서버(Vercel)는 UTC 로 돌기 때문에, 날짜를 셀 때와
 * 시각을 보일 때 시간대를 꼭 정해 준다.
 */
const SEOUL = "Asia/Seoul";

type Parts = Record<string, string>;

const partsOf = (date: Date, options: Intl.DateTimeFormatOptions): Parts =>
  Object.fromEntries(
    new Intl.DateTimeFormat("ko-KR", { timeZone: SEOUL, ...options })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );

/** 오늘 한국 날짜("YYYY-MM-DD") */
export const seoulToday = (now: Date = new Date()) => {
  const { year, month, day } = partsOf(now, { year: "numeric", month: "2-digit", day: "2-digit" });
  return `${year}-${month}-${day}`;
};

type MatchClock = { date: string; startsAt: string; voteDeadline: string | null };

/** 매치 시작 시각 */
export const kickoff = ({ date, startsAt }: Pick<MatchClock, "date" | "startsAt">) =>
  new Date(`${date}T${startsAt}:00+09:00`);

/** 🔴 DB 의 `voting_open()` 과 같은 정의다. 마감을 안 정했으면 매치 시작에 마감한다. */
export const votingClosesAt = (match: MatchClock) =>
  match.voteDeadline === null ? kickoff(match) : new Date(match.voteDeadline);

export const isVotingOpen = (match: MatchClock, now: Date = new Date()) =>
  now.getTime() < votingClosesAt(match).getTime();

/** "10월 25일 (일)" */
export const formatMatchDate = (date: string) => {
  const { month, day, weekday } = matchDateParts(date);
  return `${month} ${day}일 (${weekday})`;
};

/** 일정 칸(풋볼매니저 일정표)의 세 줄: { month: "11월", day: "2", weekday: "일" } */
export const matchDateParts = (date: string) => {
  // 한국 날짜의 정오로 잡으면 어느 시간대에서 읽어도 날짜가 밀리지 않는다.
  const { month, day, weekday } = partsOf(new Date(`${date}T12:00:00+09:00`), {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
  return { month: `${month}월`, day, weekday };
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** 매치까지 남은 날(D-3 의 3). 두 값 모두 한국 날짜("YYYY-MM-DD")다. 오늘이면 0, 지났으면 음수 */
export const daysUntil = (date: string, today: string) =>
  Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY_MS);

/** "10월 24일 (토) 22:00" */
export const formatDeadline = (iso: string) => {
  const { month, day, weekday, hour, minute } = partsOf(new Date(iso), {
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return `${month}월 ${day}일 (${weekday}) ${hour}:${minute}`;
};

/** datetime-local 입력칸 값("2026-10-24T22:00")을 한국 시간으로 읽어 저장값으로 바꾼다. 비면 null. */
export const deadlineFromLocalInput = (value: string) => (value === "" ? null : `${value}:00+09:00`);

/** 저장값을 datetime-local 입력칸 값으로 되돌린다(고치기 화면). */
export const deadlineToLocalInput = (iso: string | null) => {
  if (iso === null) return "";
  const { year, month, day, hour, minute } = partsOf(new Date(iso), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return `${year}-${month}-${day}T${hour}:${minute}`;
};
