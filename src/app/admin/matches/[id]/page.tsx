import { AdminMatchDetailView } from "@/views/admin-match-detail";

export default async function Page({ params }: PageProps<"/admin/matches/[id]">) {
  const { id } = await params;
  return <AdminMatchDetailView matchId={id} />;
}
