import { pingDatabase } from "@/shared/api";
import { getServerEnv } from "@/shared/config";
import { isCronAuthorized } from "@/shared/lib";

/** Vercel Cron(vercel.json)이 하루 한 번 부른다. Supabase 무료 프로젝트 일시정지를 막는다. */
export async function GET(request: Request) {
  if (!isCronAuthorized(request.headers.get("authorization"), getServerEnv().CRON_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const result = await pingDatabase();
  return Response.json(result, { status: result.ok ? 200 : 502 });
}
