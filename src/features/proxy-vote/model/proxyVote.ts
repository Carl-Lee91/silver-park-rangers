import { RESPONSE_LABELS, type Attendance, type AttendanceResponse } from "@/entities/attendance";

export type ProxyChoice = { id: string; label: string };

type Person = { id: string; realName: string; jerseyNumber: number | null };

const nameOf = (person: Person) => (person.jerseyNumber === null ? person.realName : `${person.jerseyNumber} ${person.realName}`);
const byName = (a: Person, b: Person) => a.realName.localeCompare(b.realName, "ko");

/**
 * 대신 투표할 사람(PLAN.md §4 대신 투표). 아직 투표 안 한 사람이 먼저(이름순)이고, 그다음 이미 투표한 사람이다 —
 * 단톡방에 "불참으로 바꿀게요"라고만 쓰는 사람도 있어서. 투표한 사람에게는 지금 응답을 붙인다.
 */
export const proxyVoteChoices = (people: readonly Person[], attendance: readonly Attendance[]): ProxyChoice[] => {
  const responseOf = new Map(attendance.flatMap((row) => (row.response === null ? [] : [[row.memberId, row.response] as const])));
  const waiting = people.filter((person) => !responseOf.has(person.id)).sort(byName);
  const voted = people.filter((person) => responseOf.has(person.id)).sort(byName);
  return [
    ...waiting.map((person) => ({ id: person.id, label: nameOf(person) })),
    ...voted.map((person) => ({
      id: person.id,
      label: `${nameOf(person)} · 지금 ${RESPONSE_LABELS[responseOf.get(person.id) as AttendanceResponse]}`,
    })),
  ];
};

const RESPONSES: AttendanceResponse[] = ["yes", "maybe", "no"];

export type ProxyVote = { matchId: string; memberId: string; response: AttendanceResponse };

export const readProxyVote = (formData: FormData): { ok: true; value: ProxyVote } | { ok: false; error: string } => {
  const matchId = String(formData.get("matchId") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  const response = RESPONSES.find((candidate) => candidate === formData.get("response"));
  if (memberId === "") return { ok: false, error: "누구 대신인지 골라 주세요." };
  if (response === undefined) return { ok: false, error: "참석 여부를 골라 주세요." };
  return { ok: true, value: { matchId, memberId, response } };
};
