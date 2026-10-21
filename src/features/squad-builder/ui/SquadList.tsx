import type { ReactNode } from "react";
import { attendanceTimeNote } from "@/entities/attendance";
import type { Position } from "@/entities/position";
import { lineupOrder, placedIn, quarterMarks, type Builder, type Selection, type TapTarget } from "../model/builder";
import { fitOf, type Fit } from "../model/fit";
import { sortByFit, type BuilderPlayer } from "../model/pool";
import { BenchChip, BenchDropZone } from "./dnd";
import FitDot from "./FitDot";
import QuarterDots from "./QuarterDots";

type Props = {
  builder: Builder;
  quarter: number;
  pool: readonly BuilderPlayer[];
  selection: Selection;
  onTap: (target: TapTarget) => void;
  /** 출전 수 / 보장 수(또는 키퍼 쿼터). 자동 배치 대상이 아니면 null */
  statOf: (player: BuilderPlayer) => string | null;
  notes: Record<string, string>;
  seasonAverages: Record<string, number | null>;
};

const RESPONSE_BADGE = { maybe: "미정", no: "불참" } as const;

/*
  한 줄의 칸. 좁은 자리(모바일 · 태블릿)는 두 줄짜리 행이고(풋볼매니저 모바일), 넓은 자리(@xl)는
  한 줄짜리 표다(풋볼매니저 24 선수 표). 같은 칸을 자리 폭에 따라 옮길 뿐 두 번 그리지 않는다.
*/
const ROW =
  "grid w-full grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-0.5 rounded-lg px-2 py-1.5 text-left text-sm @xl:grid-cols-[2.25rem_minmax(0,1fr)_5.5rem_5rem_3.5rem_4.5rem_auto] @xl:gap-y-0";
const PRESSABLE = "even:bg-bg-subtle/50 aria-pressed:bg-primary/15 aria-pressed:ring-1 aria-pressed:ring-primary";

function PositionPill({ code, starter }: { code: Position | undefined; starter: boolean }) {
  return (
    <span
      className={`row-span-2 flex h-6 items-center justify-center rounded-md text-[11px] font-bold @xl:row-span-1 ${
        starter ? "bg-primary text-primary-contrast" : "bg-bg-subtle text-text-secondary"
      }`}
    >
      {code}
    </span>
  );
}

/** 넓은 자리에서는 칸마다, 좁은 자리에서는 · 로 이어서 둘째 줄에 */
function Meta({ items }: { items: { key: string; cell: string; content: ReactNode }[] }) {
  return (
    <span className="col-start-2 row-start-2 flex min-w-0 truncate text-xs text-text-secondary @xl:contents">
      {items.map((item, index) => (
        <span key={item.key} className={`shrink-0 @xl:row-start-1 @xl:truncate ${item.cell}`}>
          {index > 0 && <span className="px-1 @xl:hidden">·</span>}
          {item.content}
        </span>
      ))}
    </span>
  );
}

