@AGENTS.md

# Project Rules — silver-park-rangers (Next.js + FSD)

> 위 `@AGENTS.md` 는 `next dev` 가 자동으로 갱신한다. **지우지 말고 함께 커밋한다.**
> 거기 적힌 대로 이 Next.js 는 학습 데이터와 다를 수 있으니, 확실하지 않으면
> `node_modules/next/dist/docs/` 의 해당 가이드를 먼저 읽는다.

우리 축구팀 전용 스쿼드 관리 웹이다. 참석 투표 → 쿼터별 스쿼드 편성 → 카톡 공유까지 한다.

## 🔴 기획은 [docs/PLAN.md](docs/PLAN.md) 가 정본이다

기능 작업 전에 해당 절을 먼저 읽는다. 기획에 없는 것은 만들지 않는다.

- 세부 기획은 **만들면서 조정한다.** 작업 중에 결정이 바뀌면 같은 작업 안에서
  PLAN.md 도 고친다(`Docs:` 커밋으로 분리). 코드와 기획이 어긋나면 다음 작업이
  틀린 쪽을 믿게 된다.
- 기획과 다르게 해야 할 이유가 생기면 **먼저 보고**한다. 조용히 바꾸지 않는다.

### 용어 → 코드 이름

| 기획 용어 | 코드 | 뜻 |
| --- | --- | --- |
| 매치 | `match` | 하루 일정 하나 (기본 10:00~13:00) |
| 쿼터 | `quarter` | 매치 안의 경기 하나(25~30분). 기본 6개 |
| 멤버 · 용병 | `member` / `guest` (`member_type`) | 운영진만 보는 구분 |
| 운영진 · 일반 | `admin` / `user` (`role`) | 권한 |
| 포지션 | `FW` `AM` `WG` `MF` `WB` `CB` `GK` | PLAN.md §5 |

## 🔴 비용은 0원이다

비상업용 팀 도구라서 **무료 플랜 안에서만** 만든다.

- 새 서비스나 외부 API 를 들이기 전에 무료 한도를 확인하고, 그 결과를 보고에 적는다.
- 카드 등록을 요구하는 플랜(Firebase Blaze 등)은 쓰지 않는다. 사용량이 0이어도 안 된다.
- 지금 걸려 있는 한도:
  - Supabase 무료 — 7일 동안 요청이 없으면 일시정지, 조직당 활성 프로젝트 2개
  - Vercel Hobby — 비상업용만, Cron 은 하루 1회

## 🔴 주 무대는 카톡 인앱 브라우저다

링크는 단톡방으로 퍼지고, 대부분 **카카오톡 인앱 브라우저**에서 열린다. 거기서 안
되면 안 되는 것이다.

- 구글 로그인은 인앱 브라우저에서 막힌다(`disallowed_useragent`). 로그인은 카카오만 쓴다.
- 파일 다운로드, 클립보드, 공유 시트처럼 브라우저 기능에 기대는 것은 인앱
  브라우저에서 동작하는지 확인하고, 안 되면 대체 경로를 둔다.
- 모바일 우선이다. 한 열의 최대 폭(`max-w-100`)을 잡고 가운데 세우며, 데스크톱
  전용 배치를 따로 만들지 않는다. 예외가 필요해 보이면(예: 스쿼드 빌더) 먼저 보고한다.
- 색·간격은 `src/app/globals.css` 의 `@theme` 토큰으로만 쓴다. 컴포넌트에 값을
  하드코딩하지 않는다.

### 외부 연동은 키가 없어도 코드가 완성돼 있어야 한다

Supabase·카카오 로그인·카카오 공유처럼 외부 키가 필요한 기능은 **키를 나중에 넣어도
곧바로 동작하도록** 로직을 다 짜 둔다.

1. 필요한 환경변수를 `shared/config` 의 스키마와 [.env.example](.env.example) 에 추가한다
2. 값이 없을 때는 그 자리에 **무엇이 빠졌는지 보이는 대체 화면**을 둔다 — 조용히
   빈 화면이 되면 나중에 무엇을 안 넣었는지 알 수 없다
3. 값이 채워지면 코드 변경 없이 살아나야 한다

---

## 아키텍처: Feature-Sliced Design (FSD)

### 레이어와 의존 방향

