"use client";

import { useEffect, useState } from "react";
import { liveQuarter, seoulClock, type QuarterTime } from "@/entities/match";
import { positionLabel, type Position } from "@/entities/position";
import { tabClass } from "@/shared/ui";

type Person = { name: string; jerseyNumber: number | null };

/** 쿼터 하나의 교체 안내(화면이 `quarterChanges` 로 만든다) */
export type LiveQuarterPlan = {
  number: number;
  formationName: string;
  comingIn: (Person & { position: Position })[];
  goingOut: (Person & { position: Position })[];
  moved: (Person & { from: Position; to: Position })[];
};

type Props = {
  schedule: readonly QuarterTime[];
  plans: readonly LiveQuarterPlan[];
  /** 오늘 매치인지. 아니면 시계 없이 교체만 미리 본다 */
  today: boolean;
  /** 지금 시각(테스트용) */
  now?: () => Date;
};

/** 시계를 다시 보는 간격. 분 단위로 보이므로 30초면 충분하다 */
const TICK_MS = 30_000;
const systemNow = () => new Date();

const label = (person: Person) => (person.jerseyNumber === null ? person.name : `${person.jerseyNumber} ${person.name}`);

function Group({ title, tone, items }: { title: string; tone: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className={`text-xs font-bold ${tone}`}>{title}</p>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item} className="rounded-chip bg-bg-subtle px-3 py-2 text-base font-semibold">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * 현장 모드의 쿼터 시계 · 교체 안내(PLAN.md §10). 구장에서 휴대폰으로 본다 — 지금 몇 쿼터이고 몇 분 남았는지,
 * 다음 쿼터에 누가 들어가고 나오는지를 큰 글씨로. 쿼터 탭으로 다른 쿼터도 본다.
 */
export default function LiveBoard({ schedule, plans, today, now = systemNow }: Props) {
  const [clock, setClock] = useState(() => seoulClock(now()));
  useEffect(() => {
    if (!today) return;
    const timer = setInterval(() => setClock(seoulClock(now())), TICK_MS);
    return () => clearInterval(timer);
  }, [today, now]);

  const live = today ? liveQuarter(schedule, clock) : null;
  // 기본으로 볼 쿼터: 경기 중이면 다음 쿼터(마지막이면 그 쿼터), 시작 전이면 1쿼터, 끝났으면 마지막
  const upcoming =
    live?.state === "playing" ? Math.min(live.index + 1, schedule.length - 1) : live?.state === "after" ? schedule.length - 1 : 0;
  const [picked, setPicked] = useState<number | null>(null);
  const shown = picked ?? upcoming;
  const plan = plans[shown];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-box bg-bg-subtle p-4 text-center">
        {live === null ? (
          <p className="text-sm text-text-secondary">오늘 매치가 아니에요. 쿼터를 골라 교체를 미리 볼 수 있어요.</p>
        ) : live.state === "before" ? (
          <>
            <p className="text-2xl font-extrabold">시작 전</p>
            <p className="mt-1 text-sm text-text-secondary">
              {live.startsIn}분 뒤 1쿼터 · {schedule[0].startsAt}
            </p>
          </>
        ) : live.state === "playing" ? (
          <>
            <p className="text-2xl font-extrabold">{live.index + 1}쿼터 경기 중</p>
            <p className="mt-1 text-sm text-text-secondary tabular-nums">
              {live.remaining}분 남음 · {schedule[live.index].startsAt}~{schedule[live.index].endsAt}
            </p>
          </>
        ) : (
          <p className="text-2xl font-extrabold">경기 끝</p>
        )}
      </div>

      <div role="tablist" aria-label="쿼터" className="flex overflow-x-auto border-b border-border">
        {schedule.map((quarter, index) => (
          <button
            key={quarter.startsAt}
            type="button"
            role="tab"
            aria-selected={index === shown}
            onClick={() => setPicked(index)}
            className={tabClass()}
          >
            {index + 1}쿼터
          </button>
        ))}
      </div>

      {plan && (
        <section className="flex flex-col gap-3">
          <h3 className="text-base font-bold">
            {plan.number}쿼터 교체 · {schedule[shown].startsAt}
          </h3>
          <p className="-mt-2 text-xs text-text-tertiary">{plan.formationName}</p>
          {plan.comingIn.length + plan.goingOut.length + plan.moved.length === 0 ? (
            <p className="text-sm text-text-secondary">바뀌는 사람이 없어요.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              <Group
                title="들어감"
                tone="text-result-win"
                items={plan.comingIn.map((person) => `${label(person)} (${positionLabel(person.position)})`)}
              />
              <Group
                title="나옴"
                tone="text-danger"
                items={plan.goingOut.map((person) => `${label(person)} (${positionLabel(person.position)})`)}
              />
              <Group
                title="자리 바꿈"
                tone="text-primary"
                items={plan.moved.map((person) => `${label(person)} ${positionLabel(person.from)} → ${positionLabel(person.to)}`)}
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
