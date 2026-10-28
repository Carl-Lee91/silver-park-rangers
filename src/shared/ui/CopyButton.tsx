"use client";

import { useState } from "react";
import { textareaClass } from "./field";

type Props = {
  text: string;
  label: string;
  /** 복사한 뒤 단추 아래에 보일 안내 */
  done: string;
  className?: string;
};

const BUTTON = "h-11 w-full rounded-box border border-border-strong bg-bg-subtle px-3 text-sm font-semibold";

/**
 * 글(링크 · 단톡방 문구)을 복사하는 단추. 카톡 인앱 브라우저는 클립보드가 막혀 있을 때가 있어서, 그때는 글을
 * 그대로 보여 주고 길게 눌러 복사하게 한다(PLAN.md §2).
 */
export default function CopyButton({ text, label, done, className = BUTTON }: Props) {
  const [result, setResult] = useState<"idle" | "copied" | "manual">("idle");

  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setResult("copied");
    } catch {
      setResult("manual");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={copy} className={className}>
        {label}
      </button>
      {result === "copied" && (
        <p role="status" className="text-sm text-text-secondary">
          {done}
        </p>
      )}
      {result === "manual" && (
        <div>
          <p className="text-sm text-text-secondary">아래 글을 길게 눌러 복사해 주세요.</p>
          <textarea
            readOnly
            value={text}
            rows={Math.min(6, text.split("\n").length + 1)}
            onFocus={(event) => event.target.select()}
            className={textareaClass("mt-1")}
          />
        </div>
      )}
    </div>
  );
}
