import { fetchTakenJerseyNumbers } from "@/entities/member/server";
import { signUp, SignUpForm, SignUpUnavailable } from "@/features/sign-up";
import { fetchSignUpAvailability } from "@/features/sign-up/server";
import { ROUTES } from "@/shared/config";
import { Panel, Screen } from "@/shared/ui";

/** 설정이 빠졌으면 무엇을 바꿀지부터 보인다. 그래야 DB 를 깔기 전에도 안내가 뜬다. */
async function SignUpBody() {
  const availability = await fetchSignUpAvailability();
  if (availability !== "ready" && availability !== "unknown") return <SignUpUnavailable reason={availability} />;
  return (
    <Panel title="가입 정보">
      <SignUpForm action={signUp} takenNumbers={await fetchTakenJerseyNumbers()} />
    </Panel>
  );
}

export default function SignUpView() {
  return (
    <Screen title="가입 신청" overline="Silver Park Rangers" back={{ href: ROUTES.login, label: "로그인" }} width="narrow">
      <p className="text-sm text-text-secondary">
        신청하면 관리자가 확인한 뒤 승인해요. 주발·포지션·등번호는 나중에 바꿀 수 있어요.
      </p>
      <SignUpBody />
    </Screen>
  );
}
