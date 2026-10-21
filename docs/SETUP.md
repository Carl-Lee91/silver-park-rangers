# 외부 서비스 설정

> 코드 밖에서 해야 하는 설정을 순서대로 적는다. 끝낸 항목은 체크한다.
> 비용은 모두 0원이다(무료 플랜). 카드 등록을 요구하는 단계는 없다.

## 1. Supabase — DB 만들기

프로젝트: `dgncyxocvoglinbdppul`

- [ ] **SQL Editor** 에 [supabase/migrations/](../supabase/migrations/) 의 파일을 **이름 순서대로** 하나씩 붙여 실행한다. 아래 표에서 적용일이 빈 것만 실행하면 된다.
  - 실행 전에 로컬에서 `pnpm db:verify` 가 통과하는지 본다(RLS 시나리오 검증).
  - 적용한 마이그레이션은 아래 표에 적는다. 적용 여부를 기억에 맡기지 않는다.

| 마이그레이션 | 적용일 |
| --- | --- |
| `20261019000000_init.sql` | |
| `20261019010000_admin_account.sql` | |
| `20261019020000_voting_closes_at_kickoff.sql` | |
| `20261019030000_save_squad.sql` | |
| `20261019040000_shared_squad.sql` | |
| `20261019050000_admin_stats_source.sql` | |
| `20261019060000_match_notes.sql` | |
| `20261019070000_match_results.sql` | |
| `20261019080000_realtime_members.sql` | |
| `20261020000000_jersey_numbers.sql` | |
| `20261021000000_email_signup.sql` | |
| `20261021010000_match_guests.sql` | |

## 2. Supabase — 이메일 가입 설정

로그인은 이메일·비밀번호만 쓴다(PLAN.md §2). 카카오 개발자 콘솔은 쓰지 않는다.

- [ ] **Authentication › Sign In / Providers › Email**
  - Email: **ON** (지금 켜져 있다)
  - **Confirm email: OFF** — 🔴 지금 켜져 있다. Supabase 기본 메일은 팀원에게 가지 않아서, 켜 두면 신청한 사람이 로그인하지 못한다. 가입 신청 화면이 켜져 있는 동안 이 안내를 띄운다.
  - Minimum password length: `8` (앱도 8자 이상만 받는다. 기본값 6이어도 동작은 한다)
- [ ] **Authentication › Sign In / Providers** 의 **Allow new users to sign up: ON** (지금 켜져 있다)
- [ ] 카카오 제공자를 켰었다면 끈다(Authentication › Sign In / Providers › Kakao). 코드에서 뺐다.

끄고 나면 `/signup` 의 "이메일 확인이 켜져 있어요" 안내가 가입 신청 폼으로 바뀐다. 코드는 바꾸지 않는다.

## 3. 어드민 계정 만들기

선수가 아닌 운영용 전용 계정이다. 관리자 지정·해제는 이 계정만 한다(PLAN.md §3).

- [ ] **Authentication › Users › Add user › Create new user**
  - 이메일·비밀번호를 정하고 **Auto Confirm User** 를 켠다.
  - 여기서 만든 계정에는 가입 신청 정보가 없어서 멤버 행이 생기지 않는다. 어드민은 선수가 아니니 그게 맞다.
- [ ] SQL Editor 에서 그 계정을 어드민으로 넣는다:

  ```sql
  insert into public.owners (user_id)
  select id from auth.users where email = '어드민 이메일';
  ```

  `owners` 에는 쓰기 정책이 없어서 앱에서는 아무도 어드민이 될 수 없다. SQL Editor 로만 넣는다.
- [ ] 팀원과 같은 로그인 화면(`/login`)으로 들어가 본다. 관리 화면으로 바로 간다.

## 4. 첫 관리자 지정

- [ ] 관리자로 둘 사람이 `/signup` 에서 가입 신청한다.
- [ ] 어드민 계정으로 관리 화면 › 멤버에서 **멤버로 승인** 한 뒤, 그 사람의 "관리" › **관리자로 지정** 을 누른다.

## 5. 한 번씩 써 보기

로컬(`pnpm db:verify`)에서 검증했지만, 인증 서버와 맞물리는 부분이라 실제 프로젝트에서 한 번 확인한다.

- [ ] **임시 비밀번호**: 테스트 계정 하나를 가입·승인한 뒤, 멤버 관리 › 관리 › **임시 비밀번호 만들기** 로 만든 비밀번호로 로그인되는지 본다. 그다음 `/me` 에서 비밀번호를 바꿔 본다.
  - 로그인이 안 되면 알려 준다. 임시 비밀번호는 DB 함수가 `auth.users` 에 bcrypt 로 직접 쓰는데, 그 방식이 막혀 있으면 서버에서 Supabase 관리 API 로 바꾼다.
- [ ] **그날 용병**: 매치 화면 › 그날 용병 › **용병 넣기** 로 한 명 넣고, 스쿼드 빌더 벤치에 오르는지 본다.