```
app → views → widgets → features → entities → shared
```

- **상위 레이어만 하위 레이어를 import** 할 수 있다. 역방향 금지.
- **같은 레이어 내 슬라이스 간 import 금지.**
  `features/attendance-vote` 가 `features/squad-builder` 를 import 할 수 없다.
  - 예외: **entities 끼리는 타입만** 가져올 수 있다(`import type`). 포지션 코드처럼
    여러 엔티티가 같은 어휘를 쓰기 때문이다. 값(함수·상수)이 필요하면 그 값을 쓰는
    쪽을 한 레이어 올리거나, 호출하는 쪽에서 계산해 인자로 넘긴다.
- `widgets` 는 cross-feature 합성 UI 가 실제로 필요해질 때까지 도입하지 않는다.
- 여러 feature 가 같이 쓰는 도메인 규칙(예: 자동 배치, 출전 수 집계)은 순수 함수로
  `entities` 에 둔다.

**경계는 `pnpm lint` 가 강제한다.** `eslint-plugin-boundaries` 가
[eslint.config.mjs](eslint.config.mjs) 에 설정돼 있고, 위반하면 린트가 실패한다.

### 🔴 Next.js 라 달라지는 것 — `pages` 가 아니라 `views`

FSD 표준 레이어 이름은 `pages` 지만 Next.js 의 `pages/` 라우터와 겹친다.
그래서 이 저장소에서는 **`src/views/`** 로 부른다. 역할은 FSD 의 pages 와 같다.

**`src/app/` 은 Next.js 라우팅 파일만 둔다.** 라우트 파일은 얇게 유지하고 화면은
`views` 에서 조립한다.

```tsx
// src/app/(main)/matches/[id]/page.tsx  ← 라우팅만
import { MatchDetailView } from "@/views/match-detail";
export default function Page() { return <MatchDetailView />; }
```

### 슬라이스 구조

```
features/<name>/
├── ui/       컴포넌트
├── model/    상태, 훅, 비즈니스 로직
├── api/      서버 통신, query/mutation, query key
├── lib/      슬라이스 내부 유틸
└── index.ts  public API — 외부에서 import 가능한 것만 re-export
```

- **외부에서는 `index.ts` 만 import.**
  `@/features/attendance-vote` 는 되고 `@/features/attendance-vote/ui/VoteForm` 은 안 된다.
- 슬라이스 **내부**에서는 상대 경로를 쓴다.

#### 🔴 서버 전용은 `server.ts` 로 나눈다

`index.ts` 는 **어디서 import 해도 안전해야 한다.** `next/headers` 를 쓰는 모듈이
기본 배럴에 섞이면, 그 배럴을 import 한 **클라이언트 컴포넌트가 딸려 오면서 빌드가
깨진다.**

```
entities/match/
├── index.ts    타입 · 순수 함수 · 매퍼   ← 클라이언트도 안전
└── server.ts   조회 함수(next/headers)  ← 서버에서만
```

`@/entities/match/server` 처럼 두 번째 진입점을 쓰는 것은 이 경우에만 허용한다.
그 밖의 깊은 경로 import 는 여전히 금지다.

### 🔴 Server Component 가 기본이다

- **`"use client"` 는 필요한 곳에만 붙인다.** 상태·이벤트 핸들러·브라우저 API 가
  있을 때만이다. 붙이는 순간 그 아래 트리 전체가 클라이언트가 된다.
- `"use client"` 는 **가능한 한 잎(leaf)에 가깝게** 둔다. `views` 최상단에 붙이면
  Server Component 의 이점이 전부 사라진다.
- **데이터 조회는 가능하면 Server Component 에서 한다.** 그러면 클라이언트 상태
  관리가 아예 필요 없다. TanStack Query 는 "클라이언트에서 다시 읽어야 하는 것"에만 쓴다.
- 서버 전용 값(토큰, 비밀)이 클라이언트 컴포넌트로 넘어가지 않게 한다.
  props 로 넘기면 직렬화되어 브라우저로 나간다.

### 상태 관리 정책