function PlayerCells({
  code,
  starter,
  player,
  fit,
  showFit,
  stat,
  note,
  average,
  marks,
}: {
  code: Position | undefined;
  starter: boolean;
  player: BuilderPlayer;
  fit: Fit | null;
  /** 순위 글자를 보인다(자리를 고른 벤치). 아니면 점만 이름 앞에 둔다 */
  showFit: boolean;
  stat: string | null;
  note: boolean;
  average: number | null | undefined;
  marks: ReactNode;
}) {
  const time = attendanceTimeNote(player);
  const badge = player.response === "maybe" || player.response === "no" ? RESPONSE_BADGE[player.response] : null;
  const meta = [
    { key: "pref", cell: "@xl:col-start-3", content: player.preferredPositions.join("·") },
    ...(time ? [{ key: "time", cell: "@xl:col-start-4", content: time }] : []),
    ...(average != null
      ? [
          {
            key: "avg",
            cell: "@xl:col-start-5",
            content: (
              <>
                <span className="@xl:sr-only">올해 평균 </span>
                {average.toFixed(1)}
              </>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <PositionPill code={code} starter={starter} />
      <span className="col-start-2 row-start-1 flex min-w-0 items-center gap-1.5">
        <span className="truncate font-semibold">
          {player.jerseyNumber !== null && <span className="mr-1 text-xs font-normal opacity-70">{player.jerseyNumber}</span>}
          {player.realName}
        </span>
        {fit !== null && <FitDot fit={fit} showLabel={showFit} className={showFit ? "" : "order-first"} />}
        {player.memberType === "guest" && <span className="shrink-0 text-xs opacity-70">용병</span>}
        {badge && <span className="shrink-0 text-xs text-danger">{badge}</span>}
        {note && <span className="shrink-0 text-xs opacity-70">메모</span>}
      </span>
      <span className="col-start-3 row-start-1 text-right text-xs font-semibold tabular-nums @xl:col-start-6">{stat}</span>
      <Meta items={meta} />
      <span className="col-start-3 row-start-2 justify-self-end @xl:col-start-7 @xl:row-start-1">{marks}</span>
    </>
  );
}

function SectionTitle({ title, count }: { title: string; count: string }) {
  return (
    <h3 className="mb-1 flex items-baseline gap-1.5 px-2 text-xs font-semibold text-text-secondary">
      {title} <span className="font-normal text-text-tertiary">{count}</span>
    </h3>
  );
}

/**
 * 선수 표. 풋볼매니저 24 전술 화면의 선수 선택 목록처럼 이 쿼터 선발(키퍼부터 뒤에서 앞으로), 벤치, 못 옴을
 * 나눠 보인다. 줄마다 선호 포지션 · 시간 · 출전 수 · 쿼터별 출전 점이 있다.
 *
 * - 선발 줄을 누르면 그 자리를 고른다(경기장 자리를 누른 것과 같다).
 * - 자리를 고르면 벤치를 그 자리에 맞는 사람부터 놓고 몇 순위인지 보인다.
 */
export default function SquadList({ builder, quarter, pool, selection, onTap, statOf, notes, seasonAverages }: Props) {
  const slots = builder[quarter].slots;
  const byId = new Map(pool.map((player) => [player.id, player]));
  const placed = placedIn(builder, quarter);
  const selectedPosition = selection?.kind === "slot" ? slots[selection.index].position : null;
  const bench = sortByFit(
    pool.filter((player) => !placed.has(player.id) && player.availableQuarters.includes(quarter)),
    selectedPosition,
  );
  const away = pool.filter((player) => !placed.has(player.id) && !player.availableQuarters.includes(quarter));
  const filled = slots.filter((slot) => slot.memberId !== null).length;
  const dotsOf = (player: BuilderPlayer) => (
    <QuarterDots marks={quarterMarks(builder, player.id, player.availableQuarters)} current={quarter} />
  );

  return (
    <div className="@container flex flex-col gap-4">
      <div aria-hidden="true" className={`${ROW} hidden py-0 text-[11px] text-text-tertiary @xl:grid`}>
        <span />
        <span>이름</span>
        <span>선호</span>
        <span>시간</span>
        <span>올해 평균</span>
        <span className="text-right">출전/보장</span>
        <span>쿼터별</span>
      </div>

      <section>
        <SectionTitle title="선발" count={`${filled}/${slots.length}`} />
        <div role="group" aria-label="선발" className="flex flex-col">
          {lineupOrder(slots).map((index) => {
            const slot = slots[index];
            const player = slot.memberId === null ? undefined : byId.get(slot.memberId);
            return (
              <button
                key={index}
                type="button"
                aria-pressed={selection?.kind === "slot" && selection.index === index}
                onClick={() => onTap({ kind: "slot", index })}
                className={`${ROW} ${PRESSABLE}`}
              >
                {player === undefined ? (
                  <>
                    <PositionPill code={slot.position} starter />{" "}
                    <span className="col-start-2 row-start-1 text-text-tertiary">
                      {slot.memberId === null ? "빈자리" : "알 수 없음"}
                    </span>
                  </>
                ) : (
                  <PlayerCells
                    code={slot.position}
                    starter
                    player={player}
                    fit={fitOf(player.preferredPositions, slot.position)}
                    showFit={false}
                    stat={statOf(player)}
                    note={Boolean(notes[player.id])}
                    average={seasonAverages[player.id]}
                    marks={dotsOf(player)}
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle title="벤치" count={String(bench.length)} />
        <BenchDropZone role="group" aria-label="벤치" className="flex flex-col">
          {bench.length === 0 && <p className="px-2 text-sm text-text-tertiary">이 쿼터에 남은 사람이 없어요.</p>}
          {bench.map((player) => (
            <BenchChip
              key={player.id}
              memberId={player.id}
              aria-pressed={selection?.kind === "bench" && selection.memberId === player.id}
              onClick={() => onTap({ kind: "bench", memberId: player.id })}
              className={`${ROW} ${PRESSABLE}`}
            >
              <PlayerCells
                code={player.preferredPositions[0]}
                starter={false}
                player={player}
                fit={selectedPosition === null ? null : fitOf(player.preferredPositions, selectedPosition)}
                showFit={selectedPosition !== null && fitOf(player.preferredPositions, selectedPosition) !== "poor"}
                stat={statOf(player)}
                note={Boolean(notes[player.id])}
                average={seasonAverages[player.id]}
                marks={dotsOf(player)}
              />
            </BenchChip>
          ))}
        </BenchDropZone>
        <p className="mt-2 px-2 text-xs text-text-tertiary">눌러서 고르고 놓거나, 길게 눌러 끌어다 놓아요.</p>
      </section>

      {away.length > 0 && (
        <section>
          <SectionTitle title="못 옴" count={String(away.length)} />
          <div role="group" aria-label="못 옴" className="flex flex-col">
            {away.map((player) => (
              <p key={player.id} className="flex items-center gap-2 px-2 py-1 text-xs text-text-tertiary">
                <span className="w-9 shrink-0 text-center font-bold">{player.preferredPositions[0]}</span>
                <span className="truncate">
                  {player.jerseyNumber !== null && `${player.jerseyNumber} `}
                  {player.realName}
                </span>
                <span className="shrink-0">{attendanceTimeNote(player) ?? "이 쿼터 불참"}</span>
              </p>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
