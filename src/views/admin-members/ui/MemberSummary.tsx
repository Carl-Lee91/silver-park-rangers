import { footLabel, loginNote, type AdminMember } from "@/entities/member";
import { positionLabel } from "@/entities/position";
import { chipClass } from "@/shared/ui";

const appliedAt = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  timeZone: "Asia/Seoul",
});

function Badge({ children, tone }: { children: string; tone: "primary" | "neutral" }) {
  return <span className={chipClass(tone === "primary" ? "accent" : "muted")}>{children}</span>;
}

/** 누구인지 확인하는 데 필요한 것: 실명, 어떻게 들어오는지(이메일 · 개인 링크), 선호 포지션·주발 */
export default function MemberSummary({ member, showApplied = false }: { member: AdminMember; showApplied?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border-strong bg-bg-subtle text-sm font-bold text-text-secondary">
        {member.realName.slice(0, 1)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold">
            {member.jerseyNumber !== null && <span className="mr-1 text-text-tertiary">{member.jerseyNumber}</span>}
            {member.realName}
          </span>
          {member.role === "admin" && <Badge tone="primary">관리자</Badge>}
          {member.memberType === "guest" && <Badge tone="neutral">용병</Badge>}
        </p>
        <p className="mt-0.5 truncate text-xs text-text-secondary">
          {loginNote(member)}
          {showApplied && ` · ${appliedAt.format(new Date(member.createdAt))} 신청`}
        </p>
        <p className="mt-1 text-xs text-text-tertiary">
          {member.preferredPositions.map(positionLabel).join(" · ")} | {member.feet.map(footLabel).join("·")}
        </p>
      </div>
    </div>
  );
}
