import { fetchSharedSquad } from "@/entities/squad/server";
import { squadImageResponse } from "@/widgets/squad-image/server";

/** 카톡 미리보기 카드(800×400). 로그인 없이 열린다 — 공개된 스쿼드만 그린다. */
export async function GET(_request: Request, { params }: RouteContext<"/s/[token]/og">) {
  const { token } = await params;
  const squad = await fetchSharedSquad(token);
  if (squad === null) return new Response("공개된 스쿼드가 없어요.", { status: 404 });
  return squadImageResponse("card", squad);
}
