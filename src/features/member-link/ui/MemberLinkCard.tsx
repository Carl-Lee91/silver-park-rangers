"use client";

import { ActionButton, CopyButton, fieldClass, type ActionState } from "@/shared/ui";
import { memberLinkMessage } from "../model/message";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  memberId: string;
  memberName: string;
  /** 개인 링크 절대 주소. 아직 없으면 null */
  url: string | null;
};

/**
 * 선수 상세의 개인 링크(PLAN.md §4). 안내 문구와 같이 복사해 카톡 1:1 로 보낸다. 잃어버렸거나 다른 사람에게 갔으면
 * 새로 만든다 — 예전 링크는 더 안 열린다.
 */
export default function MemberLinkCard({ action, memberId, memberName, url }: Props) {
  if (url === null) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-text-secondary">
          아직 개인 링크가 없어요. 만들어서 보내면 {memberName}님은 가입 없이 링크 하나로 들어와요.
        </p>
        <ActionButton action={action} fields={{ memberId }} label="링크 만들기" tone="primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <input readOnly aria-label="개인 링크" value={url} onFocus={(event) => event.target.select()} className={fieldClass("md")} />
      <CopyButton
        text={memberLinkMessage(memberName, url)}
        label="안내 문구와 같이 복사"
        done={`복사했어요. ${memberName}님과의 카톡 1:1 에 붙여 넣으세요.`}
        className="h-11 w-full rounded-box bg-primary px-3 text-sm font-bold text-primary-contrast"
      />
      <ActionButton
        action={action}
        fields={{ memberId }}
        label="새 링크 만들기"
        tone="danger"
        confirmMessage={`${memberName}님의 링크를 새로 만들까요? 예전 링크는 더 열리지 않아요. 이미 들어가 있는 기기는 로그아웃할 때까지 그대로예요.`}
      />
    </div>
  );
}
