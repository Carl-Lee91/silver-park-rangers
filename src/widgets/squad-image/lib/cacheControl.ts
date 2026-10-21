/**
 * 이미지 캐시. 주소에 내용 버전(?v=, `squadImageVersion`)이 붙어 같은 주소는 같은 그림이라
 * 기기에는 오래 둔다(immutable — 다시 묻지도 않는다). 그래서 눌러도 다시 만들지 않는다.
 *
 * - public: 공개된 스쿼드(공유 링크). 서버(CDN)에는 하루만 둔다 — 공개를 취소하면 하루 안에 사라진다.
 * - private: 공개 전 스쿼드(관리자). 🔴 서버(CDN)에 남기면 주소를 아는 누구에게나 나간다. 그 기기에만 둔다.
 */
export const IMAGE_CACHE_CONTROL = {
  public: "public, max-age=31536000, immutable, s-maxage=86400",
  private: "private, max-age=31536000, immutable",
} as const;
