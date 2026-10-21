export type LinkClick = {
  /** 0 = 왼쪽(기본) 단추 */
  button: number;
  /** Ctrl·⌘·Shift·Alt 를 누른 채 눌렀다(새 탭·새 창) */
  modified: boolean;
  href: string;
  target: string;
  download: boolean;
};

/**
 * 이 클릭이 앱 안에서 다른 화면으로 옮기는지. 그럴 때만 로딩 바를 켠다 —
 * 화면이 안 바뀌는 클릭에 켜면 끌 때(주소가 바뀔 때)가 오지 않는다.
 */
export const isNavigationClick = (click: LinkClick, currentHref: string) => {
  if (click.button !== 0 || click.modified || click.download) return false;
  if (click.target !== "" && click.target !== "_self") return false;
  if (click.href === "") return false;

  let next: URL;
  try {
    next = new URL(click.href, currentHref);
  } catch {
    return false;
  }
  const current = new URL(currentHref);
  if (next.origin !== current.origin) return false;
  return next.pathname !== current.pathname || next.search !== current.search;
};
