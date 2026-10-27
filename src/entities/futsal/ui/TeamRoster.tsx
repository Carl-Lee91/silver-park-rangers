import { Panel } from "@/shared/ui";
import type { TeamMember } from "../model/roster";
import { TEAM_LABELS } from "../model/teams";

/**
 * 풋살 팀 명단(팀원 화면 · 공유 링크). 팀마다 패널에 등번호 · 이름을 늘어놓는다. 경기 인원보다 많은 사람은
 * 그 팀의 교체다(누가 교체인지는 정하지 않는다 — 돌아가며 뛴다). 능력치 · 용병 구분은 없다.
 */
export default function TeamRoster({ teams, perSide }: { teams: readonly (readonly TeamMember[])[]; perSide: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {teams.map((team, index) => (
        <Panel
          key={TEAM_LABELS[index]}
          title={TEAM_LABELS[index]}
          aside={`${team.length}명${team.length > perSide ? ` · 교체 ${team.length - perSide}` : ""}`}
          flush
        >
          <ul className="divide-y divide-border">
            {team.map((member) => (
              <li key={`${member.jerseyNumber}-${member.name}`} className="flex min-h-10 items-center gap-2 px-3 text-sm even:bg-bg-row md:px-4">
                {member.jerseyNumber !== null && (
                  <span className="w-6 text-right text-xs text-text-tertiary tabular-nums">{member.jerseyNumber}</span>
                )}
                <span className="font-semibold">{member.name}</span>
              </li>
            ))}
          </ul>
        </Panel>
      ))}
    </div>
  );
}
