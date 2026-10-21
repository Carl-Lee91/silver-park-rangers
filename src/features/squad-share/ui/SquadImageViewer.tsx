"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Spinner } from "@/shared/ui";
import { readImageParam, withImageParam, type ImageKind } from "../model/imageParam";

type Urls = Record<ImageKind, string>;

const LABELS: Record<ImageKind, string> = { quarters: "쿼터별", rotation: "출전표" };
const KINDS: ImageKind[] = ["quarters", "rotation"];

/** 우리가 주소를 바꿨을 때 알리는 이벤트. 뒤로 가기는 popstate 로 온다. */
const CHANGE = "squad-image-change";

const subscribe = (onChange: () => void) => {
  window.addEventListener("popstate", onChange);
  window.addEventListener(CHANGE, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(CHANGE, onChange);
  };
};

/** 이 화면 주소의 ?image= 를 바꾼다. Next.js 는 history API 를 라우터와 맞춰 주고, 서버를 다시 부르지 않는다. */
const setImageParam = (kind: ImageKind | null, mode: "push" | "replace") => {
  const { pathname, search, hash } = window.location;
  const url = `${pathname}${withImageParam(search, kind)}${hash}`;
  if (mode === "push") window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
  window.dispatchEvent(new Event(CHANGE));
};

function LoadingImage({ src, alt, onRetry }: { src: string; alt: string; onRetry: () => void }) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <>
      {state === "loading" && (
        <div role="status" className="flex flex-col items-center gap-3 py-24 text-sm text-text-secondary">
          <Spinner size="lg" />
          <span>이미지를 만드는 중이에요</span>
        </div>
      )}
      {state === "error" && (
        <div role="alert" className="flex flex-col items-center gap-3 py-24 text-sm">
          <p>이미지를 만들지 못했어요.</p>
          <button type="button" onClick={onRetry} className="h-10 rounded-lg border border-border px-4 font-medium">
            다시 시도
          </button>
        </div>
      )}
      {/* 그리는 동안에도 불러오도록 늘 두고, 다 될 때까지 숨긴다. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- 서버가 그린 PNG 를 그대로 보여 주고, 길게 눌러 저장하게 한다 */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setState("loaded")}
        onError={() => setState("error")}
        style={state === "loaded" ? undefined : { display: "none" }}
        className="h-auto w-full rounded-lg"
      />
    </>
  );
}

/**
 * 쿼터별·출전표 이미지를 **앱 안에서** 연다(PLAN.md §8).
 *
 * 새 창(`target="_blank"`)으로 열면 홈 화면에 추가한 앱(PWA)이 창을 하나 더 띄워 시작 화면이 다시 뜨고,
 * 뒤로 가기를 누르면 그 창이 닫히며 앱이 꺼진다. 그래서 같은 화면 위에 덮어 열고, 주소에 `?image=` 를 남겨
 * 뒤로 가기가 이 보기만 닫게 한다. 저장은 "이미지 저장"(내려받기) 또는 길게 눌러 저장한다 —
 * 카톡 인앱 브라우저는 내려받기가 막힐 때가 있다.
 */
export default function SquadImageViewer({ urls, fileName }: { urls: Urls; fileName: string }) {
  const search = useSyncExternalStore(subscribe, () => window.location.search, () => "");
  const kind = readImageParam(search);
  // 이 화면에서 연 것이면 뒤로 가기로 닫는다. 주소를 달고 바로 들어왔으면 그 표시만 지운다.
  const pushed = useRef(false);
  const [attempt, setAttempt] = useState(0);

  const open = (next: ImageKind) => {
    pushed.current = true;
    setAttempt(0);
    setImageParam(next, "push");
  };
  const close = useCallback(() => {
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
    } else {
      setImageParam(null, "replace");
    }
  }, []);

  useEffect(() => {
    if (kind === null) {
      pushed.current = false;
      return;
    }
    // 뒤의 화면이 같이 스크롤되지 않게 막고, 데스크톱에서는 Esc 로 닫는다.
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [kind, close]);

  const src = kind === null ? "" : attempt === 0 ? urls[kind] : `${urls[kind]}${urls[kind].includes("?") ? "&" : "?"}retry=${attempt}`;

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {KINDS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => open(value)}
            className="flex h-10 items-center justify-center rounded-lg border border-border text-sm font-medium"
          >
            {LABELS[value]} 이미지
          </button>
        ))}
      </div>

      {kind !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${LABELS[kind]} 이미지`}
          className="fixed inset-0 z-40 flex flex-col bg-bg-base"
        >
          <header className="flex items-center gap-3 border-b border-border px-4 py-2">
            <button type="button" onClick={close} className="h-10 shrink-0 rounded-lg pr-2 text-sm font-medium">
              <span aria-hidden>←</span> 닫기
            </button>
            <div role="tablist" className="ml-auto grid grid-cols-2 gap-1 rounded-lg bg-bg-subtle p-1">
              {KINDS.map((value) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={value === kind}
                  onClick={() => {
                    setAttempt(0);
                    setImageParam(value, "replace");
                  }}
                  className="h-8 rounded-md px-3 text-sm font-medium text-text-secondary aria-selected:bg-bg-base aria-selected:text-text-primary"
                >
                  {LABELS[value]}
                </button>
              ))}
            </div>
          </header>
          <div className="mx-auto w-full max-w-100 flex-1 overflow-y-auto px-4 py-4">
            <LoadingImage
              key={src}
              src={src}
              alt={`${LABELS[kind]} 이미지`}
              onRetry={() => setAttempt((count) => count + 1)}
            />
          </div>
          <footer className="mx-auto flex w-full max-w-100 flex-col gap-2 border-t border-border px-4 py-3">
            <a
              href={urls[kind]}
              download={`${fileName} ${LABELS[kind]}.png`}
              className="flex h-11 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-contrast"
            >
              이미지 저장
            </a>
            <p className="text-center text-xs text-text-tertiary">저장이 안 되면 이미지를 길게 눌러 저장해 주세요.</p>
          </footer>
        </div>
      )}
    </>
  );
}
