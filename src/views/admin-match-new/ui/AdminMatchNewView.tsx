import { createMatch, MatchForm } from "@/features/match-form";

export default function AdminMatchNewView() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">매치 만들기</h1>
      <MatchForm action={createMatch} submitLabel="매치 만들기" />
    </div>
  );
}
