import type { SharedSquad } from "@/entities/squad";
import { adminSquadPath } from "@/shared/config";
import { shortHash } from "@/shared/lib";

/**
 * 이미지 그림을 바꾸면(글꼴·배치·색 등) 올린다. 이미지는 주소마다 기기에 오래 캐시되므로(`cacheControl`),
 * 안 올리면 예전 그림이 계속 보인다.
 */
const IMAGE_DESIGN = 5;

/**
 * 이미지 주소에 붙일 내용 버전. **그려지는 것만** 본다 — 이미지 위쪽의 매치 정보(날짜·시간·장소·상대)와
 * 쿼터별 배치·이름·등번호. 사람을 가리키는 값(멤버 id·공유용 키)은 빼서, 관리자·팀원·공유 링크가 같은 그림에
 * 같은 주소를 쓴다.
 */
export const squadImageVersion = ({ match, quarters }: Pick<SharedSquad, "match" | "quarters">) =>
  shortHash(
    JSON.stringify([
      IMAGE_DESIGN,
      [match.date, match.startsAt, match.endsAt, match.quarterCount, match.venue, match.opponent],
      quarters.map((quarter) => [
        quarter.number,
        quarter.formationName,
        quarter.slots.map((slot) => [slot.slotIndex, slot.position, slot.x, slot.y, slot.memberName, slot.jerseyNumber]),
      ]),
    ]),
  );

/** 이미지 주소. `version` 은 `squadImageVersion` 이다 — 그림이 바뀌면 주소가 바뀌어 카톡·기기 캐시를 피한다. */
export const squadImagePath = (token: string, kind: "card" | "quarters" | "rotation", version: string) =>
  kind === "card" ? `/s/${token}/og?v=${version}` : `/s/${token}/image?view=${kind}&v=${version}`;

/**
 * 관리자용 이미지 주소. 공개 전에도 저장한 스쿼드를 그린다. 관리 화면 아래라 게이트가 길을 막고,
 * 실제로는 RLS 가 공개 전 스쿼드를 관리자에게만 준다.
 */
export const adminSquadImagePath = (matchId: string, kind: "quarters" | "rotation", version: string) =>
  `${adminSquadPath(matchId)}/image?view=${kind}&v=${version}`;
