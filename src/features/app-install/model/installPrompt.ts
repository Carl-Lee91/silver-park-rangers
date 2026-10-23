/**
 * 브라우저 설치 창(beforeinstallprompt) 맡아 두기. 크롬은 이 이벤트를 화면이 뜬 뒤 아무 때나 한 번 보낸다 —
 * 그때 받아 두었다가 "앱 설치" 단추를 누를 때 띄운다. 브라우저가 스스로 띄우는 배너는 막는다(한 번 닫으면
 * 몇 달 동안 안 뜨므로, 늘 남아 있는 우리 단추로 안내한다).
 *
 * 화면을 옮겨도 놓치지 않게 루트 레이아웃(InstallListener)에서 한 번 듣기 시작한다.
 */
type PromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallState = { canPrompt: boolean; installed: boolean };

let deferred: PromptEvent | null = null;
let state: InstallState = { canPrompt: false, installed: false };
let listening = false;
const subscribers = new Set<() => void>();

const update = (next: Partial<InstallState>) => {
  state = { ...state, ...next };
  subscribers.forEach((notify) => notify());
};

const onPrompt = (event: Event) => {
  event.preventDefault();
  deferred = event as PromptEvent;
  update({ canPrompt: true });
};

const onInstalled = () => {
  deferred = null;
  update({ canPrompt: false, installed: true });
};

/** 설치 창 이벤트를 듣기 시작한다. 여러 번 불러도 한 번만 듣는다 */
export const listenForInstallPrompt = () => {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("beforeinstallprompt", onPrompt);
  window.addEventListener("appinstalled", onInstalled);
};

export const subscribeInstallState = (notify: () => void) => {
  subscribers.add(notify);
  return () => {
    subscribers.delete(notify);
  };
};

export const getInstallState = () => state;

/** 받아 둔 설치 창을 띄운다. 설치 창은 한 번만 쓸 수 있다 */
export const promptInstall = async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
  const event = deferred;
  if (event === null) return "unavailable";
  deferred = null;
  update({ canPrompt: false });
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome;
};

/** 테스트끼리 섞이지 않게 처음 상태로 돌린다 */
export const resetInstallPromptForTest = () => {
  if (listening) {
    window.removeEventListener("beforeinstallprompt", onPrompt);
    window.removeEventListener("appinstalled", onInstalled);
  }
  listening = false;
  deferred = null;
  state = { canPrompt: false, installed: false };
  subscribers.clear();
};
