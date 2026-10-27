import { AdminMemberDetailView } from "@/views/admin-member-detail";

export default async function Page({ params, searchParams }: PageProps<"/admin/members/[id]">) {
  const [{ id }, { from }] = await Promise.all([params, searchParams]);
  return <AdminMemberDetailView memberId={id} from={from} />;
}
