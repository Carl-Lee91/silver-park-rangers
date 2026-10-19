import { KakaoLoginButton, KakaoLoginUnavailable, loginErrorMessage } from "@/features/kakao-login";
import { isKakaoLoginReady } from "@/features/kakao-login/server";

export default async function LoginView({ error }: { error: string | null }) {
  const ready = await isKakaoLoginReady();
  const message = loginErrorMessage(error);

  return (
    <main className="mx-auto flex w-full max-w-100 flex-1 flex-col justify-center gap-10 px-4 py-12">
      <header>
        <p className="text-sm font-medium text-primary">우리 팀 전용</p>
        <h1 className="mt-1 text-2xl font-bold">Silver Park Rangers</h1>
        <p className="mt-2 text-sm text-text-secondary">참석 투표부터 쿼터별 스쿼드까지 한곳에서.</p>
      </header>

      <div className="flex flex-col gap-3">
        {message && (
          <p role="alert" className="text-sm text-danger">
            {message}
          </p>
        )}
        {ready ? <KakaoLoginButton /> : <KakaoLoginUnavailable />}
      </div>

      <p className="text-xs leading-5 text-text-tertiary">
        처음이면 로그인한 뒤 실명을 입력하고 운영진 승인을 기다려 주세요. 승인된 사람만 쓸 수 있어요.
      </p>
    </main>
  );
}
