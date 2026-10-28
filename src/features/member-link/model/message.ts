/**
 * 개인 링크와 같이 보낼 안내(PLAN.md §4). 관리자가 카톡 1:1 에 그대로 붙인다 — 누구 링크인지, 누르면 무엇이
 * 되는지, 남에게 보내면 안 된다는 것까지 적는다(링크가 곧 그 사람의 열쇠다).
 */
export const memberLinkMessage = (name: string, url: string) =>
  [
    `[Silver Park Rangers] ${name}님 전용 링크예요.`,
    "누르면 가입 없이 바로 들어가서 참석 투표를 할 수 있어요. 한 번 들어가면 다음부터 단톡방 링크도 바로 열려요.",
    "다른 사람에게는 보내지 말아 주세요.",
    url,
  ].join("\n");
