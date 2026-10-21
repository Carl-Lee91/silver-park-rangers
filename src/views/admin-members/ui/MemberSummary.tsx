import { footLabel, type AdminMember } from "@/entities/member";
import { positionLabel } from "@/entities/position";

const appliedAt = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  timeZone: "Asia/Seoul",
});

function Badge({ children, tone }: { children: string; tone: "primary" | "neutral" }) {
  const color = tone === "primary" ? "bg-primary text-primary-contrast" : "bg-bg-subtle text-text-secondary";
  return <span className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${color}`}>{children}</span>;
}

/** 누구인지 확인하는 데 필요한 것: 실명, 로그인 이메일, 선호 포지션·주발 */
export default function MemberSummary({ member, showApplied = false }: { member: AdminMember; showApplied?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-bg-subtle text-sm font-bold text-text-secondary">
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
          {member.email ?? "이메일 없음"}
          {showApplied && ` · ${appliedAt.format(new Date(member.createdAt))} 신청`}
        </p>
        <p className="mt-1 text-xs text-text-tertiary">
          {member.preferredPositions.map(positionLabel).join(" · ")} | {member.feet.map(footLabel).join("·")}
        </p>
      </div>
    </div>
  );
}
