import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { formatMatchDate, matchTitle } from "@/entities/match";
import { countPlayers } from "@/entities/squad";
import { fetchSharedSquad } from "@/entities/squad/server";
import { getServerEnv } from "@/shared/config";
import { squadImagePath, squadImageVersion } from "@/widgets/squad-image";
import { SharedSquadView } from "@/views/shared-squad";

// 메타데이터와 본문이 같은 요청에서 한 번만 읽게 한다.
const load = cache(async (token: string) => {
  const squad = await fetchSharedSquad(token);
  if (squad === null) return null;
  return {
    squad,
    title: `${formatMatchDate(squad.match.date)} ${matchTitle(squad.match)} 스쿼드`,
    version: squadImageVersion(squad),
    shareUrl: `${getServerEnv().SITE_URL}/s/${token}`,
  };
});

/**
 * 카톡 미리보기 카드(PLAN.md §8). 미리보기 이미지 주소에 내용 해시를 붙여, 스쿼드를
 * 고치면 카톡이 새 이미지를 가져가게 한다.
 */
export async function generateMetadata({ params }: PageProps<"/s/[token]">): Promise<Metadata> {
  const { token } = await params;
  const data = await load(token);
  if (data === null) return { title: "Silver Park Rangers" };

  const { squad, title, version, shareUrl } = data;
  const description = `${squad.match.quarterCount}쿼터 · ${countPlayers(squad.quarters)}명 · ${squad.match.startsAt}~${squad.match.endsAt}`;
  const image = `${getServerEnv().SITE_URL}${squadImagePath(token, "card", version)}`;
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
  return <SharedSquadView token={token} {...data} />;
}
