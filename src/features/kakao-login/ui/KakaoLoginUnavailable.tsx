/**
 * Supabase 에 카카오 제공자가 아직 켜지지 않았을 때 로그인 단추 자리에 둔다.
 * 조용히 단추를 숨기면 무엇을 안 했는지 알 수 없다(CLAUDE.md "외부 연동").
 */
export default function KakaoLoginUnavailable() {
  return (
    <div role="status" className="rounded-xl border border-border bg-bg-subtle p-4 text-sm leading-6">
      <p className="font-semibold">카카오 로그인이 아직 켜지지 않았어요.</p>
      <p className="mt-1 text-text-secondary">
        Supabase 대시보드 › Authentication › Sign In / Providers › Kakao 를 켜면 이 자리에 로그인 단추가
        나타나요.
      </p>
    </div>
  );
}
