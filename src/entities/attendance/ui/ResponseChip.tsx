import { chipClass, type ChipTone } from "@/shared/ui";
import { RESPONSE_LABELS, type AttendanceResponse } from "../model/attendance";

const TONES: Record<AttendanceResponse, ChipTone> = { yes: "accent", maybe: "warn", no: "muted" };

/** 내 응답 칩. 응답이 없으면 마감 전엔 빨간 테두리 "투표 전", 마감 뒤엔 "마감" */
export default function ResponseChip({ response, open }: { response: AttendanceResponse | undefined; open: boolean }) {
  if (response !== undefined) return <span className={chipClass(TONES[response])}>{RESPONSE_LABELS[response]}</span>;
  return open ? <span className={chipClass("danger")}>투표 전</span> : <span className={chipClass("muted")}>마감</span>;
}
