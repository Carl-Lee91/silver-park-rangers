import Spinner from "./Spinner";

/**
 * 화면을 불러오는 동안 보이는 자리(`loading.tsx`). 금방 뜨는 화면에서는 깜빡이지 않게
 * 조금 늦게 나타난다(animate-fade-in-delayed).
 */
export default function PageLoading({ label = "불러오는 중이에요" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-1 animate-fade-in-delayed flex-col items-center justify-center gap-3 py-24 text-sm text-text-secondary"
    >
      <Spinner size="lg" />
      <span>{label}</span>
    </div>
  );
}