## 6. Vercel — 배포

- [ ] [vercel.com](https://vercel.com) › Add New › Project 에서 GitHub 저장소(`Carl-Lee91/silver-park-rangers`)를 Import 한다.
  - Framework 는 Next.js 로 자동으로 잡힌다. Build·Install 명령은 건드리지 않는다.
  - Project Name 이 주소가 된다: `https://<Project Name>.vercel.app`. 아래 `SITE_URL` 에 그대로 쓴다.
- [ ] Import 화면의 **Environment Variables** 에 아래 5개를 넣는다(나중에는 Settings › Environment Variables).
  적용 범위는 **Production · Preview** 둘 다 체크한다.

  | 이름 | 값 | 어디서 |
  | --- | --- | --- |
  | `NEXT_PUBLIC_SUPABASE_URL` | `https://dgncyxocvoglinbdppul.supabase.co` | `.env.local` 과 같다 |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ…` 로 시작하는 긴 값 | `.env.local` 과 같다(Supabase › Project Settings › API Keys 의 anon) |
  | `SITE_URL` | `https://<Project Name>.vercel.app` | 🔴 `.env.local` 의 `localhost` 를 그대로 넣지 않는다. 끝에 `/` 는 없어도 된다 |
  | `CRON_SECRET` | 아무 긴 문자열 | 터미널에서 `openssl rand -hex 32` 로 만든다. 여기에만 넣고 어디에도 적지 않는다 |
  | `ENABLE_EXPERIMENTAL_COREPACK` | `1` | 이 저장소는 pnpm 11 을 쓴다(`packageManager`). 이걸 켜야 Vercel 도 같은 버전으로 설치한다 |

  - `.env.local` 내용을 키 칸에 통째로 붙여 넣으면 한 번에 들어간다. 붙인 뒤 `SITE_URL` 만 고친다.
  - anon key 는 원래 브라우저에 공개되는 값이다(접근 통제는 RLS 가 한다). 그래도 저장소에는 넣지 않는다.
  - 🔴 `NEXT_PUBLIC_` 값은 빌드할 때 박힌다. 값을 바꾸면 Deployments › 최신 배포 › **Redeploy** 를 눌러야 반영된다.
- [ ] Deploy 를 누른다. 끝나면 실제 주소가 `SITE_URL` 과 같은지 본다. 다르면 고치고 Redeploy 한다.
- [ ] Settings › General › **Production Branch** 가 `main` 인지 본다(기본값).
- [ ] 배포 뒤 Settings › Cron Jobs 에 `/api/cron/keep-alive`(매일 1회)가 보이는지 본다.
  Supabase 무료 프로젝트가 7일 동안 요청이 없어 멈추는 것을 막는다. `vercel.json` 에 이미 들어 있다.
- [ ] 배포한 뒤 카톡 공유를 확인한다. 미리보기 카드는 **운영 주소에서만** 뜬다(카카오 수집기는 localhost 와 미리보기 배포에 못 온다).
  - 매치 하나에 스쿼드를 저장·공개하고, 관리자 스쿼드 화면의 "공유하기"로 링크를 단톡방(또는 나와의 채팅)에 붙여 본다.
  - 카드가 안 뜨거나 예전 그림이 뜨면 [카카오 공유 디버거](https://developers.kakao.com/tool/debugger/sharing)에서 그 주소의 캐시를 지운다.

## 7. CI/CD — 어떻게 돌아가나

따로 켤 것은 없다. 위 6단계까지 하면 아래처럼 돈다.

| 할 때 | 무엇이 | 어디서 |
| --- | --- | --- |
| `dev`·`main` 에 푸시, PR | 린트 · 타입 검사 · 테스트 · 마이그레이션+RLS 검사 | GitHub Actions(`.github/workflows/ci.yml`). 공개 저장소라 무료 |
| `dev` 에 푸시 | **미리보기 배포**(주소가 따로 나온다) | Vercel. 기본 설정상 Vercel 에 로그인한 나만 열린다 |
| `main` 에 머지 | **운영 배포**(`SITE_URL`) | Vercel |

- 흐름: `dev` 에서 작업 → 미리보기 주소에서 확인 → `dev` → `main` PR(CI 통과 확인) → 머지하면 운영에 나간다.
- 🔴 미리보기 배포도 **운영과 같은 Supabase DB** 를 쓴다(무료 프로젝트 하나). 미리보기에서 만든 매치·데이터는 실제 데이터다.
- 🔴 **DB 마이그레이션은 자동으로 나가지 않는다.** 새 마이그레이션이 든 변경은 `main` 에 머지하기 **전에** SQL Editor 로 먼저 적용하고 §1 표에 적는다. 코드가 먼저 나가면 새 표·함수가 없어서 화면이 깨진다.
- 선택: GitHub › Settings › Branches 에서 `main` 에 규칙을 걸고 "Require status checks to pass" 에 `check` 를 고르면, CI 가 실패한 PR 은 머지되지 않는다(공개 저장소는 무료).
