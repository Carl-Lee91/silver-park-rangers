import Link from "next/link";
import { redirect } from "next/navigation";
import { fetchLinkMember } from "@/entities/member/server";
import { enterWithLink, LinkLoginForm, linkLoginStep } from "@/features/link-login";
import { getAuthUserId, hasServiceRoleKey } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { isUuid } from "@/shared/lib";
import { Emblem, Panel, Screen } from "@/shared/ui";

/**
 * 개인 링크(PLAN.md §4). 관리자가 카톡 1:1 로 보낸 링크를 열면 "○○님으로 들어가기" 단추 하나다.
 * 누르면 이 기기에서 그 사람으로 로그인된 채 홈으로 간다. 이미 그 사람이면 묻지 않고 홈으로 간다.
 * 로그인 전에도 열린다(게이트 예외).
 */
export default async function LinkLoginView({ token }: { token: string }) {
  const [owner, userId] = await Promise.all([isUuid(token) ? fetchLinkMember(token) : null, getAuthUserId()]);
  const step = linkLoginStep(owner, userId);
  if (step === "signed-in") redirect(ROUTES.home);

  return (
    <Screen title="들어가기" overline="Silver Park Rangers" width="narrow" className="md:pt-10">
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <Emblem label="Silver Park Rangers" className="size-20" />
        <p className="mt-2 text-xl font-extrabold">Silver Park Rangers</p>
      </div>

      {owner === null ? (
        <Panel title="링크가 맞지 않아요">
          <p className="text-sm leading-6 text-text-secondary">
            새 링크로 바뀌었거나 더 쓰지 않는 링크예요. 관리자에게 새 링크를 받아 주세요.
          </p>
          <Link
            href={ROUTES.login}
            className="mt-4 flex h-12 items-center justify-center rounded-box border border-border-strong bg-bg-subtle text-base font-semibold"
          >
            이메일로 로그인
          </Link>
        </Panel>
      ) : (
        <Panel title="개인 링크">
          <p className="text-center text-2xl font-extrabold">
            {owner.jerseyNumber !== null && <span className="mr-2 text-text-tertiary tabular-nums">{owner.jerseyNumber}</span>}
            {owner.realName}님
          </p>
          <p className="mt-2 mb-5 text-center text-sm leading-6 text-text-secondary">
            가입 없이 이 링크로 들어가요. 한 번 들어가면 이 휴대폰에서는 단톡방의 매치 링크도 바로 열려요.
          </p>
          <LinkLoginForm
            action={enterWithLink}
            token={token}
            memberName={owner.realName}
            ready={hasServiceRoleKey()}
            switching={step === "switch"}
          />
        </Panel>
      )}

      <p className="text-xs leading-5 text-text-tertiary">
        이 링크는 {owner === null ? "한 사람" : `${owner.realName}님`} 전용이에요. 다른 사람에게 보내지 말아 주세요.
      </p>
    </Screen>
  );
}