| 무엇 | 어디 |
| --- | --- |
| 서버 데이터 (서버에서 읽어도 되는 것) | **Server Component** 에서 직접 조회 |
| 서버 데이터 (클라이언트 갱신이 필요한 것) | TanStack Query. Zustand 에 절대 두지 않음 |
| 클라이언트/UI 상태 (스쿼드 빌더 편집 중 배치 등) | Zustand. 슬라이스 종속 상태는 슬라이스 `model/` 에 |
| 폼 상태 | react-hook-form + zod |
| URL 상태 | `useSearchParams` / `params` |

> 라이브러리는 **첫 기능이 필요로 할 때 넣는다.** 미리 깔아 두면 무엇이 왜
> 필요했는지가 기록에서 사라진다.

### Query Key 규칙

- Query key 는 쓰는 슬라이스의 `api/queryKeys.ts` 에 정의한다. **중앙 집중 금지.**
- 키 모양은 `[domain, operation, ...params]` (예: `["matches", "detail", matchId]`).

### 에러 처리

- Supabase 클라이언트 생성과 전역 에러 처리는 **`shared/api` 에 단일 구현.**
  슬라이스는 거기서 만든 클라이언트만 쓴다.
- 슬라이스에서 ad-hoc `try/catch` 후 UI 를 직접 부르지 않는다. `queryFn` /
  `mutationFn` 만 쓰고 에러는 전역에서 처리한다.
- 세션 만료(401) → 전역에서 세션 정리 + `/login` 리다이렉트.

## 백엔드: Supabase

- 🔴 **접근 통제는 RLS 가 한다.** 모든 테이블은 RLS 를 켜고 정책을 같은 마이그레이션에서
  만든다. 화면 가드(`proxy.ts`)는 길 안내일 뿐 보안이 아니다 — anon key 는 브라우저에
  공개되므로 누구든 API 를 직접 부를 수 있다.
- 스키마 변경은 `supabase/migrations/` 의 마이그레이션 파일로만 한다. 대시보드에서
  직접 고치지 않는다.
- 🔴 마이그레이션을 고치면 **`pnpm db:verify`** 를 돌린다. 로컬 Postgres 에 임시 DB 를
  띄워 마이그레이션을 깔고 `supabase/verify/rls_scenarios.sql` 의 권한 시나리오를 검사한다
  (Docker 불필요). 정책을 새로 만들면 막혀야 하는 경우와 열려야 하는 경우를 시나리오에
  같이 넣는다.
- 원격 적용은 지금은 SQL Editor 에 붙여 실행한다. 적용한 파일은 [docs/SETUP.md](docs/SETUP.md)
  §1 의 표에 적는다.
- Supabase 대시보드·카카오 콘솔·Vercel 설정은 [docs/SETUP.md](docs/SETUP.md) 에 있다.
- DB 타입은 손으로 쓰지 않고 생성한다(Supabase 를 연결하면 `pnpm db:types`).
- service role key 는 서버에서만, 꼭 필요할 때만 쓴다. RLS 를 건너뛰기 때문이다.

## 환경변수

- `shared/config` 의 zod 스키마에 추가한 뒤 거기서 내보낸 값만 쓴다.
  `process.env` 를 코드 곳곳에서 직접 읽지 않는다.
- 브라우저로 나가야 하는 값만 `NEXT_PUBLIC_` 접두사를 붙인다.
  **접두사를 붙이면 번들에 그대로 들어간다.** 비밀은 절대 붙이지 않는다.

## 🔴 사용자 판단 기준 (승인 게이트)

- **서비스를 쓸 수 있는 사람 = `status === 'approved'`.** 판단 함수는 `entities/member`
  한 곳에 두고, DB 의 `is_approved()` 와 정의를 같게 유지한다. 둘이 어긋나면 화면은
  열리는데 데이터가 비거나, 그 반대가 된다.
- **운영진 = 승인됨 + `role === 'admin'`.** DB 의 `is_admin()` 과 같다.
- 🔴 **멤버/용병 구분(`member_type`)은 운영진 전용이다.** 운영진만 읽는
  `member_admin_info` 테이블에만 둔다. 일반 사용자에게 가는 응답·화면·공유 이미지에
  절대 섞지 않는다.

---

## TDD — 이 프로젝트의 기본

**테스트를 먼저 쓴다.** 순서가 규칙이다.

