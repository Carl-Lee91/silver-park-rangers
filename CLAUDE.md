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
| 멤버 · 용병 | `member` / `guest` (`member_type`) | 관리자만 보는 구분 |
| 그날 용병 | `match_guests` (`guestMatchId`) | 계정 없이 관리자가 매치에 넣는 용병. 멤버 행은 있고 auth 계정은 없다 |
| 선수 등록 · 개인 링크 | `register_member` · `member_links` (`/j/[token]`) | 관리자가 계정 없이 명단에 넣고, 그 사람 전용 로그인 링크를 보낸다. 링크로 들어오면 멤버 id 그대로 auth 계정이 생긴다(PLAN.md §4) |
| 어드민 | `owner` (`owners` 테이블) | 선수가 아닌 운영용 전용 계정. 관리자를 지정한다 |
| 관리자 · 일반 | `admin` / `user` (`role`) | 멤버의 권한 |
| 포지션 | `FW` · `AM` `WG` · `MF` `WM` · `DM` `WB` · `CB` `FB` · `GK` | 1선 ~ 5선(줄마다 중앙 · 측면) + 골키퍼. PLAN.md §5 |

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

- 로그인은 이메일·비밀번호만 쓴다. 소셜 로그인은 다른 화면을 오가다 인앱 브라우저에서
  깨진다(구글은 아예 막힌다, `disallowed_useragent`). 메일도 보내지 않는다 — Supabase 기본
  메일은 팀원에게 가지 않는다(PLAN.md §2). 비밀번호 분실은 관리자의 임시 비밀번호로 푼다.
- 파일 다운로드, 클립보드, 공유 시트처럼 브라우저 기능에 기대는 것은 인앱
  브라우저에서 동작하는지 확인하고, 안 되면 대체 경로를 둔다.
- 🔴 새 창(`target="_blank"`, `window.open`)을 쓰지 않는다. 홈 화면에 추가한 앱(PWA)에서는 앱이 하나 더
  뜨고, 뒤로 가기에 앱이 꺼진다. 같은 화면 위에 덮어 열고 주소(`?image=` 처럼)에 상태를 남겨 뒤로 가기로 닫는다
  (`features/squad-share` 의 `SquadImageViewer`).
- 모바일 우선 **반응형**이다(PLAN.md §7 "화면 크기"). 모바일을 먼저 짜고 태블릿(`md`, 768px)·
  데스크톱(`lg`, 1024px)에서 넓힌다. 본문 최대 폭은 `@theme` 의 컨테이너 토큰만 쓴다 —
  `max-w-narrow`(폼 하나) · `max-w-page`(팀원 화면) · `max-w-wide`(관리 화면).
  - 배치만 다르면 CSS(`md:` · `lg:`, 놓인 자리 폭이 기준이면 `@container`)로 한다. **그리는 것 자체가
    달라질 때만**(쿼터 보드의 탭 ↔ 한눈에 보기) `useMediaQuery(TABLET_UP)` 를 쓴다.
  - 같은 내용을 화면 크기별로 두 번 그리지 않는다(숨긴 쪽도 테스트·스크린리더에 잡힌다). 순서는 `order-*`,
    자리는 grid 로 옮긴다(스쿼드 빌더의 저장 줄).
- 색·간격은 `src/app/globals.css` 의 `@theme` 토큰으로만 쓴다. 컴포넌트에 값을
  하드코딩하지 않는다.
  - 예외: 서버 이미지(`next/og`, Satori)는 CSS 변수를 못 읽는다. 그래서
    `widgets/squad-image/lib/palette.ts` 에 **같은 값**을 둔다. 토큰을 바꾸면 거기도 같이 바꾼다
    (`palette.test.ts` 가 두 값이 같은지 검사한다).
  - 🔴 서버 이미지의 그림(색·글꼴·배치)을 바꾸면 `widgets/squad-image/lib/imagePath.ts` 의 `IMAGE_DESIGN` 을
    올린다. 이미지는 주소마다 기기에 오래 캐시돼서, 안 올리면 예전 그림이 계속 보인다.
  - 앱은 **다크 모드 하나**다(PLAN.md §7 "색"). 토큰 값 자체가 어두운 값이고 밝은 모드는 없다. 흰색·검정을
    하드코딩하지 않는다(`text-white` 대신 `text-text-primary`). 서버 이미지는 기본 글자색이 검정이라 틀에 글자색을 준다.
  - 우리 팀 유니폼 색은 `--color-kit` 하나다(경기장 유니폼 · 강조색 primary). 바꾸면 `palette.ts` 의 `kit`·`primary` 도
    같이 바꾼다. 경기장 위 선수는 `entities/formation` 의 `Jersey`(유니폼 모양 안에 등번호)로 그린다.
  - 생김새는 **풋볼매니저 24** 다(PLAN.md §7 "테마"): 하늘색 머리띠, 바탕(`bg-base`) 위에 뜬 패널(`bg-panel`),
    표 줄무늬(`bg-row`), 패널 머리 · 칩(`bg-subtle`), 승 · 무 · 패(`result-*`). 바탕 단계와 대비는 `theme.test.ts` 가 검사한다.
  - 🔴 모서리는 **`rounded-box`(6px: 패널 · 단추 · 입력칸)와 `rounded-chip`(4px: 칩 · 작은 칸)** 두 가지와 `rounded-full` 만
    쓴다. `rounded-xl` 같은 크기를 직접 고르면 `theme.test.ts` 가 막는다.
  - 팀 엠블럼은 원본 `assets/brand/spr_logo.png` 하나에서 `scripts/brand-icons.py` 로 모든 크기(화면 · 파비콘 · 홈 화면 앱 아이콘 ·
    미리보기 이미지 · 서버 이미지)를 만든다(docs/SETUP.md §8). 화면에서는 `shared/ui` 의 `Emblem` 으로 그린다.
  - 🔴 `next.config.ts` 의 Turbopack 파일 캐시는 꺼 둔다. 켜 두면 Vercel 이 되살린 빌드 캐시 때문에 `globals.css` 에
    새로 넣은 토큰이 운영 CSS 에서 빠진다(2026-10-21, 유니폼 색이 안 나왔다). 다시 켜지 않는다.

