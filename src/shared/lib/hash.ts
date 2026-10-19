/**
 * 짧은 해시(FNV-1a 32비트, 16진수 8자리). 암호용이 아니다.
 * 카톡은 미리보기 이미지를 주소 기준으로 캐시하므로, 내용이 바뀌면 주소(`?v=`)가 바뀌게 하는 데 쓴다.
 */
export const shortHash = (text: string) => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};