1. **빨강** — 기대 동작을 표현하는 테스트를 먼저 쓴다. 이 시점에 실패해야 한다.
2. **초록** — 통과시키는 **최소한의** 구현을 쓴다.
3. **리팩터** — 통과 상태를 유지하며 구조를 고친다.

급한 수정이라도 순서는 같다. 테스트 없는 코드 변경은 머지하지 않는다.

| 대상 | 어디 | 도구 |
| --- | --- | --- |
| 순수 함수 · 유틸 · 상태 타입 | `*.test.ts` (대상과 같은 폴더) | Vitest |
| 커스텀 hook | `*.test.ts` | Vitest + `renderHook` |
| 클라이언트 컴포넌트 | `*.test.tsx` | Vitest + Testing Library + jsdom |

- 테스트 파일은 **대상 코드와 같은 슬라이스 안에 둔다(co-locate).**
- 🔴 **Server Component 는 jsdom 으로 렌더되지 않는다.** async 서버 컴포넌트는
  단위 테스트 대상이 아니다. 그 안의 **로직을 순수 함수로 빼서** 테스트하고,
  렌더 결과는 e2e 로 본다.

### 반드시 커버해야 하는 경로

- 승인 게이트 분기 (온보딩 전 / 승인 대기 / 거절 / 승인 / 휴면) 와 리다이렉트
- 운영진 권한 분기
- 🔴 **자동 배치 규칙** (PLAN.md §6) — 보장 출전 수, 도착·떠나는 시간, 전담 키퍼,
  키퍼 쿼터 미집계, 경고. 규칙을 바꿀 때는 PLAN.md §6 과 테스트를 **같이** 고친다.
- 쿼터 시각 계산
- 폼 검증 (온보딩: 선호 포지션 1~3개, 주발 최소 1개)
- 캐시 상호작용 (낙관적 업데이트, invalidate)
- 빈 상태 / 에러 상태 UI 분기

### 실행

```
pnpm test        # Vitest 1회 실행
pnpm test:watch  # watch 모드
pnpm typecheck   # tsc --noEmit
pnpm lint        # ESLint + FSD 경계 검사
pnpm build       # 프로덕션 빌드
pnpm db:verify   # 마이그레이션 + RLS 시나리오 (로컬 Postgres)
```

### 구현 완료 후 필수 프로세스

1. `pnpm test` 통과
2. `pnpm typecheck` 통과
3. `pnpm lint` 통과 (FSD 경계 위반 0)
4. DB 를 고쳤으면 `pnpm db:verify` 통과
5. **카테고리별로 파편화하여** 커밋

---

## 커밋 파편화 규칙

같은 작업이라도 성격이 다르면 **별도 커밋**으로 쪼갠다. 한 커밋에
`Feat` + `Style` + `Test` 를 섞지 않는다.

- `Feat:` 새 기능 추가
- `Refactor:` 기능 변경 없이 구조 개선
- `Style:` UI/스타일/포매팅 변경
- `Fix:` 버그 수정
- `Test:` 테스트 추가/수정
- `Chore:` 빌드/설정 등 잡일
- `Docs:` 문서 변경 (PLAN.md 포함)

메시지는 **staged 된 파일만** 설명한다. 한 줄로 간결하게.

## 코딩 스타일

- TypeScript strict, React 19.
- 컴포넌트는 default export, 그 외는 named export.
- 컴포넌트 파일은 PascalCase, 그 외 ts 파일은 camelCase, 라우트 폴더는 kebab-case.
- `@/*` path alias 를 쓴다. 슬라이스 외부 import 는 항상 슬라이스 root 까지만.

### shadcn/ui 예외 (도입할 때)

- shadcn 컴포넌트는 `src/shared/ui/shadcn/` 에 **격리**해 둔다.
- 이 폴더 안은 shadcn 기본 컨벤션(**소문자 파일명 + named export**)을 그대로 둔다.
  위 PascalCase/default export 규칙의 예외다 — `shadcn add` 로 재생성하기 위함이다.
- 색·라운드는 `src/app/globals.css` 의 토큰을 통해 따른다. shadcn 변수 값을 직접
  바꾸지 말고 매핑을 고친다.
- 아이콘은 `lucide-react` 를 쓴다.

## 브랜치

작업은 `dev` 에서 한다. `main` 은 배포 지점이다(Vercel 프로덕션).
