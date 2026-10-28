import { redirect } from "next/navigation";
import { categoryLabel, formatWon, isIncome } from "@/entities/ledger";
import { fetchLedgerEntries, fetchTeamLedgerSummary } from "@/entities/ledger/server";
import { fetchMyMember, fetchTakenJerseyNumbers } from "@/entities/member/server";
import { InstallAppCard } from "@/features/app-install";
import { changePassword, PasswordChangeForm } from "@/features/password-change";
import { ProfileForm, updateProfile } from "@/features/profile-edit";
import { isSignedInByLink } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { Panel, Screen } from "@/shared/ui";

export default async function MeView() {
  const me = await fetchMyMember();
  if (me === null) redirect(ROUTES.onboarding);
  const [takenNumbers, byLink, ledger, entries] = await Promise.all([
    fetchTakenJerseyNumbers(),
    isSignedInByLink(),
    fetchTeamLedgerSummary(),
    // 팀원은 지출과 내 납부만 받는다(RLS) — 다른 사람의 납부는 오지 않는다
    fetchLedgerEntries({ limit: 30 }),
  ]);
  const expenses = entries.filter((entry) => !isIncome(entry.category)).slice(0, 5);
  const mine = entries.filter((entry) => entry.memberId === me.id).slice(0, 5);
  const shortDate = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;

  return (
    <Screen title="내 정보" overline={me.realName} back={{ href: ROUTES.home, label: "홈" }} width="narrow">
      <Panel title="프로필" aside="실명은 관리자가 바꿔요">
        <ProfileForm
          action={updateProfile}
          feet={me.feet}
          preferredPositions={me.preferredPositions}
          jerseyNumber={me.jerseyNumber}
          takenNumbers={takenNumbers}
        />
      </Panel>
      {byLink ? (
        // 개인 링크로 들어온 계정은 비밀번호가 없다(PLAN.md §4)
        <Panel title="개인 링크로 들어왔어요">
          <p className="text-sm leading-6 text-text-secondary">
            이 휴대폰에서는 계속 들어와 있어요. 로그아웃했거나 휴대폰을 바꿨으면 관리자에게 새 링크를 받아 주세요.
          </p>
        </Panel>
      ) : (
        <Panel title="비밀번호">
          <p className="mb-4 text-xs text-text-tertiary">관리자에게 받은 임시 비밀번호로 들어왔다면 여기서 바꿔 주세요.</p>
          <PasswordChangeForm action={changePassword} />
        </Panel>
      )}
      {/* 장부 공개(PLAN.md §10): 팀 잔액 · 최근 지출 · 내 납부. 다른 사람의 납부는 보이지 않는다 */}
      <Panel title="회비 · 장부" aside={`잔액 ${formatWon(ledger.balance)}`} flush>
        <div className="grid grid-cols-2 gap-px border-b border-border bg-border text-sm">
          <p className="bg-bg-panel px-3 py-2 md:px-4">
            <span className="block text-xs text-text-secondary">모두 들어온 돈</span>
            <span className="font-bold tabular-nums">{formatWon(ledger.income)}</span>
          </p>
          <p className="bg-bg-panel px-3 py-2 md:px-4">
            <span className="block text-xs text-text-secondary">모두 쓴 돈</span>
            <span className="font-bold tabular-nums">{formatWon(ledger.expense)}</span>
          </p>
        </div>
        {[
          { title: "최근 지출", rows: expenses, empty: "아직 쓴 돈이 없어요." },
          { title: "내 납부", rows: mine, empty: "아직 낸 기록이 없어요." },
        ].map(({ title, rows, empty }) => (
          <section key={title} className="border-b border-border last:border-b-0">
            <h3 className="bg-bg-subtle px-3 py-1.5 text-xs font-bold text-text-secondary md:px-4">{title}</h3>
            {rows.length === 0 ? (
              <p className="px-3 py-2 text-sm text-text-tertiary md:px-4">{empty}</p>
            ) : (
              <ul>
                {rows.map((entry) => (
                  <li key={entry.id} className="flex items-center gap-3 px-3 py-2 text-sm even:bg-bg-row md:px-4">
                    <span className="w-10 shrink-0 text-xs text-text-tertiary tabular-nums">{shortDate(entry.date)}</span>
                    <span className="min-w-0 flex-1 truncate">
                      {categoryLabel(entry.category)}
                      {entry.memo && <span className="text-text-tertiary"> · {entry.memo}</span>}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">{formatWon(entry.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </Panel>
      <InstallAppCard />
    </Screen>
  );
}
