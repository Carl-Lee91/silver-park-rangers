import { deadlineFromLocalInput, deadlineToLocalInput, kickoff, MATCH_FORMATS, type Match, type MatchFormat } from "@/entities/match";

/** 폼 입력칸 그대로의 값(모두 문자열) */
export type MatchFormValues = {
  /** 축구 · 풋살 5:5 · 풋살 6:6 (PLAN.md §6 "풋살") */
  format: string;
  date: string;
  startsAt: string;
  endsAt: string;
  quarterCount: string;
  venue: string;
  opponent: string;
  /** datetime-local 값. 비면 매치 시작에 마감 */
  voteDeadline: string;
};

export type MatchField = keyof MatchFormValues;

export type MatchFormState = {
  errors?: Partial<Record<MatchField, string>>;
  message?: string;
};

export type NewMatch = {
  format: MatchFormat;
  date: string;
  startsAt: string;
  endsAt: string;
  quarterCount: number;
  venue: string | null;
  opponent: string | null;
  voteDeadline: string | null;
};

/** 보통 10:00~13:00 에 6쿼터를 한다(PLAN.md §6). */
export const DEFAULT_MATCH_FORM: MatchFormValues = {
  format: "football",
  date: "",
  startsAt: "10:00",
  endsAt: "13:00",
  quarterCount: "6",
  venue: "",
  opponent: "",
  voteDeadline: "",
};

/** 풋살은 쿼터가 없다. DB 의 쿼터 수 칸에는 기본값을 둔다(쓰지 않는다) */
const FUTSAL_QUARTER_COUNT = 6;

const isFormat = (value: string): value is MatchFormat => (MATCH_FORMATS as readonly string[]).includes(value);

/** 한 쿼터가 이보다 짧으면 입력 실수로 본다. */
const MIN_QUARTER_MINUTES = 10;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;
const LOCAL_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const minutes = (time: string) => {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
};

/** DB 제약(matches 테이블)과 같은 규칙에 화면용 규칙(쿼터 길이·마감 시각)을 더한다. */
export const validateMatch = (
  input: MatchFormValues,
): { ok: true; value: NewMatch } | { ok: false; errors: Partial<Record<MatchField, string>> } => {
  const errors: Partial<Record<MatchField, string>> = {};
  const venue = input.venue.trim();
  const opponent = input.opponent.trim();

  if (!isFormat(input.format)) errors.format = "종류를 골라 주세요.";
  const futsal = isFormat(input.format) && input.format !== "football";
  if (!DATE.test(input.date)) errors.date = "날짜를 골라 주세요.";
  if (!TIME.test(input.startsAt)) errors.startsAt = "시작 시간을 골라 주세요.";
  if (!TIME.test(input.endsAt)) errors.endsAt = "끝 시간을 골라 주세요.";

  const timesValid = errors.startsAt === undefined && errors.endsAt === undefined;
  const length = timesValid ? minutes(input.endsAt) - minutes(input.startsAt) : 0;
  if (timesValid && length <= 0) errors.endsAt = "끝 시간은 시작 시간보다 늦어야 해요.";

  const quarterCount = futsal ? FUTSAL_QUARTER_COUNT : Number(input.quarterCount);
  if (futsal) {
    // 풋살은 쿼터가 없다
  } else if (!/^\d+$/.test(input.quarterCount) || quarterCount < 1 || quarterCount > 12) {
    errors.quarterCount = "쿼터 수는 1~12 사이로 골라 주세요.";
  } else if (length > 0 && length / quarterCount < MIN_QUARTER_MINUTES) {
    errors.quarterCount = "쿼터가 너무 짧아요. 쿼터 수를 줄이거나 시간을 늘려 주세요.";
  }

  if (venue.length > 40) errors.venue = "장소는 40자까지 입력할 수 있어요.";
  if (opponent.length > 30) errors.opponent = "상대 팀은 30자까지 입력할 수 있어요.";

  let voteDeadline: string | null = null;
  if (input.voteDeadline !== "") {
    if (!LOCAL_DATETIME.test(input.voteDeadline)) {
      errors.voteDeadline = "투표 마감을 다시 골라 주세요.";
    } else {
      voteDeadline = deadlineFromLocalInput(input.voteDeadline);
      const start = errors.date === undefined && errors.startsAt === undefined;
      if (start && new Date(voteDeadline!) >= kickoff({ date: input.date, startsAt: input.startsAt })) {
        errors.voteDeadline = "투표 마감은 매치 시작 전이어야 해요.";
      }
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      format: input.format as MatchFormat,
      date: input.date,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      quarterCount,
      venue: venue === "" ? null : venue,
      opponent: opponent === "" ? null : opponent,
      voteDeadline,
    },
  };
};

const FIELDS: MatchField[] = ["format", "date", "startsAt", "endsAt", "quarterCount", "venue", "opponent", "voteDeadline"];

export const readMatchForm = (formData: FormData): MatchFormValues =>
  Object.fromEntries(FIELDS.map((field) => [field, String(formData.get(field) ?? "")])) as MatchFormValues;

/** 고치기 화면은 저장된 매치로 시작한다. */
export const matchToFormValues = (match: Match): MatchFormValues => ({
  format: match.format,
  date: match.date,
  startsAt: match.startsAt,
  endsAt: match.endsAt,
  quarterCount: String(match.quarterCount),
  venue: match.venue ?? "",
  opponent: match.opponent ?? "",
  voteDeadline: deadlineToLocalInput(match.voteDeadline),
});
