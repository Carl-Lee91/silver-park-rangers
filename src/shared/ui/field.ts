const HEIGHTS = {
  /** 폼 화면(가입 신청·내 정보·매치 만들기) */
  lg: "h-12",
  /** 좁은 자리(빌더 패널·골 기록 줄). 그래도 44px 이다 */
  md: "h-11",
} as const;

/**
 * 입력칸(input · select · textarea) 공통 모양. 앱의 입력칸은 모두 이것을 쓴다.
 *
 * - 글자 16px(text-base): 그보다 작으면 아이폰(카톡 인앱 포함)이 누를 때 화면을 확대하고 돌아오지 않는다.
 * - 채운 바탕(bg-field)과 잘 보이는 테두리(border-field-border, 3:1 이상): 어두운 바탕에서도 "칸"으로 보인다.
 * - 누르면 강조색 테두리: 지금 어디에 쓰고 있는지 보인다.
 */
export const fieldClass = (size: keyof typeof HEIGHTS = "lg", extra = "") =>
  [
    "w-full rounded-xl border border-field-border bg-field px-4 text-base text-text-primary",
    "placeholder:text-text-tertiary focus:border-primary focus:outline-none disabled:opacity-50",
    HEIGHTS[size],
    extra,
  ]
    .filter(Boolean)
    .join(" ");

/** 여러 줄 입력칸(textarea). 높이는 줄 수로 정한다 */
export const textareaClass = (extra = "") =>
  [
    "w-full rounded-xl border border-field-border bg-field px-4 py-3 text-base text-text-primary",
    "placeholder:text-text-tertiary focus:border-primary focus:outline-none",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
