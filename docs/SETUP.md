# 외부 서비스 설정

> 코드 밖에서 해야 하는 설정을 순서대로 적는다. 끝낸 항목은 체크한다.
> 비용은 모두 0원이다(무료 플랜). 카드 등록을 요구하는 단계는 없다.

## 1. Supabase — DB 만들기

프로젝트: `dgncyxocvoglinbdppul`

- [ ] **SQL Editor** 에 [supabase/migrations/20261019000000_init.sql](../supabase/migrations/20261019000000_init.sql) 전체를 붙여 실행한다.
  - 실행 전에 로컬에서 `pnpm db:verify` 가 통과하는지 본다(RLS 시나리오 검증).
  - 적용한 마이그레이션은 아래 표에 적는다. 적용 여부를 기억에 맡기지 않는다.

| 마이그레이션 | 적용일 |
| --- | --- |
| `20261019000000_init.sql` | |
| `20261019010000_admin_account.sql` | |

## 2. 카카오 개발자 콘솔 — 로그인 앱 만들기

[developers.kakao.com](https://developers.kakao.com) › 내 애플리케이션

- [ ] **애플리케이션 추가**. 앱 이름은 카카오 동의 화면에 그대로 보인다(예: `Silver Park Rangers`). b-match 앱과 따로 만든다.
- [ ] **카카오 로그인 켜기**: 카카오 로그인 › 사용 설정 ON
- [ ] **리다이렉트 URI** 에 Supabase 콜백 주소를 넣는다:
  `https://dgncyxocvoglinbdppul.supabase.co/auth/v1/callback`
- [ ] **동의항목**
  - 닉네임(`profile_nickname`): 필수 동의 — 관리자가 본인 확인할 때 본다
  - 프로필 사진(`profile_image`): 선택 동의
  - 카카오계정(이메일)(`account_email`): **설정하지 않는다.** 비즈 앱으로 전환해야만 켤 수 있다.
- [ ] **Client Secret** 코드를 만들고 "사용함"으로 둔다.
- [ ] 앱 키 중 **REST API 키**와 위 **Client Secret** 을 다음 단계에 쓴다.

## 3. Supabase — 카카오 로그인 연결

- [ ] **Authentication › Sign In / Providers › Kakao**
  - Enable: ON
  - REST API Key: 2단계의 REST API 키
  - Client Secret Code: 2단계의 Client Secret
  - **Allow users without an email: ON** — 이메일 동의항목을 안 받기 때문이다
- [ ] **Authentication › URL Configuration**
  - Site URL: 운영 주소(Vercel). 배포 전이면 `http://localhost:3000`
  - Redirect URLs 에 추가:
    - `http://localhost:3000/auth/callback`
    - `https://<Vercel 주소>/auth/callback` (배포 후)

켜고 나면 로그인 화면의 "카카오 로그인이 아직 켜지지 않았어요" 안내가 로그인 단추로 바뀐다. 코드는 바꾸지 않는다.

## 4. 어드민 계정 만들기

선수가 아닌 운영용 전용 계정이다. 관리자 지정·해제는 이 계정만 한다(PLAN.md §3).

- [ ] **Authentication › Users › Add user › Create new user**
  - 이메일·비밀번호를 정하고 **Auto Confirm User** 를 켠다.
  - Email 제공자(Authentication › Sign In / Providers › Email)는 켜 둔다. 비밀번호 로그인에 쓴다.
    누가 이메일로 따로 가입해도 승인 전에는 아무것도 못 보므로 막지 않아도 된다.
- [ ] SQL Editor 에서 그 계정을 어드민으로 넣는다:

  ```sql
  insert into public.owners (user_id)
  select id from auth.users where email = '어드민 이메일';
  ```

  `owners` 에는 쓰기 정책이 없어서 앱에서는 아무도 어드민이 될 수 없다. SQL Editor 로만 넣는다.
- [ ] 로그인 화면 아래 "어드민 계정으로 로그인"(`/login/admin`)으로 들어가 본다.

## 5. 첫 관리자 지정

- [ ] 관리자로 둘 사람이 카카오로 로그인하고 가입 신청까지 마친다.
- [ ] 어드민 계정으로 관리 화면 › 멤버에서 **멤버로 승인** 한 뒤, 그 사람의 "관리" › **관리자로 지정** 을 누른다.

## 6. Vercel — 배포

- [ ] GitHub 저장소(`Carl-Lee91/silver-park-rangers`)를 Import 한다. Production 브랜치는 `main`.
- [ ] Environment Variables 에 [.env.example](../.env.example) 의 이름으로 값을 넣는다.
  `SITE_URL` 은 Vercel 주소다.
- [ ] 3단계의 Redirect URLs 에 Vercel 주소의 `/auth/callback` 을 추가한다.
