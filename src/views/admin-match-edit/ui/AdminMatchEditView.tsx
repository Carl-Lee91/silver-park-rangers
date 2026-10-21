import { notFound } from "next/navigation";
import { fetchMatch } from "@/entities/match/server";
import { MatchForm, matchToFormValues, updateMatch } from "@/features/match-form";

export default async function AdminMatchEditView({ matchId }: { matchId: string }) {
  const match = await fetchMatch(matchId);
  if (match === null) notFound();

  return (
    <div className="mx-auto flex w-full max-w-narrow flex-col gap-6">
      <h1 className="text-xl font-bold">매치 고치기</h1>
      <MatchForm action={updateMatch} submitLabel="저장" initial={matchToFormValues(match)} matchId={match.id} />
    </div>
  );
}
