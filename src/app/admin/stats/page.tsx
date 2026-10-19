import { parsePeriod } from "@/entities/stats";
import { AdminStatsView } from "@/views/admin-stats";

export default async function Page({ searchParams }: PageProps<"/admin/stats">) {
  const { period } = await searchParams;
  return <AdminStatsView period={parsePeriod(typeof period === "string" ? period : undefined)} />;
}
