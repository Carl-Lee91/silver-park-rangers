"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

export type ConfirmOptions = {
  message: string;
  /** 확인 단추 이름. 할 일을 그대로 쓴다(예: "거절", "휴면 처리"). 없으면 "확인" */
  confirmLabel?: string;
  /** 되돌리기 어려운 일이면 danger — 확인 단추가 빨갛다 */
  tone?: "primary" | "danger";
};

function ConfirmDialog({ options, onAnswer }: { options: ConfirmOptions; onAnswer: (ok: boolean) => void }) {
  const id = useId();
  const confirmButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // 열면 확인 단추로, 닫으면 누른 단추로 초점을 돌려 둔다. Esc 는 취소다.
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    confirmButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onAnswer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [onAnswer]);

  return createPortal(
    <div
      data-testid="confirm-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onAnswer(false);
      }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-bg-base/70 md:items-center md:p-4"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-message`}
        aria-describedby={`${id}-message`}
        className="w-full max-w-narrow rounded-t-box border border-border bg-bg-subtle p-5 md:rounded-box"
      >
        <p id={`${id}-message`} className="text-base leading-7">
          {options.message}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onAnswer(false)} className="h-12 rounded-box border border-border text-base font-medium">
            취소
          </button>
          <button
            ref={confirmButton}
            type="button"
            onClick={() => onAnswer(true)}
            className={`h-12 rounded-box text-base font-semibold ${
              options.tone === "danger" ? "bg-danger text-bg-base" : "bg-primary text-primary-contrast"
            }`}
          >
            {options.confirmLabel ?? "확인"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * 브라우저 기본 confirm 대신 쓰는 확인 창. 기본 창은 휴대폰에서 사이트 주소가 붙은 시스템 창으로 떠서
 * 경고처럼 보이고 꾸밀 수 없다. 이 창은 휴대폰에서는 아래에서 올라오고, 넓은 화면에서는 가운데에 뜬다.
 *
 *   const { confirm, dialog } = useConfirm();
 *   if (await confirm({ message: "지울까요?", confirmLabel: "지우기", tone: "danger" })) …
 *   return <>…{dialog}</>;
 */
export const useConfirm = () => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback(
    (next: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setOptions(next);
      }),
    [],
  );
  const answer = useCallback((ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOptions(null);
  }, []);

  return { confirm, dialog: options === null ? null : <ConfirmDialog options={options} onAnswer={answer} /> };
};

/**
 * 폼을 보내기 전에 묻는다(거절·휴면·지우기처럼 되돌리기 번거로운 일). 물을 게 없으면(undefined) 그냥 보낸다.
 * 확인하면 폼을 다시 보낸다(requestSubmit) — 그래야 서버 동작과 보내는 중 표시(SubmitButton)가 그대로 돈다.
 */
export const useConfirmBeforeSubmit = (options: ConfirmOptions | undefined) => {
  const { confirm, dialog } = useConfirm();
  const formRef = useRef<HTMLFormElement>(null);
  const approved = useRef(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (options === undefined) return;
    if (approved.current) {
      approved.current = false;
      return;
    }
    event.preventDefault();
    void confirm(options).then((ok) => {
      if (!ok) return;
      approved.current = true;
      formRef.current?.requestSubmit();
    });
  };

  return { formRef, onSubmit, dialog };
};
