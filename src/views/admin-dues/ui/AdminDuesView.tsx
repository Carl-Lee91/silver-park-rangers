import Link from "next/link";
import type { ReactNode } from "react";
import { fetchMatchAttendance } from "@/entities/attendance/server";
import {
  categoryLabel,
  duesChecklist,
  duesReminderText,
  formatWon,
  isIncome,
  ledgerTotals,
  matchChecklist,
  monthLabel,
  monthOptions,
  type LedgerEntry,
  type SettlementRow,
} from "@/entities/ledger";
import { fetchDuesSettings, fetchLedgerEntries } from "@/entities/ledger/server";
import { formatMatchDate, matchTitle, seoulToday } from "@/entities/match";
import { fetchPastMatches, fetchUpcomingMatches } from "@/entities/match/server";
import { fetchAdminMembers } from "@/entities/member/server";
import { addEntry, deleteEntry, EntryForm, recordPayment, saveDuesSettings, SettingsForm } from "@/features/ledger-record";
import { ROUTES } from "@/shared/config";
import { ActionButton, chipClass, CopyButton, Panel, Screen, tabClass } from "@/shared/ui";

/** 회비 체크표에 볼 달 수(이번 달부터 거꾸로) */
const MONTHS = 6;
/** 경기비 · 벌금을 볼 최근 매치 수(오늘 매치 포함) */
const RECENT_MATCHES = 5;

const shortDate = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;

