"use client";

const NUMBERS = Array.from({ length: 100 }, (_, number) => number);

type Props = {
  /** 폼 값. "" 이면 없음 */
  value: string;
  onChange: (next: string) => void;
  /** 다른 사람이 쓰는 번호. 고를 수 없게 막는다 */
  takenNumbers?: readonly number[];
  id?: string;
  className?: string;
};

/** 등번호 0~99 고르기(선택). 값은 입력칸 `jerseyNumber` 로 폼에 실린다(PLAN.md §5). */
export default function JerseyNumberSelect({ value, onChange, takenNumbers = [], id = "jerseyNumber", className }: Props) {
  return (
    <select
      id={id}
      name="jerseyNumber"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={className ?? "mt-2 h-12 w-full rounded-xl border border-border bg-bg-base px-3 text-base"}
    >
      <option value="">없음</option>
      {NUMBERS.map((number) => {
        const taken = takenNumbers.includes(number);
        return (
          <option key={number} value={number} disabled={taken}>
            {taken ? `${number} (사용 중)` : number}
          </option>
        );
      })}
    </select>
  );
}
