import type { SelectHTMLAttributes } from "react";
import { fieldClass } from "./field";

// size 는 브라우저 드롭다운의 기본 속성(보이는 줄 수)이라 이름을 피한다.
type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  /** 높이. 폼 화면은 lg, 좁은 자리는 md */
  fieldSize?: "lg" | "md";
};

/**
 * 드롭다운. 브라우저 기본 화살표는 테두리에 붙어서(8px 안쪽) 숨기고, 오른쪽 16px 안쪽에 꺾쇠를 직접 그린다.
 * 글자가 꺾쇠 밑으로 들어가지 않게 오른쪽을 비운다(pr-11). 앱의 드롭다운은 모두 이것을 쓴다.
 *
 * `className` 은 감싸는 칸에 준다(여백·폭). 드롭다운 자체는 늘 칸을 꽉 채운다.
 */
export default function Select({ fieldSize = "lg", className = "", children, ...props }: Props) {
  return (
    <div className={`relative ${className}`.trim()}>
      <select {...props} className={fieldClass(fieldSize, "appearance-none pr-11")}>
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-text-secondary"
      >
        <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
