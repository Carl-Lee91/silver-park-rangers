"use client";

import { useState } from "react";
import { Pitch, PitchSpot } from "@/entities/formation";
import type { QuarterTime } from "@/entities/match";
import { rotationTable, type SavedQuarter } from "@/entities/squad";

type Props = { quarters: readonly SavedQuarter[]; schedule: readonly QuarterTime[] };

const ROTATION = "rotation";

/**
 * 공개된 스쿼드를 보여 준다(PLAN.md §7). 쿼터마다 포메이션 그림, 그리고 출전표(사람 × 쿼터).
 * 키퍼 쿼터는 GK 로 따로 표시하고 출전 수에 넣지 않는다.
 */
export default function QuarterBoard({ quarters, schedule }: Props) {
  const [tab, setTab] = useState<number | typeof ROTATION>(0);
  const rows = rotationTable(quarters);
  const quarter = typeof tab === "number" ? quarters[tab] : null;

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="쿼터 보드" className="-mx-4 flex gap-2 overflow-x-auto px-4">
        {quarters.map((item, index) => (
          <button
            key={item.number}
            role="tab"
            type="button"
            aria-selected={tab === index}
            onClick={() => setTab(index)}
            className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm aria-selected:border-primary aria-selected:bg-primary aria-selected:text-primary-contrast"
          >
            {item.number}쿼터 <span className="text-xs opacity-80">{schedule[item.number - 1]?.startsAt}</span>
          </button>
        ))}
        <button
          role="tab"
          type="button"
          aria-selected={tab === ROTATION}
          onClick={() => setTab(ROTATION)}
          className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm aria-selected:border-primary aria-selected:bg-primary aria-selected:text-primary-contrast"
        >
          출전표
        </button>
      </div>

      {quarter !== null ? (
        <>
          <p className="text-sm text-text-secondary">{quarter.formationName}</p>
          <Pitch label={`${quarter.number}쿼터 경기장`}>
            {quarter.slots.map((slot) => (
              <PitchSpot key={slot.slotIndex} x={slot.x} y={slot.y}>
                <div className="flex w-16 flex-col items-center gap-0.5">
                  <span
                    className={`flex size-9 items-center justify-center rounded-full text-[11px] font-bold ${
                      slot.memberName === null
                        ? "border border-dashed border-white/80 text-white"
                        : slot.position === "GK"
                          ? "bg-kakao text-kakao-label"
                          : "bg-white text-text-primary"
                    }`}
                  >
                    {slot.position}
                  </span>
                  {slot.memberName && (
                    <span className="max-w-16 truncate rounded bg-black/40 px-1 text-[11px] text-white">
                      {slot.memberName}
                    </span>
                  )}
                </div>
              </PitchSpot>
            ))}
          </Pitch>
        </>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full text-center text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-text-secondary">
                <th className="py-2 text-left font-medium">이름</th>
                {quarters.map((item) => (
                  <th key={item.number} className="py-2 font-medium">
                    {item.number}Q
                  </th>
                ))}
                <th className="py-2 font-medium">출전</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.memberId} className="border-b border-border">
                  <td className="py-2 text-left">{row.name}</td>
                  {row.marks.map((mark, index) => (
                    <td key={index} className={mark === "keeper" ? "text-xs font-bold text-text-secondary" : "text-primary"}>
                      {mark === "field" ? "●" : mark === "keeper" ? "GK" : ""}
                    </td>
                  ))}
                  <td className="font-semibold">{row.fieldCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-text-tertiary">GK 로 뛴 쿼터는 출전 수에 넣지 않아요.</p>
        </div>
      )}
    </div>
  );
}
