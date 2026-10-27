import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { positionLabel } from "@/entities/position";
import { adminMatchPath, adminMemberPath } from "@/shared/config";
import { ActionButton } from "@/shared/ui";
import { addMatchGuest, removeMatchGuest, updateMatchGuest } from "../api/actions";
import GuestForm, { type GuestValues } from "./GuestForm";

/**
 * 관리자 매치 화면의 그날 용병(PLAN.md §4). 계정 없이 이 매치에만 들어가는 용병을 넣고·고치고·뺀다.
 * 넣은 사람은 참석으로 잡혀 스쿼드 빌더 벤치에 오른다. 이름을 누르면 선수 상세(능력치)로 간다.
 */
export default function MatchGuests({
  matchId,
  guests,
  tips,
}: {
  matchId: string;
  guests: readonly GuestValues[];
  /** 이름 앞 ! 단추(선수 정보). 링크 밖에 둔다 */
  tips?: Readonly<Record<string, ReactNode>>;
}) {
  return (
    <div className="flex flex-col gap-4">
      {guests.length === 0 ? (
        <p className="rounded-box bg-bg-subtle p-4 text-sm text-text-tertiary">아직 그날 용병이 없어요.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {guests.map((guest) => (
            <li key={guest.id} className="rounded-box border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                {tips?.[guest.id] && <span className="flex h-11 shrink-0 items-center pl-1">{tips[guest.id]}</span>}
                <Link href={adminMemberPath(guest.id, adminMatchPath(matchId))} className="-m-1 flex min-w-0 flex-1 items-center gap-2 rounded-box p-1">
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">
                      {guest.jerseyNumber !== null && <span className="mr-1 text-text-tertiary">{guest.jerseyNumber}</span>}
                      {guest.realName}
                    </span>
                    <span className="mt-0.5 block text-xs text-text-tertiary">{guest.preferredPositions.map(positionLabel).join(" · ")}</span>
                  </span>
                  <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-text-tertiary" />
                </Link>
                <div className="w-20 shrink-0">
                  <ActionButton
                    action={removeMatchGuest}
                    fields={{ matchId, memberId: guest.id }}
                    label="빼기"
                    tone="danger"
                    confirmMessage={`${guest.realName}님을 이 매치에서 뺄까요? 스쿼드의 그 자리는 빈칸이 돼요.`}
                  />
                </div>
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-text-secondary">고치기</summary>
                <div className="mt-3">
                  <GuestForm action={updateMatchGuest} matchId={matchId} submitLabel="저장" guest={guest} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
      <details className="rounded-box border border-border p-4" open={guests.length === 0}>
        <summary className="cursor-pointer text-sm font-semibold">용병 넣기</summary>
        <div className="mt-4">
          <GuestForm action={addMatchGuest} matchId={matchId} submitLabel="용병 넣기" />
        </div>
      </details>
    </div>
  );
}