### 외부 연동은 키가 없어도 코드가 완성돼 있어야 한다

Supabase 처럼 외부 키·설정이 필요한 기능은 **키를 나중에 넣어도
곧바로 동작하도록** 로직을 다 짜 둔다.

1. 필요한 환경변수를 `shared/config` 의 스키마와 [.env.example](.env.example) 에 추가한다
2. 값이 없을 때는 그 자리에 **무엇이 빠졌는지 보이는 대체 화면**을 둔다 — 조용히
   빈 화면이 되면 나중에 무엇을 안 넣었는지 알 수 없다
3. 값이 채워지면 코드 변경 없이 살아나야 한다

## 🔴 화면 · 디자인시스템을 바꾸면 Figma 도 같이 바꾼다

디자인 정본은 Figma 파일 **[실버파크레인저스](https://www.figma.com/design/8A4XYEhzz6zZqIQkI5FfLK)**
(fileKey `8A4XYEhzz6zZqIQkI5FfLK`)이다. 코드와 Figma 가 어긋나면 다음 작업이 틀린 쪽을 믿게 된다.

- **화면을 새로 만들거나 고치면** 같은 작업 안에서 Figma 의 해당 페이지도 고친다.
  - `와이어프레임`: 화면의 뼈대(배치 · 들어가는 내용)
  - `화면기획서`: 화면마다 무엇을 하고 어디로 가는지(PLAN.md 의 그 절과 같게)
  - `v1.0`: 실제 화면 디자인(디자인시스템의 변수 · 스타일 · 컴포넌트로만 그린다)
- 🔴 **화면은 반응형이다 — 휴대폰 · 태블릿 · 데스크톱 세 크기를 모두 만든다.**
  - 코드: 세 크기(휴대폰 < 768 · 태블릿 `md` 768 · 데스크톱 `lg` 1024 이상) 모두에서 배치를 정하고 확인한다(PLAN.md §7 "화면 크기").
    휴대폰만 보고 끝내지 않는다.
  - Figma: `와이어프레임` · `v1.0` 에 화면마다 **세 프레임을 모두** 넣는다 — 휴대폰 375 · 태블릿 768 · 데스크톱 1440.
    프레임 이름은 `ID 화면 · Mobile | Tablet | Desktop`(예: `M-01 홈 · Desktop`)이고, 프레임에 Layout 변수 모드(Mobile · Tablet · Desktop)를 건다.
    한 크기라도 빠지면 그 화면은 끝나지 않은 것이다.
- **디자인시스템을 추가 · 수정하면**(`globals.css` 의 `@theme` 토큰, 글자 크기 · 굵기, 그림자, 아이콘, `shared/ui` 부품)
  Figma `디자인시스템` 페이지와 변수 · 스타일도 같이 바꾼다.
  - 변수 이름 · 코드 이름(code syntax)은 CSS 변수와 같게 둔다(`bg/base` ↔ `var(--color-bg-base)`). 값을 바꾸면 Figma 변수 값도 바꾼다.
  - 아이콘을 새로 쓰면(lucide) Figma `Icons · 브랜드 에셋` 보드에 같은 규칙(24 격자 · 선 2 · 둥근 끝)으로 컴포넌트를 더한다.
  - 엠블럼 원본이 바뀌면 `Brand/Emblem` 컴포넌트 그림도 바꾼다.
- Figma 는 MCP(`use_figma`)로 고친다. 작업 보고에 무엇을 바꿨는지(페이지 · 보드 · 변수) 적는다.
  Figma 를 고칠 수 없는 상황이면(연결 끊김 등) 조용히 넘기지 말고 보고에 "Figma 미반영"으로 남긴다.

---

## 아키텍처: Feature-Sliced Design (FSD)

### 레이어와 의존 방향

```
app → views → widgets → features → entities → shared
```

- **상위 레이어만 하위 레이어를 import** 할 수 있다. 역방향 금지.
- **같은 레이어 내 슬라이스 간 import 금지.**
  `features/attendance-vote` 가 `features/squad-builder` 를 import 할 수 없다.
  - 예외 1: **entities 끼리는 타입만** 가져올 수 있다(`import type`). 값(함수·상수)이
    필요하면 그 값을 쓰는 쪽을 한 레이어 올리거나, 호출하는 쪽에서 계산해 인자로 넘긴다.
  - 예외 2: **`entities/position` 은 값도** 가져올 수 있다. 동작 없는 공통 어휘(포지션 코드·
    이름)라서 막으면 엔티티마다 같은 목록을 베끼게 된다. 다른 엔티티에 이 예외를 늘리지 않는다.
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

반대로 **브라우저 전용**(Supabase Realtime 같은 것)은 `browser.ts`·`realtime.ts` 로 연다
(`@/shared/api/browser`, `@/entities/member/realtime`). `shared/api` 의 기본 진입점은 서버 전용이라
클라이언트 컴포넌트가 가져오면 `next/headers` 가 딸려 간다.

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
- Supabase 대시보드·Vercel 설정은 [docs/SETUP.md](docs/SETUP.md) 에 있다.
- DB 타입은 손으로 쓰지 않고 생성한다(Supabase 를 연결하면 `pnpm db:types`).
- service role key 는 서버에서만, 꼭 필요할 때만 쓴다. RLS 를 건너뛰기 때문이다. 지금은 개인 링크 로그인 한 곳뿐이다
  (`shared/api` 의 `signInAsMember`: 계정 만들기 · 세션 열기). 데이터를 읽고 쓰는 데는 쓰지 않는다.

## 환경변수

- `shared/config` 의 zod 스키마에 추가한 뒤 거기서 내보낸 값만 쓴다.
  `process.env` 를 코드 곳곳에서 직접 읽지 않는다.
- 브라우저로 나가야 하는 값만 `NEXT_PUBLIC_` 접두사를 붙인다.
  **접두사를 붙이면 번들에 그대로 들어간다.** 비밀은 절대 붙이지 않는다.

## 🔴 사용자 판단 기준 (승인 게이트)

- 판단은 `entities/member` 의 `gate`·`permissions` 한 곳에 두고, DB 의 판단 함수·RPC 검사와
  정의를 같게 유지한다. 둘이 어긋나면 화면은 열리는데 데이터가 비거나, 누를 수 없는 단추가 생긴다.
- **어드민 = `owners` 에 있는 계정.** DB 의 `is_owner()`. 멤버 행이 없고 관리 화면만 쓴다.
- **서비스를 쓸 수 있는 사람 = 어드민 또는 `status === 'approved'` 인 멤버.** DB 의 `is_approved()`.
- **관리자 = 어드민 또는 승인됨 + `role === 'admin'`.** DB 의 `is_admin()`.
- **관리자 지정·해제는 어드민만**, 관리자의 휴면·임시 비밀번호도 어드민만 한다
  (`set_member_role`·`set_member_status`·`reset_member_password`).
- 🔴 **멤버/용병 구분(`member_type`)은 관리자 전용이다.** 관리자만 읽는
  `member_admin_info` 테이블에만 둔다. 일반 사용자에게 가는 응답·화면·공유 이미지에
  절대 섞지 않는다. 그날 용병 표시(`match_guests`)도 같다 — 그래서 그날 용병은
  `members` 에 일반 멤버와 같은 모양의 행으로 두고, 구분은 관리자 전용 표에만 남긴다.
- 🔴 **링크 계정**(개인 링크로 만든 auth 계정)은 `app_metadata.link_login` 이 참이고, DB 의 `is_link_account()` 가 같은 값을 본다.
  비밀번호가 없어서 임시 비밀번호(`reset_member_password`)를 막고, 관리 화면에는 이메일 대신 "개인 링크"로 보인다.
- 그날 용병은 매치 하나에만 속한다. 관리 화면의 멤버 목록·미투표자·"투표 없이 온 사람" 후보에서는
  `guestMatchId` 로 걸러 낸다(`groupForAdmin`, `regularMembers`).

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
- 관리자 권한 분기
- 🔴 **자동 배치 규칙** (PLAN.md §6) — 보장 출전 수, 도착·떠나는 시간, 전담 키퍼,
  키퍼 쿼터 미집계, 경고. 규칙을 바꿀 때는 PLAN.md §6 과 테스트를 **같이** 고친다.
- 쿼터 시각 계산
- 폼 검증 (가입 신청·온보딩·그날 용병: 선호 포지션 3개, 1순위 GK 면 GK 하나, 주발 최소 1개)
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
- 🔴 폼 제출 단추는 `shared/ui` 의 **`SubmitButton`** 을 쓴다. `<button type="submit">` 을 직접 쓰지 않는다.
  보내는 동안 막히고 스피너가 돌며 맨 위 로딩 바(`TopProgressBar`)를 켠다 — 이걸 빼먹으면 그 폼만 멈춘 것처럼 보인다.
- 🔴 화면 공통 부품을 쓴다(`shared/ui`). 화면마다 따로 만들면 모양과 동작이 다시 갈라진다.
  - 화면 하나는 **`Screen`**(맨 위 하늘색 머리띠 `TitleBar` + 본문)으로 연다. 제목 · 보조 줄 · 뒤로 가기 · 주요 단추를 띠에 둔다.
    폭은 `narrow`(폼) · `page`(팀원) · `wide`(관리). 관리 화면은 `AdminShell`(데스크톱 왼쪽 메뉴) 안에 `Screen` 을 놓는다.
  - 내용 묶음은 **`Panel`**(어두운 머리 줄 + 본문)에 담는다. 목록 · 표는 `flush` 로 가장자리까지 채우고 짝수 줄에 `bg-bg-row`.
  - 하위 탭(쿼터 · 기간 · 이미지)은 **`tabClass()`**(하늘색 밑줄), 작은 표시(참석 · 공개됨 · D-3)는 **`chipClass(tone)`** 다.
    머리띠 위 칩은 `chipClass("band")`.
  - 드롭다운은 **`Select`**(꺾쇠를 안쪽에 그린다), 입력칸은 **`fieldClass()`**·**`textareaClass()`** 모양을 쓴다.
    글자는 16px 이상이다 — 작으면 아이폰(카톡 포함)이 누를 때 화면을 확대한다. `formControls.test.ts` 가 검사한다.
  - 확인은 **`useConfirm`**·**`useConfirmBeforeSubmit`** 확인 창으로 묻는다. `window.confirm` 을 쓰지 않는다.
    편집 중인 화면(빌더)에서 다른 화면으로 가는 링크는 **`ConfirmLink`** 로, 저장하지 않은 변경이 있으면 `LEAVE_UNSAVED` 를 묻는다.
  - 항목이 무엇을 뜻하는지는 이름 옆 **`HelpTip`**(? 단추)으로 알려 준다. 휴대폰은 누르면, 데스크톱은 마우스를 올리면 뜬다(능력치 항목).
  - 선수 이름이 나오는 목록은 **! 단추 · 등번호 · 이름** 순서다(PLAN.md §7 "선수 정보"). ! 단추는 화면(views)이
    `widgets/player-tip` 의 `playerTips(사람들, 능력치 | null)` 로 만들어 목록에 `tips` 로 넘긴다. 능력치는 관리자일 때만 넘긴다.
    고르기 단추 · 링크 안에 넣지 않고 그 옆에 둔다(단추 안 단추는 안 된다).
  - 저장 결과는 **`useToast`** 로 화면 아래에 띄운다. 뒤로 가기는 **`BackLink`**, 막힌 제출 단추 아래에는
    **`MissingHint`**(남은 항목)를 둔다.
  - 누르는 것(단추·링크·탭)은 44px(`h-11`) 이상으로 둔다. 눌림 효과·펼치기 꺾쇠·한글 어절 줄바꿈·표 숫자 폭은
    `globals.css` 가 전역으로 건다(`globalStyles.test.ts`).
- 화면 이동 로딩은 `app/loading.tsx`(전체)와 `app/admin/loading.tsx`(관리 메뉴 유지)가 맡는다. 새 레이아웃을 만들면
  그 아래에도 `loading.tsx` 를 둔다.

### shadcn/ui 예외 (도입할 때)

- shadcn 컴포넌트는 `src/shared/ui/shadcn/` 에 **격리**해 둔다.
- 이 폴더 안은 shadcn 기본 컨벤션(**소문자 파일명 + named export**)을 그대로 둔다.
  위 PascalCase/default export 규칙의 예외다 — `shadcn add` 로 재생성하기 위함이다.
- 색·라운드는 `src/app/globals.css` 의 토큰을 통해 따른다. shadcn 변수 값을 직접
  바꾸지 말고 매핑을 고친다.
- 아이콘은 `lucide-react` 를 쓴다.

## 브랜치

작업은 `dev` 에서 한다. `main` 은 배포 지점이다(Vercel 프로덕션).
