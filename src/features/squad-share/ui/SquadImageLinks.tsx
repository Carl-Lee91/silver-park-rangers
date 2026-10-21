const link = "flex h-10 items-center justify-center rounded-lg border border-border text-sm font-medium";

/**
 * 쿼터별·출전표 이미지 열기. 새 창으로 연다 — 다운로드는 카톡 인앱 브라우저에서 잘 안 되지만
 * 길게 눌러 저장은 된다(PLAN.md §8).
 */
export default function SquadImageLinks({ urls }: { urls: { quarters: string; rotation: string } }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <a href={urls.quarters} target="_blank" rel="noopener" className={link}>
        쿼터별 이미지
      </a>
      <a href={urls.rotation} target="_blank" rel="noopener" className={link}>
        출전표 이미지
      </a>
    </div>
  );
}
