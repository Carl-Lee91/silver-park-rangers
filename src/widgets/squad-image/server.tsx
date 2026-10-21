import { ImageResponse } from "next/og";
import type { SharedSquad } from "@/entities/squad";
import { loadImageFonts } from "@/shared/lib/server";
import QuarterSheetImage, { quarterSheetSize } from "./ui/QuarterSheetImage";
import RotationImage, { rotationImageSize } from "./ui/RotationImage";
import SquadCardImage, { CARD_SIZE } from "./ui/SquadCardImage";

export type SquadImageKind = "card" | "quarters" | "rotation";

/**
 * 이미지를 어디까지 캐시해도 되는지.
 * - public: 공개된 스쿼드(공유 링크). 주소에 내용 해시(?v=)가 붙어 같은 주소는 같은 그림이다 — 오래 캐시한다.
 * - private: 공개 전 스쿼드(관리자). 🔴 CDN 에 남기면 주소를 아는 누구에게나 나간다. 저장하지 않는다.
 */
const CACHE = {
  public: "public, max-age=300, s-maxage=86400",
  private: "private, no-store",
} as const;

/** 스쿼드 이미지(PNG). 카톡 미리보기 카드, 쿼터별 시트, 출전표. */
export const squadImageResponse = async (
  kind: SquadImageKind,
  squad: SharedSquad,
  cache: keyof typeof CACHE = "public",
) => {
  const fonts = await loadImageFonts();
  const headers = { "Cache-Control": CACHE[cache] };

  if (kind === "card") return new ImageResponse(<SquadCardImage squad={squad} />, { ...CARD_SIZE, fonts, headers });
  if (kind === "quarters") {
    return new ImageResponse(<QuarterSheetImage squad={squad} />, { ...quarterSheetSize(squad), fonts, headers });
  }
  return new ImageResponse(<RotationImage squad={squad} />, { ...rotationImageSize(squad), fonts, headers });
};
