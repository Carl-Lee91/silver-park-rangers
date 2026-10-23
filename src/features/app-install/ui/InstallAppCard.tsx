"use client";

import { Download, EllipsisVertical, ExternalLink, Share, SquarePlus } from "lucide-react";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { Panel } from "@/shared/ui";
import { getInstallState, listenForInstallPrompt, promptInstall, subscribeInstallState } from "../model/installPrompt";
import { installGuide, openInExternalBrowser, type InstallGuide } from "../model/platform";

/** "다음에"를 누른 때(ms). 그 기기에서 2주 동안 접힌 자리(로그인 · 홈)에 안 보인다 */
export const DISMISS_KEY = "spr.installCard.dismissedAt";
const DISMISS_MS = 14 * 24 * 60 * 60 * 1000;
const DISMISS_EVENT = "spr-install-card-dismiss";

const subscribeDismiss = (notify: () => void) => {
  window.addEventListener(DISMISS_EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(DISMISS_EVENT, notify);
    window.removeEventListener("storage", notify);
  };
};

/** 지금 접혀 있는지. 저장소를 못 쓰는 브라우저(사생활 모드 등)는 접지 않은 것으로 본다 */
const readDismissed = () => {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < DISMISS_MS;
  } catch {
    return false;
  }
};

const dismiss = () => {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // 저장소를 못 쓰면 이번 화면에서만 접는다.
  }
  window.dispatchEvent(new Event(DISMISS_EVENT));
};

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches === true ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** 이 기기의 설치 방법. 서버에서 그릴 때와 첫 그리기는 null(기기를 모른다) */
const useGuide = (): InstallGuide | "done" | null => {
  const install = useSyncExternalStore(subscribeInstallState, getInstallState, () => null);
  useEffect(() => listenForInstallPrompt(), []);
  if (install === null) return null;
  if (install.installed && !isStandalone()) return "done";
  return installGuide({
    userAgent: navigator.userAgent,
    standalone: isStandalone(),
    canPrompt: install.canPrompt,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
  });
};

const PRIMARY = "flex h-12 w-full items-center justify-center gap-2 rounded-box bg-primary text-base font-bold text-primary-contrast";

function Steps({ children }: { children: ReactNode }) {
  return (
    <ol aria-label="설치 순서" className="flex flex-col gap-2 text-sm">
      {children}
    </ol>
  );
}

function Step({ index, icon, children }: { index: number; icon?: ReactNode; children: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-bg-subtle text-xs font-bold text-text-secondary">
        {index}
      </span>
      {icon}
      <span>{children}</span>
    </li>
  );
}

const ICON = "size-5 shrink-0 text-primary";

function Body({ guide }: { guide: InstallGuide | "done" }) {
  switch (guide) {
    case "prompt":
      return (
        <>
          <p className="text-sm text-text-secondary">홈 화면에 아이콘이 생기고, 주소창 없이 앱처럼 바로 열려요.</p>
          <button type="button" onClick={() => void promptInstall()} className={PRIMARY}>
            <Download aria-hidden="true" className="size-5" />앱 설치
          </button>
        </>
      );
    case "android":
      return (
        <Steps>
          <Step index={1} icon={<EllipsisVertical aria-hidden="true" className={ICON} />}>
            브라우저 오른쪽 위 메뉴를 눌러요.
          </Step>
          <Step index={2} icon={<SquarePlus aria-hidden="true" className={ICON} />}>
            &apos;앱 설치&apos; 또는 &apos;홈 화면에 추가&apos;를 눌러요.
          </Step>
        </Steps>
      );
    case "ios":
      return (
        <>
          <Steps>
            <Step index={1} icon={<Share aria-hidden="true" className={ICON} />}>
              화면 아래(또는 위)의 공유 버튼을 눌러요.
            </Step>
            <Step index={2} icon={<SquarePlus aria-hidden="true" className={ICON} />}>
              &apos;홈 화면에 추가&apos;를 눌러요.
            </Step>
            <Step index={3}>오른쪽 위 &apos;추가&apos;를 눌러요.</Step>
          </Steps>
          <p className="text-xs text-text-tertiary">아이폰은 설치한 앱에서 한 번 더 로그인해요.</p>
        </>
      );
    case "kakao-android":
    case "kakao-ios":
      return (
        <>
          <p className="text-sm text-text-secondary">카톡 안에서는 설치할 수 없어요. 브라우저에서 열어 설치해요.</p>
          <button type="button" onClick={() => openInExternalBrowser(window.location.href)} className={PRIMARY}>
            <ExternalLink aria-hidden="true" className="size-5" />
            다른 브라우저로 열기
          </button>
          <p className="text-xs text-text-tertiary">
            {guide === "kakao-android"
              ? "안 열리면 화면 오른쪽 아래(또는 위) ⋮ 메뉴에서 '다른 브라우저로 열기'를 눌러 주세요."
              : "안 열리면 화면 오른쪽 아래 공유 버튼에서 'Safari로 열기'를 누른 뒤, Safari에서 공유 → '홈 화면에 추가'를 눌러요."}
          </p>
        </>
      );
    case "inapp":
      return (
        <p className="text-sm text-text-secondary">
          이 앱 안에서는 설치할 수 없어요. 메뉴에서 &apos;다른 브라우저로 열기&apos;(아이폰은 &apos;Safari로 열기&apos;)를 눌러 주세요.
        </p>
      );
    case "desktop":
      return (
        <p className="text-sm text-text-secondary">
          주소창 오른쪽의 설치 아이콘이나 브라우저 메뉴에서 &apos;앱 설치&apos;를 눌러요.
        </p>
      );
    case "done":
      return <p className="text-sm text-text-secondary">설치했어요. 홈 화면의 아이콘으로 열어 주세요.</p>;
    case "installed":
      return null;
  }
}

/**
 * 앱으로 설치(PLAN.md §7). 기기마다 설치하는 방법이 달라서 이 기기에 맞는 안내 하나만 보인다.
 * 브라우저의 설치 안내는 한 번 닫으면 다시 안 뜨므로, 이 패널이 늘 남아 있는 설치 단추다.
 *
 * - dismissible: 로그인 · 홈처럼 지나가는 자리. "다음에"로 그 기기에서 2주 동안 접는다.
 * - 내 정보에는 늘 둔다(dismissible 없음). 이미 앱으로 열었으면 아무것도 그리지 않는다.
 */
export default function InstallAppCard({ dismissible = false }: { dismissible?: boolean }) {
  const guide = useGuide();
  const dismissed = useSyncExternalStore(subscribeDismiss, readDismissed, () => true);

  if (guide === null || guide === "installed") return null;
  if (dismissible && dismissed) return null;

  return (
    <Panel title="앱으로 설치" aside="홈 화면에 아이콘">
      <div className="flex flex-col gap-3">
        <Body guide={guide} />
        {dismissible && (
          <button type="button" onClick={dismiss} className="h-11 self-center px-4 text-sm font-medium text-text-tertiary">
            다음에
          </button>
        )}
      </div>
    </Panel>
  );
}
