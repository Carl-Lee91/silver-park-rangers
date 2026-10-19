/**
 * 시각은 "HH:MM" 이다. DB 의 time 컬럼이 돌려주는 "HH:MM:SS" 도 받는다.
 */
export type MatchTime = {
  startsAt: string;
  endsAt: string;
  quarterCount: number;
};

export type QuarterTime = {
  startsAt: string;
  endsAt: string;
};

/** 참석 투표의 도착·떠나는 시간. null 이면 "처음부터" · "끝까지"다. */
export type AttendanceWindow = {
  arriveAt: string | null;
  leaveAt: string | null;
};

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/**
 * 매치 시간을 쿼터 수로 똑같이 나눈다. 나누어 떨어지지 않으면 분 단위로 내림한다.
 * 쿼터는 다음 쿼터가 시작할 때 끝나고, 마지막 쿼터는 매치가 끝날 때 끝난다.
 */
export const quarterSchedule = ({ startsAt, endsAt, quarterCount }: MatchTime): QuarterTime[] => {
  const start = toMinutes(startsAt);
  const total = toMinutes(endsAt) - start;
  const boundary = (index: number) => start + Math.floor((index * total) / quarterCount);

  return Array.from({ length: quarterCount }, (_, index) => ({
    startsAt: toTime(boundary(index)),
    endsAt: toTime(boundary(index + 1)),
  }));
};

/**
 * 뛸 수 있는 쿼터 번호(0부터). 쿼터가 시작할 때 와 있고, 끝날 때까지 남아 있어야 뛴다.
 * 예: 12:00 에 떠나면 11:30~12:00 쿼터까지, 11:10 에 오면 11:30 쿼터부터다.
 */
export const availableQuarters = (
  schedule: readonly QuarterTime[],
  { arriveAt, leaveAt }: AttendanceWindow,
): number[] =>
  schedule.flatMap((quarter, index) => {
    const arrived = arriveAt === null || toMinutes(quarter.startsAt) >= toMinutes(arriveAt);
    const stays = leaveAt === null || toMinutes(quarter.endsAt) <= toMinutes(leaveAt);
    return arrived && stays ? [index] : [];
  });

export type TimeOption = { value: string; label: string };

/**
 * 도착·떠나는 시간 선택지(PLAN.md §6). 쿼터 경계에서만 고른다 — 쿼터 중간에 오가는 것은
 * 그 쿼터를 못 뛰는 것과 같다. 첫 쿼터 시작 도착은 "처음부터", 마지막 쿼터 끝 출발은 "끝까지"(값 "").
 * 팀원의 참석 투표와 관리자의 당일 시간 고치기가 같이 쓴다.
 */
export const timeWindowOptions = (schedule: readonly QuarterTime[]): { arrive: TimeOption[]; leave: TimeOption[] } => ({
  arrive: [
    { value: "", label: "처음부터" },
    ...schedule.slice(1).map((quarter) => ({ value: quarter.startsAt, label: `${quarter.startsAt} 도착` })),
  ],
  leave: [
    { value: "", label: "끝까지" },
    ...schedule.slice(0, -1).map((quarter) => ({ value: quarter.endsAt, label: `${quarter.endsAt} 출발` })),
  ],
});
