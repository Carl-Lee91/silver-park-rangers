export type ImageKind = "quarters" | "rotation";

/** 주소에 이미지 보기 상태를 남기는 이름. 뒤로 가기로 닫으려면 주소에 있어야 한다. */
const PARAM = "image";

export const readImageParam = (search: string): ImageKind | null => {
  const value = new URLSearchParams(search).get(PARAM);
  return value === "quarters" || value === "rotation" ? value : null;
};

/** 다른 값은 그대로 두고 이미지 보기만 넣거나(kind) 뺀다(null). 비면 "" */
export const withImageParam = (search: string, kind: ImageKind | null): string => {
  const params = new URLSearchParams(search);
  if (kind === null) params.delete(PARAM);
  else params.set(PARAM, kind);
  const next = params.toString();
  return next === "" ? "" : `?${next}`;
};
