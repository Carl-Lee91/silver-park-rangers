import { AdminMemberDetailView } from "@/views/admin-member-detail";

export default async function Page({ params }: PageProps<"/admin/members/[id]">) {
  const { id } = await params;
  return <AdminMemberDetailView memberId={id} />;
}
