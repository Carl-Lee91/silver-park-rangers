import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { fetchSharedTeams } from "@/entities/futsal/server";
import { FORMAT_LABELS, formatMatchDate, matchTitle } from "@/entities/match";
import { countPlayers } from "@/entities/squad";
import { fetchSharedSquad } from "@/entities/squad/server";
import { getServerEnv } from "@/shared/config";
import { squadImagePath, squadImageVersion } from "@/widgets/squad-image";
import { SharedSquadView } from "@/views/shared-squad";
import { SharedTeamsView } from "@/views/shared-teams";

// 메타데이터와 본문이 같은 요청에서 한 번만 읽게 한다. 풋살 매치면 팀 명단, 축구면 스쿼드다.
const load = cache(async (token: string) => {
  const shareUrl = `${getServerEnv().SITE_URL}/s/${token}`;
  const [teams, squad] = await Promise.all([fetchSharedTeams(token), fetchSharedSquad(token)]);
  if (teams !== null) {
    return { kind: "teams" as const, shared: teams, title: `${formatMatchDate(teams.match.date)} ${matchTitle(teams.match)} 팀`, shareUrl };
  }
  if (squad === null) return null;
  return {
    kind: "squad" as const,
    squad,
    title: `${formatMatchDate(squad.match.date)} ${matchTitle(squad.match)} 스쿼드`,
    version: squadImageVersion(squad),
    shareUrl,
  };
});

/**
 * 카톡 미리보기 카드(PLAN.md §8). 미리보기 이미지 주소에 내용 해시를 붙여, 스쿼드를
 * 고치면 카톡이 새 이미지를 가져가게 한다. 풋살은 스쿼드 이미지가 없어서 팀 엠블럼 카드를 쓴다.
 */
export async function generateMetadata({ params }: PageProps<"/s/[token]">): Promise<Metadata> {
  const { token } = await params;
  const data = await load(token);
  if (data === null) return { title: "Silver Park Rangers" };

  const { SITE_URL } = getServerEnv();
  if (data.kind === "teams") {
    const { shared, title, shareUrl } = data;
    const players = shared.teams.reduce((sum, team) => sum + team.length, 0);
    const description = `${FORMAT_LABELS[shared.match.format]} · ${players}명 · ${shared.teams.length}팀 · ${shared.match.startsAt}~${shared.match.endsAt}`;
    const image = `${SITE_URL}/opengraph-image.png`;
    return {
      title,
      description,
      openGraph: { type: "website", url: shareUrl, title, description, images: [{ url: image, width: 1200, height: 630 }] },
    };
  }

  const { squad, title, version, shareUrl } = data;
  const description = `${squad.match.quarterCount}쿼터 · ${countPlayers(squad.quarters)}명 · ${squad.match.startsAt}~${squad.match.endsAt}`;
  const image = `${SITE_URL}${squadImagePath(token, "card", version)}`;
  return {
    title,
    description,
    openGraph: { type: "website", url: shareUrl, title, description, images: [{ url: image, width: 800, height: 400 }] },
  };
}

export default async function Page({ params }: PageProps<"/s/[token]">) {
  const { token } = await params;
  const data = await load(token);
  if (data === null) notFound();
  if (data.kind === "teams") return <SharedTeamsView shared={data.shared} shareUrl={data.shareUrl} title={data.title} />;
  return <SharedSquadView token={token} squad={data.squad} shareUrl={data.shareUrl} title={data.title} version={data.version} />;
}
