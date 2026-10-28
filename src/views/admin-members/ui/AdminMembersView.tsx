import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  canChangeRole,
  canChangeStatus,
  canResetPassword,
  groupForAdmin,
  takenJerseyNumbers,
  type AdminMember,
  type Gate,
} from "@/entities/member";
import { fetchAdminMembers, fetchMyGate } from "@/entities/member/server";
import { approveMember, rejectMember } from "@/features/member-approval";
import {
  resetPassword,
  setMemberRole,
  setMemberStatus,
  setMemberType,
  TemporaryPasswordButton,
} from "@/features/member-management";
import { MemberProfileForm, registerMember } from "@/features/member-register";
import { adminMemberPath } from "@/shared/config";
import { ActionButton, Panel, Screen } from "@/shared/ui";
import MemberSummary from "./MemberSummary";

/** 패널 안에 칸을 이어 붙인다(칸 사이 1px 선). 넓은 화면은 두세 칸씩 */
function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <Panel title={title} aside={`${count}명`} flush>
      <div className="grid gap-px bg-border md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </Panel>
  );
}

function Empty({ children }: { children: string }) {
  return <p className="col-span-full bg-bg-panel p-3 text-sm text-text-tertiary md:p-4">{children}</p>;
}

/** 가입 신청(또는 거절했던 사람). 승인할 때 멤버/용병을 고른다. */
function ApplicantCard({ member }: { member: AdminMember }) {
  const fields = { memberId: member.id };
  return (
    <article className="bg-bg-panel p-3 md:p-4">
      <MemberSummary member={member} showApplied />
      <div className="mt-4 grid grid-cols-3 gap-2">
        <ActionButton action={approveMember} fields={{ ...fields, kind: "member" }} label="멤버로 승인" tone="primary" />
        <ActionButton action={approveMember} fields={{ ...fields, kind: "guest" }} label="용병으로 승인" />
        {member.status === "pending" && (
          <ActionButton
            action={rejectMember}
            fields={fields}
            label="거절"
            tone="danger"
            confirmMessage={`${member.realName}님의 가입 신청을 거절할까요?`}
          />
        )}
      </div>
    </article>
  );
}

/** 승인된(또는 휴면) 멤버. 보는 사람의 권한에 맞는 단추만 보인다. */
function MemberCard({ member, viewer }: { member: AdminMember; viewer: Gate }) {
  const fields = { memberId: member.id };
  const inactive = member.status === "inactive";

  return (
    <article className="bg-bg-panel p-3 md:p-4">
      {/* 누르면 선수 상세(능력치 · 올해 기록)로 간다 */}
      <Link href={adminMemberPath(member.id)} className="-m-1 flex items-center gap-2 rounded-box p-1">
        <span className="min-w-0 flex-1">
          <MemberSummary member={member} />
        </span>
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-text-tertiary" />
      </Link>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-text-secondary">관리</summary>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <ActionButton
            action={setMemberType}
            fields={{ ...fields, kind: member.memberType === "guest" ? "member" : "guest" }}
            label={member.memberType === "guest" ? "멤버로 바꾸기" : "용병으로 바꾸기"}
          />
          {canChangeStatus(viewer, member) &&
            (inactive ? (
              <ActionButton action={setMemberStatus} fields={{ ...fields, next: "approved" }} label="복귀" />
            ) : (
              <ActionButton
                action={setMemberStatus}
                fields={{ ...fields, next: "inactive" }}
                label="휴면 처리"
                tone="danger"
                confirmMessage={`${member.realName}님을 휴면 처리할까요? 앱을 쓸 수 없게 돼요.`}
              />
            ))}
          {canChangeRole(viewer) &&
            !inactive &&
            (member.role === "admin" ? (
              <ActionButton
                action={setMemberRole}
                fields={{ ...fields, next: "user" }}
                label="관리자 해제"
                tone="danger"
                confirmMessage={`${member.realName}님의 관리자 권한을 해제할까요?`}
              />
            ) : (
              <ActionButton
                action={setMemberRole}
                fields={{ ...fields, next: "admin" }}
                label="관리자로 지정"
                confirmMessage={`${member.realName}님을 관리자로 지정할까요? 가입 승인과 멤버 관리를 할 수 있게 돼요.`}
              />
            ))}
          {canResetPassword(viewer, member) && member.login === "email" && (
            <TemporaryPasswordButton action={resetPassword} memberId={member.id} memberName={member.realName} />
          )}
        </div>
      </details>
    </article>
  );
}

export default async function AdminMembersView() {
  const [viewer, members] = await Promise.all([fetchMyGate(), fetchAdminMembers()]);
  const groups = groupForAdmin(members);

  return (
    <Screen title="멤버 관리" overline="스쿼드 명단" width="wide">
      {/* 가입이 어려운 팀원은 관리자가 명단에 넣고 개인 링크를 보낸다(PLAN.md §4 관리자 등록) */}
      <Panel title="선수 등록" aside="가입 없이">
        <details>
          <summary className="cursor-pointer text-sm font-semibold">선수 등록하기</summary>
          <p className="mt-2 text-xs leading-5 text-text-tertiary">
            가입하기 어려운 팀원을 명단에 바로 넣어요. 등록한 뒤 선수 상세에서 개인 링크를 카톡으로 보내면, 링크 하나로
            들어와 투표해요.
          </p>
          <div className="mt-4 md:max-w-narrow">
            <MemberProfileForm action={registerMember} takenNumbers={takenJerseyNumbers(members)} />
          </div>
        </details>
      </Panel>

      <Section title="가입 신청" count={groups.pending.length}>
        {groups.pending.length === 0 ? (
          <Empty>새 가입 신청이 없어요.</Empty>
        ) : (
          groups.pending.map((member) => <ApplicantCard key={member.id} member={member} />)
        )}
      </Section>

      <Section title="멤버" count={groups.approved.length}>
        {groups.approved.length === 0 ? (
          <Empty>아직 승인된 멤버가 없어요.</Empty>
        ) : (
          groups.approved.map((member) => <MemberCard key={member.id} member={member} viewer={viewer} />)
        )}
      </Section>

      {groups.inactive.length > 0 && (
        <Section title="휴면" count={groups.inactive.length}>
          {groups.inactive.map((member) => (
            <MemberCard key={member.id} member={member} viewer={viewer} />
          ))}
        </Section>
      )}

      {groups.rejected.length > 0 && (
        <Section title="거절" count={groups.rejected.length}>
          {groups.rejected.map((member) => (
            <ApplicantCard key={member.id} member={member} />
          ))}
        </Section>
      )}
    </Screen>
  );
}
