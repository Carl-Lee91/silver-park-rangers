import type { ReactNode } from "react";
import type { RatingValues } from "@/entities/rating";
import PlayerTip, { type PlayerProfile } from "../ui/PlayerTip";

/**
 * 선수 id → 이름 앞 ! 단추. 화면(views)이 만들어 목록에 넘긴다 — 목록은 엔티티 · 기능 층이라 멤버와 능력치를
 * 함께 그리는 이 단추를 직접 가져올 수 없다.
 *
 * `ratings` 는 관리자가 볼 때만 넘긴다(null 이면 팀원 화면 — 능력치를 보여 주지 않는다).
 * 넘긴 프로필에서 툴팁에 쓰는 칸만 골라 브라우저로 보낸다(멤버/용병 구분 · 이메일 같은 것이 섞여 나가지 않게).
 */
export const playerTips = (
  people: readonly PlayerProfile[],
  ratings: Readonly<Record<string, RatingValues>> | null,
): Record<string, ReactNode> =>
  Object.fromEntries(
    people.map(({ id, realName, jerseyNumber, preferredPositions, feet }) => [
      id,
      <PlayerTip
        key={id}
        profile={{ id, realName, jerseyNumber, preferredPositions, feet }}
        ratings={ratings?.[id] ?? null}
        showRatings={ratings !== null}
      />,
    ]),
  );
