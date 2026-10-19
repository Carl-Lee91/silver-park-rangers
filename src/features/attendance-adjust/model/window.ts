const TIME = /^\d{2}:\d{2}$/;

export type AttendanceWindowInput = {
  matchId: string;
  memberId: string;
  arriveAt: string | null;
  leaveAt: string | null;
};

/** 관리자가 당일 바꾸는 도착·떠나는 시간. 비면 처음부터·끝까지(null). DB 제약과 같은 규칙이다. */
export const readWindowForm = (
  formData: FormData,
): { ok: true; value: AttendanceWindowInput } | { ok: false; error: string } => {
  const time = (name: string) => {
    const value = String(formData.get(name) ?? "");
    return value === "" ? null : value;
  };
  const arriveAt = time("arriveAt");
  const leaveAt = time("leaveAt");
  if ((arriveAt !== null && !TIME.test(arriveAt)) || (leaveAt !== null && !TIME.test(leaveAt))) {
    return { ok: false, error: "시간을 다시 골라 주세요." };
  }
  if (arriveAt !== null && leaveAt !== null && arriveAt >= leaveAt) {
    return { ok: false, error: "도착은 떠나는 시간보다 빨라야 해요." };
  }
  return {
    ok: true,
    value: { matchId: String(formData.get("matchId")), memberId: String(formData.get("memberId")), arriveAt, leaveAt },
  };
};
