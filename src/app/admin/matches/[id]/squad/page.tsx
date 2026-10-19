import { AdminSquadView } from "@/views/admin-squad";

export default async function Page({ params }: PageProps<"/admin/matches/[id]/squad">) {
  const { id } = await params;
  return <AdminSquadView matchId={id} />;
}
