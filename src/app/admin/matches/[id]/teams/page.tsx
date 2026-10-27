import { AdminFutsalTeamsView } from "@/views/admin-futsal-teams";

export default async function Page({ params }: PageProps<"/admin/matches/[id]/teams">) {
  const { id } = await params;
  return <AdminFutsalTeamsView matchId={id} />;
}
