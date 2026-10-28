import { AdminDuesView } from "@/views/admin-dues";

export default async function Page({ searchParams }: PageProps<"/admin/dues">) {
  const { month } = await searchParams;
  return <AdminDuesView month={typeof month === "string" ? month : undefined} />;
}
