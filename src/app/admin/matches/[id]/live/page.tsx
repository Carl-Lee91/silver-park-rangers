import { AdminMatchLiveView } from "@/views/admin-match-live";

export default async function Page({ params }: PageProps<"/admin/matches/[id]/live">) {
  const { id } = await params;
  return <AdminMatchLiveView matchId={id} />;
}
