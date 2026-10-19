import { ImageResponse } from "next/og";
import type { SharedSquad } from "@/entities/squad";
import { loadImageFonts } from "@/shared/lib/server";
import QuarterSheetImage, { quarterSheetSize } from "./ui/QuarterSheetImage";
import RotationImage, { rotationImageSize } from "./ui/RotationImage";
import SquadCardImage, { CARD_SIZE } from "./ui/SquadCardImage";

export type SquadImageKind = "card" | "quarters" | "rotation";

/**
 * 스쿼드 이미지(PNG). 카톡 미리보기 카드, 쿼터별 시트, 출전표.
 * 주소에 내용 해시(?v=)가 붙어 있어서 같은 주소는 같은 그림이다 — 오래 캐시해도 된다.
 */
export const squadImageResponse = async (kind: SquadImageKind, squad: SharedSquad) => {
  const fonts = await loadImageFonts();
  const headers = { "Cache-Control": "public, max-age=300, s-maxage=86400" };

  if (kind === "card") return new ImageResponse(<SquadCardImage squad={squad} />, { ...CARD_SIZE, fonts, headers });
  if (kind === "quarters") {
    return new ImageResponse(<QuarterSheetImage squad={squad} />, { ...quarterSheetSize(squad), fonts, headers });
  }
  return new ImageResponse(<RotationImage squad={squad} />, { ...rotationImageSize(squad), fonts, headers });
};
