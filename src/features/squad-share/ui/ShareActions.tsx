"use client";

import { useState } from "react";

type Props = {
  /** 절대 주소(https://…/s/[token]). 카톡에 붙이면 미리보기 카드가 뜬다 */
  shareUrl: string;
  title: string;
  imageUrls: { quarters: string; rotation: string };
};

type Result = "idle" | "copied" | "manual";

/**
 * 공유 링크 보내기와 이미지 열기(PLAN.md §8).
 *
 * 공유 시트(navigator.share)가 있으면 그것을 쓰고, 없으면 복사한다. 카톡 인앱 브라우저는
 * 둘 다 막혀 있을 때가 있어서, 그때는 주소를 보여 주고 길게 눌러 복사하게 한다.
 * 이미지는 새 창으로 연다 — 다운로드는 인앱 브라우저에서 잘 안 되지만 길게 눌러 저장은 된다.
 */
export default function ShareActions({ shareUrl, title, imageUrls }: Props) {
  const [result, setResult] = useState<Result>("idle");

  const share = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch {
        // 사용자가 닫았거나 막혔다. 아래 복사로 넘어간다.
      }
    }
    try {
      if (!navigator.clipboard) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(shareUrl);
      setResult("copied");
    } catch {
      setResult("manual");
    }
  };

  const link = "flex h-10 items-center justify-center rounded-lg border border-border text-sm font-medium";

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={share}
        className="h-11 rounded-lg bg-kakao text-sm font-semibold text-kakao-label"
      >
        공유하기
      </button>
      {result === "copied" && <p className="text-sm text-text-secondary">링크를 복사했어요. 카톡에 붙여 넣으세요.</p>}
      {result === "manual" && (
        <div>
          <p className="text-sm text-text-secondary">아래 주소를 길게 눌러 복사해 주세요.</p>
          <input
            readOnly
            value={shareUrl}
            onFocus={(event) => event.target.select()}
            className="mt-1 h-10 w-full rounded-lg border border-border px-3 text-sm"
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <a href={imageUrls.quarters} target="_blank" rel="noopener" className={link}>
          쿼터별 이미지
        </a>
        <a href={imageUrls.rotation} target="_blank" rel="noopener" className={link}>
          출전표 이미지
        </a>
      </div>
    </div>
  );
}
