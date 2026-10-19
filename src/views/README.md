# views — FSD 의 pages 레이어

FSD 표준 이름은 `pages` 지만 Next.js 의 `pages/` 라우터와 이름이 겹친다.
그래서 이 저장소에서는 **`views`** 로 부른다. 역할은 FSD 의 pages 와 같다.

`src/app/` 은 Next.js 라우팅 파일만 둔다. 라우트 파일은 얇게 유지하고
실제 화면은 여기서 조립한다.

```tsx
// src/app/(main)/matches/[id]/page.tsx
import { MatchDetailView } from "@/views/match-detail";
export default function Page() { return <MatchDetailView />; }
```
