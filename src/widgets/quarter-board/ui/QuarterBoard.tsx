"use client";

import { useState, type ReactNode } from "react";
import { Jersey, Pitch, PitchSpot } from "@/entities/formation";
import type { QuarterTime } from "@/entities/match";
import { rotationTable, type SavedQuarter } from "@/entities/squad";
import { TABLET_UP, useMediaQuery } from "@/shared/lib";
import { tabClass } from "@/shared/ui";

type Tips = Readonly<Record<string, ReactNode>>;

type Props = {
  quarters: readonly SavedQuarter[];
  schedule: readonly QuarterTime[];
  /** 출전표 이름 앞 ! 단추(선수 정보). 팀원 화면만 넘긴다 — 공유 링크는 없다 */
  tips?: Tips;
};

const ROTATION = "rotation";

function QuarterPitch({ quarter }: { quarter: SavedQuarter }) {
  return (
    <Pitch label={`${quarter.number}쿼터 경기장`}>
      {quarter.slots.map((slot) => (
        <PitchSpot key={slot.slotIndex} x={slot.x} y={slot.y}>
          <div className="flex w-16 flex-col items-center gap-0.5">
            <Jersey
              label={String(slot.jerseyNumber ?? slot.position)}
              tone={slot.memberName === null ? "empty" : slot.position === "GK" ? "keeper" : "kit"}
            />
            {slot.memberName && (
              <span className="max-w-16 truncate rounded-chip bg-bg-base/80 px-1 text-[11px] font-semibold text-text-primary">{slot.memberName}</span>
            )}
          </div>
        </PitchSpot>
      ))}
    </Pitch>
  );
}

function RotationTable({ quarters, tips }: { quarters: readonly SavedQuarter[]; tips?: Tips }) {
  const rows = rotationTable(quarters);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-center text-sm whitespace-nowrap">
        <thead>
          <tr className="border-b border-border-strong text-xs text-text-tertiary">
            <th className="sticky left-0 bg-bg-panel py-2 pr-2 pl-2 text-left font-semibold">이름</th>
            {quarters.map((item) => (
              <th key={item.number} className="px-1 py-2 font-semibold">
                {item.number}Q
              </th>
            ))}
            <th className="px-2 py-2 font-semibold">출전</th>
          </tr>
        </thead>
        <tbody>
          {/* 풋볼매니저 표처럼 줄무늬. 이름 칸은 옆으로 밀어도 왼쪽에 붙어 있다 */}
          {rows.map((row) => (
            <tr key={row.memberId} className="border-b border-border odd:bg-bg-panel even:bg-bg-row">
              <td className="sticky left-0 bg-inherit py-2 pr-2 pl-2 text-left font-semibold">
                {tips?.[row.memberId] && <span className="mr-1 inline-flex align-middle">{tips[row.memberId]}</span>}
                {row.jerseyNumber !== null && <span className="text-xs font-normal text-text-tertiary">{row.jerseyNumber} </span>}
                {row.name}
              </td>
              {row.marks.map((mark, index) => (
                <td key={index} className={mark === "keeper" ? "text-xs font-bold text-text-secondary" : "text-primary"}>
                  {mark === "field" ? "●" : mark === "keeper" ? "GK" : ""}
                </td>
              ))}
              <td className="px-2 font-bold tabular-nums">{row.fieldCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-text-tertiary">GK 로 뛴 쿼터는 출전 수에 넣지 않아요.</p>
    </div>
  );
}

/**
 * 공개된 스쿼드를 보여 준다(PLAN.md §7). 쿼터마다 포메이션 그림, 그리고 출전표(사람 × 쿼터).
 * 키퍼 쿼터는 GK 로 따로 표시하고 출전 수에 넣지 않는다.
 *
 * 좁은 화면(모바일)은 탭으로 하나씩, 태블릿 이상은 모든 쿼터와 출전표를 한눈에 보여 준다.
 * 한 줄에 몇 쿼터를 놓을지는 놓인 자리의 폭(컨테이너 쿼리)으로 정한다 — 매치 화면의 오른쪽 칸처럼
 * 화면은 넓어도 자리가 좁을 수 있다. 28rem(@md) 부터 두 쿼터, 48rem(@3xl) 부터 세 쿼터다. 매치 화면
 * 오른쪽 칸(35rem 쯤)이 두 쿼터가 되게 잡았다 — 기준이 이보다 크면 경기장 하나가 칸 폭만큼 커진다.
 */
export default function QuarterBoard({ quarters, schedule, tips }: Props) {
  const wide = useMediaQuery(TABLET_UP);
  const [tab, setTab] = useState<number | typeof ROTATION>(0);
  const quarter = typeof tab === "number" ? quarters[tab] : null;

  if (wide) {
    return (
      <div className="@container flex flex-col gap-8">
        <div className="grid gap-6 @md:grid-cols-2 @3xl:grid-cols-3">
          {quarters.map((item) => (
            <figure key={item.number} className="flex flex-col gap-2">
              <figcaption className="flex items-baseline gap-2 text-sm">
                <span className="font-extrabold">{item.number}쿼터</span>
                <span className="text-xs text-text-tertiary tabular-nums">
                  {schedule[item.number - 1]?.startsAt} · {item.formationName}
                </span>
              </figcaption>
              <QuarterPitch quarter={item} />
            </figure>
          ))}
        </div>
        <section>
          <h3 className="mb-2 text-xs font-bold tracking-wider text-text-secondary">출전표</h3>
          <RotationTable quarters={quarters} tips={tips} />
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="쿼터 보드" className="-mx-3 -mt-3 flex overflow-x-auto border-b border-border px-1">
        {quarters.map((item, index) => (
          <button
            key={item.number}
            role="tab"
            type="button"
            aria-selected={tab === index}
            onClick={() => setTab(index)}
            className={tabClass()}
          >
            {item.number}쿼터 <span className="text-xs font-normal opacity-80">{schedule[item.number - 1]?.startsAt}</span>
          </button>
        ))}
        <button role="tab" type="button" aria-selected={tab === ROTATION} onClick={() => setTab(ROTATION)} className={tabClass()}>
          출전표
        </button>
      </div>

      {quarter !== null ? (
        <>
          <p className="text-xs text-text-tertiary">{quarter.formationName}</p>
          <QuarterPitch quarter={quarter} />
        </>
      ) : (
        <RotationTable quarters={quarters} tips={tips} />
      )}
    </div>
  );
}
