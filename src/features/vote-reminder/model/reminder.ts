type Reminder = {
  /** 어느 매치인지("11월 2일 (일) vs FC 한강") */
  match: string;
  /** 아직 투표 안 한 사람(보이는 순서대로) */
  names: readonly string[];
  /** 마감 시각. 지났으면(관리자가 대신 받는 중) null */
  deadline: string | null;
  /** 매치 화면 절대 주소 */
  url: string;
};

/**
 * 단톡방에 붙일 독촉 문구(PLAN.md §4 독촉 문구). 이름을 불러야 사람들이 움직인다. 링크는 마지막 줄에 둬서
 * 카톡이 미리보기 카드를 붙이게 한다.
 */
export const reminderText = ({ match, names, deadline, url }: Reminder) =>
  [
    `[${match}] 참석 투표 부탁드려요.`,
    `아직 안 한 분(${names.length}명): ${names.join(" · ")}`,
    ...(deadline === null ? [] : [`마감: ${deadline}`]),
    url,
  ].join("\n");
