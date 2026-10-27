# 외부 서비스 설정

> 코드 밖에서 해야 하는 설정을 순서대로 적는다. 끝낸 항목은 체크한다.
> 비용은 모두 0원이다(무료 플랜). 카드 등록을 요구하는 단계는 없다.

## 1. Supabase — DB 만들기

프로젝트: `dtpkyyethevbigjmiclk` (서울)

> 2026-10-27 — 처음 프로젝트(`dgncyxocvoglinbdppul`)를 **시드니**에 만들어서, 데이터를 옮기지 않고 **서울**에 새로 만든다.
> 쓸 데이터가 없어서(테스트 계정 · 더미 선수뿐) 옮기지 않는다. 가입했던 계정도 새 프로젝트에서 다시 만든다.
> 프로젝트 지역은 만든 뒤 바꿀 수 없다.

### 새 프로젝트 만들기(처음 한 번)

- [x] [supabase.com](https://supabase.com/dashboard) › New project
  - **Region: Northeast Asia (Seoul)** 🔴 다른 지역을 고르지 않는다. 지역은 나중에 못 바꾼다.
  - 플랜: Free. Database password 는 아무 긴 값으로 만들고 비밀번호 관리자에 둔다(앱은 쓰지 않는다).
  - 무료 플랜은 조직당 활성 프로젝트 2개다. 이미 2개면 아래 "시드니 프로젝트 지우기"를 먼저 한다.
- [x] **SQL Editor** › New query 에 마이그레이션 전부를 **한 번에** 붙여 실행한다.
  - 터미널에서 `pnpm -s db:bundle | pbcopy` 로 복사한다([supabase/migrations/](../supabase/migrations/) 전부를 이름 순서대로 한 트랜잭션에 묶은 것).
  - 한 트랜잭션이라 중간에 실패하면 아무것도 깔리지 않는다. 오류 메시지를 알려 주면 고쳐서 다시 붙인다.
  - 붙이기 전에 로컬에서 `pnpm db:verify` 가 통과하는지 본다 — 같은 묶음을 깔아 RLS 시나리오를 검사한다.
  - 다 되면 아래 표에 적용일을 적는다. 이후 새 마이그레이션은 그 파일 하나만 붙인다.
- [ ] 아래 §2(이메일 설정) · §3(어드민 계정) · §4(첫 관리자)를 새 프로젝트에서 다시 한다. 🔴 새 프로젝트는 **Confirm email 이 켜진 채로** 만들어진다.
- [ ] Project Settings › API Keys 에서 **Project URL** 과 **anon** 키를 `.env.local` 과 Vercel(§6) 에 바꿔 넣는다. Vercel 은 바꾼 뒤 **Redeploy** 해야 한다(`NEXT_PUBLIC_` 값은 빌드에 박힌다).
- [ ] 새 주소로 로그인 · 가입 신청이 되는지 본 뒤, **시드니 프로젝트를 지운다**: 시드니 프로젝트 › Project Settings › General › Delete project.
  - 지우면 되돌릴 수 없다. 새 프로젝트가 잘 도는 것을 확인한 뒤에 지운다(이미 2개라서 먼저 지워야 했다면 예외).
  - 홈 화면에 앱을 추가한 폰은 예전 로그인이 끊겨 로그인 화면으로 간다. 새로 가입 신청하면 된다.

| 마이그레이션 | 적용일 |
| --- | --- |
| `20261019000000_init.sql` | 2026-10-27 |
| `20261019010000_admin_account.sql` | 2026-10-27 |
| `20261019020000_voting_closes_at_kickoff.sql` | 2026-10-27 |
| `20261019030000_save_squad.sql` | 2026-10-27 |
| `20261019040000_shared_squad.sql` | 2026-10-27 |
| `20261019050000_admin_stats_source.sql` | 2026-10-27 |
| `20261019060000_match_notes.sql` | 2026-10-27 |
| `20261019070000_match_results.sql` | 2026-10-27 |
| `20261019080000_realtime_members.sql` | 2026-10-27 |
| `20261020000000_jersey_numbers.sql` | 2026-10-27 |
| `20261021000000_email_signup.sql` | 2026-10-27 |
| `20261021010000_match_guests.sql` | 2026-10-27 |

## 2. Supabase — 이메일 가입 설정

로그인은 이메일·비밀번호만 쓴다(PLAN.md §2). 카카오 개발자 콘솔은 쓰지 않는다.

- [x] **Authentication › Sign In / Providers › Email**
  - Email: **ON** (서울 프로젝트 확인됨, 2026-10-27)
  - **Confirm email: OFF** — 서울 프로젝트는 꺼져 있다(2026-10-27 확인). Supabase 기본 메일은 팀원에게 가지 않아서, 켜 두면 신청한 사람이 로그인하지 못한다. 가입 신청 화면이 켜져 있는 동안 이 안내를 띄운다.
  - Minimum password length: `8` (앱도 8자 이상만 받는다. 기본값 6이어도 동작은 한다)
- [x] **Authentication › Sign In / Providers** 의 **Allow new users to sign up: ON** (서울 프로젝트 확인됨)
- [x] 카카오 제공자를 켰었다면 끈다(Authentication › Sign In / Providers › Kakao). 코드에서 뺐다. 서울 프로젝트는 처음부터 꺼져 있다.

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

  | 이름 | 종류 | 값 | 어디서 |
  | --- | --- | --- | --- |
  | `NEXT_PUBLIC_SUPABASE_URL` | Config | `https://dtpkyyethevbigjmiclk.supabase.co` | `.env.local` 과 같다(Supabase › Project Settings › API Keys 의 Project URL) |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Config | `eyJ…` 로 시작하는 긴 값 | `.env.local` 과 같다(Supabase › Project Settings › API Keys 의 anon) |
  | `SITE_URL` | Config | `https://<Project Name>.vercel.app` | 🔴 `.env.local` 의 `localhost` 를 그대로 넣지 않는다. 끝에 `/` 는 없어도 된다 |
  | `CRON_SECRET` | **Secret** | 아무 긴 문자열 | 터미널에서 `openssl rand -hex 32` 로 만든다. 여기에만 넣고 어디에도 적지 않는다 |
  | `ENABLE_EXPERIMENTAL_COREPACK` | Config | `1` | 이 저장소는 pnpm 11 을 쓴다(`packageManager`). 이걸 켜야 Vercel 도 같은 버전으로 설치한다 |

  - `.env.local` 내용을 키 칸에 통째로 붙여 넣으면 한 번에 들어간다. 붙인 뒤 `SITE_URL` 만 고친다.
  - anon key 는 원래 브라우저에 공개되는 값이다(접근 통제는 RLS 가 한다). 그래도 저장소에는 넣지 않는다.
  - **종류**: Vercel 은 변수마다 Config(저장 뒤에도 보임) · Secret(저장 뒤 못 봄)을 고른다. `NEXT_PUBLIC_` 변수를 Secret 으로 두면
    "Remove the public framework prefix … change the variable to Config" 경고가 뜬다 — 접두사를 지우지 말고 **Config** 로 바꾼다.
    🔴 접두사를 지우면 브라우저(가입 대기 실시간 갱신 등)에서 Supabase 주소 · 키를 못 읽어 앱이 깨진다. 진짜 비밀인 `CRON_SECRET` 만 Secret 이다.
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

## 8. 엠블럼 · 아이콘

팀 엠블럼 원본은 `assets/brand/spr_logo.png`(2000×2000, 바탕 투명)이다. 앱이 쓰는 크기는 모두 여기서 만든다.

| 파일 | 쓰는 곳 |
| --- | --- |
| `public/emblem.png` | 화면 속 엠블럼(머리띠 · 관리 메뉴 · 로그인 · 매치 미리보기) |
| `src/app/icon.png` | 브라우저 탭(파비콘) |
| `src/app/apple-icon.png` | 아이폰 홈 화면(앱 바탕색 위) |
| `public/icons/icon-192.png` · `icon-512.png` | 홈 화면 앱(PWA) 아이콘 |
| `public/icons/icon-maskable-512.png` | 안드로이드가 원 · 둥근 사각형으로 깎는 아이콘(안전 영역 안) |
| `src/app/opengraph-image.png` | 카톡 미리보기 기본 이미지. 공유 링크(`/s/…`)는 스쿼드 카드를 따로 쓴다 |
| `src/shared/assets/brand/emblem.png` | 서버 이미지(스쿼드 카드 · 쿼터별 · 출전표) 머리글 |

**엠블럼을 바꾸려면**: 원본을 같은 이름으로 바꾸고 `python3 scripts/brand-icons.py` 를 돌린 뒤(Pillow 필요: `pip install pillow`) 나온 파일을 같이 커밋한다. 서버 이미지 그림이 바뀌므로 `src/widgets/squad-image/lib/imagePath.ts` 의 `IMAGE_DESIGN` 도 올린다.

- 이미 홈 화면에 추가한 폰: 안드로이드는 크롬이 며칠 안에 새 아이콘으로 바꾼다. **아이폰은 홈 화면에서 지우고 다시 추가해야** 새 아이콘이 된다.
- 카톡은 링크 미리보기를 캐시한다. 예전에 공유한 링크는 한동안 예전 그림이 보일 수 있다.

### 앱으로 설치 확인(실제 폰에서 한 번)

로그인 · 홈 · 내 정보의 "앱으로 설치" 패널이 기기에 맞는 방법을 보여 준다(PLAN.md §7). 배포한 주소(https)에서 확인한다 —
서비스 워커는 https(또는 localhost)에서만 돈다.

| 기기 | 해 볼 것 |
| --- | --- |
| 안드로이드 크롬 | 패널의 "앱 설치" 단추 → 설치 창 → 설치. 단추 대신 메뉴 안내가 보이면 ⋮ → "앱 설치" |
| 아이폰 사파리 | 공유 → "홈 화면에 추가" → "추가". 홈 화면 앱에서 **한 번 더 로그인**한다(사파리와 로그인이 따로다) |
| 카톡에서 링크 열기 | "다른 브라우저로 열기" → 크롬 · 사파리가 열리는지. 안 열리면 패널 아래 손 안내대로 |

- 홈 화면 앱은 비행기 모드에서 화면을 옮기면 "연결 안 됨" 화면이 떠야 한다(`public/sw.js`). 데이터는 캐시하지 않는다.
- 패널의 "다음에"는 그 기기에서 2주 동안 로그인 · 홈에서만 접힌다. 내 정보에는 늘 있다.
