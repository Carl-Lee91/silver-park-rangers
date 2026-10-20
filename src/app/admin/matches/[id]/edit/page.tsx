import { AdminMatchEditView } from "@/views/admin-match-edit";

export default async function Page({ params }: PageProps<"/admin/matches/[id]/edit">) {
  const { id } = await params;
  return <AdminMatchEditView matchId={id} />;
}
