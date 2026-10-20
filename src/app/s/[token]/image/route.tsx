import type { NextRequest } from "next/server";
import { fetchSharedSquad } from "@/entities/squad/server";
import { squadImageResponse } from "@/widgets/squad-image/server";

/** 저장용 이미지: ?view=quarters(쿼터별 시트) · ?view=rotation(출전표) */
export async function GET(request: NextRequest, { params }: RouteContext<"/s/[token]/image">) {
  const { token } = await params;
  const squad = await fetchSharedSquad(token);
  if (squad === null) return new Response("공개된 스쿼드가 없어요.", { status: 404 });
  const view = request.nextUrl.searchParams.get("view") === "rotation" ? "rotation" : "quarters";
  return squadImageResponse(view, squad);
}
