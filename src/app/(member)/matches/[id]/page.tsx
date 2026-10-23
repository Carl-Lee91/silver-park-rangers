import { MatchDetailView } from "@/views/match-detail";

export default async function Page({ params }: PageProps<"/matches/[id]">) {
  const { id } = await params;
  return <MatchDetailView matchId={id} />;
}
