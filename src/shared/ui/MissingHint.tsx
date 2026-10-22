/**
 * 막힌 제출 단추 아래에 둔다: "남은 것: 실명 · 선호 포지션 2개 더".
 * 무엇이 빠져서 안 눌리는지 모르면 사람들이 멈춘다. 알림 자리(role=status)는 늘 두어서 바뀌면 스크린리더가 읽는다.
 */
export default function MissingHint({ items }: { items: readonly string[] }) {
  return (
    <p role="status" aria-live="polite" className="-mt-4 text-center text-xs text-text-tertiary">
      {items.length > 0 && `남은 것: ${items.join(" · ")}`}
    </p>
  );
}
