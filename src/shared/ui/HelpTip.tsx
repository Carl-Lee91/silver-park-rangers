"use client";

import { CircleHelp } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

const BUBBLE =
  "absolute top-full left-0 z-30 mt-1 w-56 rounded-box border border-border-strong bg-bg-subtle px-3 py-2 text-xs leading-5 font-normal text-text-primary shadow-lg";

/**
 * 이름 옆 ? 설명 단추. 휴대폰은 누르면 열리고(다시 누르거나 Esc · 다른 곳을 누르면 닫힌다),
 * 데스크톱은 마우스를 올리기만 해도 뜬다. 아이콘은 작아도 누르는 영역은 44px 이다.
 */
export default function HelpTip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-label={`${label} 설명`}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((value) => !value)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
        className="-mx-3 -my-3 inline-flex size-11 items-center justify-center text-text-tertiary hover:text-primary aria-expanded:text-primary"
      >
        <CircleHelp aria-hidden="true" className="size-4" />
      </button>
      {open ? (
        <span id={id} role="tooltip" className={BUBBLE}>
          {children}
        </span>
      ) : (
        // 마우스를 올렸을 때만 보이는 같은 설명. 누르면 위의 것(읽히는 설명)으로 바뀐다
        <span data-help-text aria-hidden="true" className={`hidden group-hover:block ${BUBBLE}`}>
          {children}
        </span>
      )}
    </span>
  );
}
