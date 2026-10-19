import type { ReactNode } from "react";
import {
  canChangeRole,
  canChangeStatus,
  groupForAdmin,
  type AdminMember,
  type Gate,
} from "@/entities/member";
import { fetchAdminMembers, fetchMyGate } from "@/entities/member/server";
import { approveMember, rejectMember } from "@/features/member-approval";
import { setMemberRole, setMemberStatus, setMemberType } from "@/features/member-management";
import { ActionButton } from "@/shared/ui";
import MemberSummary from "./MemberSummary";

function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-text-secondary">
        {title} <span className="text-text-primary">{count}</span>
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: string }) {
  return <p className="rounded-xl bg-bg-subtle p-4 text-sm text-text-tertiary">{children}</p>;
}

/** 가입 신청(또는 거절했던 사람). 승인할 때 멤버/용병을 고른다. */
function ApplicantCard({ member }: { member: AdminMember }) {
  const fields = { memberId: member.id };
  return (
    <article className="rounded-xl border border-border p-4">
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
    <article className="rounded-xl border border-border p-4">
      <MemberSummary member={member} />
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
        </div>
      </details>
    </article>
  );
}

export default async function AdminMembersView() {
  const [viewer, members] = await Promise.all([fetchMyGate(), fetchAdminMembers()]);
  const groups = groupForAdmin(members);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-bold">멤버 관리</h1>

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
    </div>
  );
}
