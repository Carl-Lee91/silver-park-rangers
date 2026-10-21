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

- [ ] GitHub 저장소(`Carl-Lee91/silver-park-rangers`)를 Import 한다. Production 브랜치는 `main`.
- [ ] Environment Variables 에 [.env.example](../.env.example) 의 이름으로 값을 넣는다.
  `SITE_URL` 은 Vercel 주소다. `CRON_SECRET` 은 아무 긴 문자열(비밀번호 생성기 등)이면 된다.
- [ ] 배포 뒤 Vercel › Settings › Cron Jobs 에 `/api/cron/keep-alive`(매일 1회)가 보이는지 본다.
  Supabase 무료 프로젝트가 7일 동안 요청이 없어 멈추는 것을 막는다. `vercel.json` 에 이미 들어 있다.
- [ ] 배포한 뒤 카톡 공유를 확인한다. 미리보기 카드는 **배포 주소에서만** 뜬다(카카오 수집기는 localhost 에 못 온다).
  - 매치 하나에 스쿼드를 저장·공개하고, 관리자 스쿼드 화면의 "공유하기"로 링크를 단톡방(또는 나와의 채팅)에 붙여 본다.
  - 카드가 안 뜨거나 예전 그림이 뜨면 [카카오 공유 디버거](https://developers.kakao.com/tool/debugger/sharing)에서 그 주소의 캐시를 지운다.
