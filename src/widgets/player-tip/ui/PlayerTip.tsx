"use client";

import { CircleAlert } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { footLabel, type Member } from "@/entities/member";
import { positionLabel } from "@/entities/position";
import { RatingSummary, type RatingValues } from "@/entities/rating";

/** 툴팁에 보이는 사람 정보. 멤버/용병 구분은 넣지 않는다(팀원 화면에도 나간다) */
export type PlayerProfile = Pick<Member, "id" | "realName" | "jerseyNumber" | "preferredPositions" | "feet">;

type Props = {
  profile: PlayerProfile;
  /** 매기지 않았으면 null */
  ratings: RatingValues | null;
  /** 관리자가 볼 때만 true. 팀원 화면에는 능력치를 넘기지도 않는다 */
  showRatings: boolean;
};

/** 단추와 툴팁 사이, 화면 가장자리와 툴팁 사이 */
const GAP = 4;
const EDGE = 8;

/**
 * 선수 이름 앞 ! 단추(PLAN.md §7 "선수 정보"). 휴대폰은 누르면 열리고(다시 누르거나 Esc · 바깥을 누르면 닫힌다),
 * 데스크톱은 마우스를 올리기만 해도 뜬다. 선호 포지션 · 주발, 관리자에게는 능력치 막대까지 보인다.
 *
 * 패널 · 표는 넘치는 부분을 자르므로 툴팁은 화면 맨 위 층(body)에 띄우고, 단추 아래(모자라면 위)에 둔다.
 * 스크롤하면 닫는다 — 단추가 움직여도 툴팁은 따라가지 않아서.
 */
export default function PlayerTip({ profile, ratings, showRatings }: Props) {
  const [open, setOpen] = useState<"click" | "hover" | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const id = useId();

  useLayoutEffect(() => {
    if (open === null || button.current === null || bubble.current === null) return;
    const anchor = button.current.getBoundingClientRect();
    const box = bubble.current.getBoundingClientRect();
    const below = anchor.bottom + GAP;
    const above = anchor.top - GAP - box.height;
    const top = below + box.height > window.innerHeight - EDGE && above >= EDGE ? above : below;
    const left = Math.max(EDGE, Math.min(anchor.left, window.innerWidth - box.width - EDGE));
    bubble.current.style.top = `${top}px`;
    bubble.current.style.left = `${left}px`;
  }, [open]);

  useEffect(() => {
    if (open === null) return;
    const close = () => setOpen(null);
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!button.current?.contains(target) && !bubble.current?.contains(target)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={`${profile.realName} 선수 정보`}
        aria-expanded={open !== null}
        aria-describedby={open === null ? undefined : id}
        onClick={() => setOpen((current) => (current === "click" ? null : "click"))}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setOpen((current) => current ?? "hover");
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setOpen((current) => (current === "hover" ? null : current));
        }}
        className="-mx-3 -my-3 inline-flex size-11 shrink-0 items-center justify-center align-middle text-text-tertiary hover:text-primary aria-expanded:text-primary"
      >
        <CircleAlert aria-hidden="true" className="size-4" />
      </button>
      {open !== null &&
        createPortal(
          <div
            ref={bubble}
            id={id}
            role="tooltip"
            className="fixed z-50 w-64 rounded-box border border-border-strong bg-bg-subtle text-left text-sm font-normal text-text-primary shadow-lg"
          >
            <p className="flex items-baseline gap-1.5 border-b border-border px-3 py-2 font-bold">
              {profile.jerseyNumber !== null && <span className="text-xs text-text-tertiary tabular-nums">{profile.jerseyNumber}</span>}
              {profile.realName}
            </p>
            <dl className="flex flex-col gap-1 px-3 py-2 text-xs">
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-text-tertiary">선호 포지션</dt>
                <dd>{profile.preferredPositions.map((code, index) => `${index + 1} ${positionLabel(code)}`).join(" · ")}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-16 shrink-0 text-text-tertiary">주발</dt>
                <dd>{profile.feet.map(footLabel).join(" · ")}</dd>
              </div>
            </dl>
            {showRatings && (
              <div className="border-t border-border px-3 py-2">
                <RatingSummary values={ratings} />
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
