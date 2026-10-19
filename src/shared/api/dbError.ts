/**
 * DB(RPC·RLS) 오류 코드를 사람이 읽을 안내로 바꾼다.
 * 42501 은 권한 없음(RLS·RPC 의 권한 검사), P0002 는 대상의 상태가 이미 바뀐 경우다.
 */
export const dbErrorMessage = (code: string | undefined): string => {
  if (code === "42501") return "권한이 없어요.";
  if (code === "P0002") return "이미 처리됐거나 상태가 바뀌었어요. 새로고침해 주세요.";
  return "처리하지 못했어요. 잠시 뒤 다시 시도해 주세요.";
};
