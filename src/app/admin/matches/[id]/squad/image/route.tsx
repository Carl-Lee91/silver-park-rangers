import type { NextRequest } from "next/server";
import { fetchMatch } from "@/entities/match/server";
import { squadForImage } from "@/entities/squad";
import { fetchSquad } from "@/entities/squad/server";
import { squadImageResponse } from "@/widgets/squad-image/server";

/**
 * 관리자용 저장 이미지: ?view=quarters(쿼터별 시트) · ?view=rotation(출전표).
 * 공개 전에도 **저장한** 스쿼드를 그린다. 공개 전 스쿼드는 RLS 가 관리자에게만 주므로,
 * 다른 사람이 주소를 쳐도 공개된 스쿼드밖에 못 본다. 🔴 캐시에 남기지 않는다(private).
 */
export async function GET(request: NextRequest, { params }: RouteContext<"/admin/matches/[id]/squad/image">) {
  const { id } = await params;
  const match = await fetchMatch(id);
  if (match === null) return new Response("매치가 없어요.", { status: 404 });

  const squad = squadForImage(match, await fetchSquad(match.id));
  if (squad === null) return new Response("저장된 스쿼드가 없어요. 스쿼드 빌더에서 먼저 저장해 주세요.", { status: 404 });

  const view = request.nextUrl.searchParams.get("view") === "rotation" ? "rotation" : "quarters";
  return squadImageResponse(view, squad, "private");
}