function Tile({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  const color = tone === "good" ? "text-result-win" : tone === "bad" ? "text-danger" : "";
  return (
    <div className="rounded-box border border-border bg-bg-panel px-3 py-2.5">
      <p className="text-xs font-semibold text-text-secondary">{label}</p>
      <p className={`mt-0.5 text-xl font-extrabold tracking-tight tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function PersonName({ number, name }: { number: number | null; name: string }) {
  return (
    <span className="min-w-0 flex-1 truncate font-semibold">
      {number !== null && <span className="mr-1 text-xs text-text-tertiary tabular-nums">{number}</span>}
      {name}
    </span>
  );
}

/** 받음 / 냄 · 취소. 받은 줄이 있으면 날짜와 취소, 없으면 받음 단추 */
function PaidCell({ paid, fields, name }: { paid: LedgerEntry | null; fields: Record<string, string>; name: string }) {
  if (paid === null) {
    return (
      <div className="w-24 shrink-0">
        <ActionButton action={recordPayment} fields={fields} label="받음" tone="primary" />
      </div>
    );
  }
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className={chipClass("good")}>냄 {shortDate(paid.date)}</span>
      <div className="w-20">
        <ActionButton
          action={deleteEntry}
          fields={{ entryId: paid.id }}
          label="취소"
          tone="danger"
          confirmMessage={`${name}님의 ${categoryLabel(paid.category)} ${formatWon(paid.amount)} 받음을 취소할까요? 장부에서 지워져요.`}
        />
      </div>
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <li className="flex min-h-14 items-center gap-3 px-3 py-1.5 even:bg-bg-row md:px-4">{children}</li>;
}

/**
 * 회비 · 벌금 장부(PLAN.md §10, 관리자). 월회비 체크표(달 탭) · 지난 매치의 경기비 · 벌금 · 장부(직접 적기) · 금액 설정.
 * 받을 사람은 계산하고, 받은 돈만 장부에 남긴다. 돈은 모임통장으로 받고 여기서는 "누가 냈나"만 체크한다.
 */
export default async function AdminDuesView({ month: requested }: { month?: string }) {
  const today = seoulToday();
  const months = monthOptions(today, MONTHS);
  const month = requested !== undefined && months.includes(requested) ? requested : months[0];

  const [settings, members, entries, past, upcoming] = await Promise.all([
    fetchDuesSettings(),
    fetchAdminMembers(),
    fetchLedgerEntries(),
    fetchPastMatches(today, RECENT_MATCHES),
    fetchUpcomingMatches(today),
  ]);
  const recent = [...upcoming.filter((match) => match.date === today), ...past].slice(0, RECENT_MATCHES);
  const attendance = await Promise.all(recent.map((match) => fetchMatchAttendance(match.id)));

  const totals = ledgerTotals(entries);
  const monthEntries = entries.filter((entry) => entry.date.startsWith(month));
  const monthTotals = ledgerTotals(monthEntries);
  const label = monthLabel(month, today);

  // 월회비는 멤버만 낸다(용병 · 그날 용병은 경기비). 구분은 관리자 화면이라 볼 수 있다.
  const payers = members.filter((member) => member.status === "approved" && member.guestMatchId === null && member.memberType === "member");
  const dues = duesChecklist(payers, entries, month);
  const unpaid = dues.filter((row) => row.paid === null);

  const guestIds = new Set(members.filter((member) => member.memberType === "guest").map((member) => member.id));
  const settlement: SettlementRow[] = recent.flatMap((match, index) =>
    attendance[index].flatMap((row) =>
      row.realName === null
        ? []
        : [{ matchId: match.id, memberId: row.memberId, realName: row.realName, jerseyNumber: row.jerseyNumber, response: row.response, attended: row.attended }],
    ),
  );
  // 금액을 0 으로 둔 항목은 받지 않는다. 이미 받은 줄은 그대로 보인다.
  const feeOf = { match_fee: settings.matchFee, fine: settings.noShowFine };
  const matchDues = matchChecklist(settlement, guestIds, entries).filter((row) => feeOf[row.category] > 0 || row.paid !== null);

  return (
    <Screen title="회비" overline={`장부 · ${label}`} width="wide">
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        <Tile label="잔액" value={formatWon(totals.balance)} tone={totals.balance < 0 ? "bad" : undefined} />
        <Tile label={`${label} 수입`} value={formatWon(monthTotals.income)} tone="good" />
        <Tile label={`${label} 지출`} value={formatWon(monthTotals.expense)} />
      </div>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
        <div className="flex flex-col gap-4 lg:gap-6">
          <Panel
            title="월회비"
            aside={settings.monthlyFee > 0 ? `${dues.length - unpaid.length}/${dues.length}명 · ${formatWon(settings.monthlyFee)}` : "금액 미정"}
            flush
          >
            <nav aria-label="회비 달" className="flex overflow-x-auto border-b border-border px-1">
              {months.map((option) => (
                <Link
                  key={option}
                  href={`${ROUTES.adminDues}?month=${option}`}
                  aria-current={option === month ? "page" : undefined}
                  className={tabClass()}
                >
                  {monthLabel(option, today)}
                </Link>
              ))}
            </nav>
            {settings.monthlyFee === 0 ? (
              <p className="p-3 text-sm text-text-secondary md:p-4">아래 금액 설정에서 월회비를 정하면 낸 사람을 체크할 수 있어요.</p>
            ) : dues.length === 0 ? (
              <p className="p-3 text-sm text-text-secondary md:p-4">월회비를 낼 멤버가 없어요. 용병은 경기비를 내요.</p>
            ) : (
              <>
                <ul>
                  {dues.map(({ member, paid }) => (
                    <Row key={member.id}>
                      <PersonName number={member.jerseyNumber} name={member.realName} />
                      <PaidCell paid={paid} name={member.realName} fields={{ kind: "dues", memberId: member.id, month }} />
                    </Row>
                  ))}
                </ul>
                {unpaid.length > 0 && (
                  <div className="border-t border-border p-3 md:p-4">
                    <CopyButton
                      text={duesReminderText({ month: label, names: unpaid.map((row) => row.member.realName), fee: settings.monthlyFee })}
                      label={`미납 ${unpaid.length}명 독촉 문구 복사`}
                      done="복사했어요. 단톡방에 붙여 넣으세요."
                    />
                  </div>
                )}
              </>
            )}
          </Panel>

          <Panel title="경기비 · 벌금" aside={`최근 매치 ${recent.length}개`} flush>
            {settings.matchFee === 0 && settings.noShowFine === 0 && matchDues.length === 0 ? (
              <p className="p-3 text-sm text-text-secondary md:p-4">아래 금액 설정에서 경기비 · 노쇼 벌금을 정하면 받을 사람이 보여요.</p>
            ) : matchDues.length === 0 ? (
              <p className="p-3 text-sm text-text-secondary md:p-4">
                받을 사람이 없어요. 경기비는 용병 참석자, 벌금은 출석 확정에서 안 온 사람이에요.
              </p>
            ) : (
              recent
                .filter((match) => matchDues.some((row) => row.matchId === match.id))
                .map((match) => (
                  <section key={match.id} className="border-b border-border last:border-b-0">
                    <h3 className="bg-bg-subtle px-3 py-1.5 text-xs font-bold text-text-secondary md:px-4">
                      {formatMatchDate(match.date)} {matchTitle(match)}
                    </h3>
                    <ul>
                      {matchDues
                        .filter((row) => row.matchId === match.id)
                        .map((row) => (
                          <Row key={`${row.category}-${row.member.id}`}>
                            <span className={chipClass(row.category === "fine" ? "danger" : "muted")}>{categoryLabel(row.category)}</span>
                            <PersonName number={row.member.jerseyNumber} name={row.member.realName} />
                            <PaidCell
                              paid={row.paid}
                              name={row.member.realName}
                              fields={{ kind: row.category, memberId: row.member.id, matchId: match.id }}
                            />
                          </Row>
                        ))}
                    </ul>
                  </section>
                ))
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-4 lg:gap-6">
          <Panel title="장부" aside={`${label} · ${monthEntries.length}줄`} flush>
            <details className="border-b border-border p-3 md:p-4">
              <summary className="cursor-pointer text-sm font-semibold">장부에 적기(구장비 · 용품 · 기타)</summary>
              <div className="mt-4">
                <EntryForm action={addEntry} today={today} />
              </div>
            </details>
            {monthEntries.length === 0 ? (
              <p className="p-3 text-sm text-text-secondary md:p-4">{label}에 적은 것이 없어요.</p>
            ) : (
              <ul>
                {monthEntries.map((entry) => (
                  <Row key={entry.id}>
                    <span className="w-10 shrink-0 text-xs text-text-tertiary tabular-nums">{shortDate(entry.date)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{categoryLabel(entry.category)}</span>
                      {(entry.payerName ?? entry.memo) && (
                        <span className="block truncate text-xs text-text-tertiary">
                          {[entry.payerName, entry.duesMonth && `${monthLabel(entry.duesMonth, today)} 몫`, entry.memo].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </span>
                    <span className={`shrink-0 text-sm font-bold tabular-nums ${isIncome(entry.category) ? "text-result-win" : ""}`}>
                      {isIncome(entry.category) ? "+" : "−"}
                      {formatWon(entry.amount)}
                    </span>
                    <div className="w-20 shrink-0">
                      <ActionButton
                        action={deleteEntry}
                        fields={{ entryId: entry.id }}
                        label="지우기"
                        tone="danger"
                        confirmMessage={`${shortDate(entry.date)} ${categoryLabel(entry.category)} ${formatWon(entry.amount)} 을 장부에서 지울까요?`}
                      />
                    </div>
                  </Row>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="금액 설정">
            <SettingsForm action={saveDuesSettings} settings={settings} />
          </Panel>
        </div>
      </div>
    </Screen>
  );
}
