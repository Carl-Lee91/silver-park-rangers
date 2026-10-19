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

## 2. 카카오 개발자 콘솔 — 로그인 앱 만들기

[developers.kakao.com](https://developers.kakao.com) › 내 애플리케이션

- [ ] **애플리케이션 추가**. 앱 이름은 카카오 동의 화면에 그대로 보인다(예: `Silver Park Rangers`). b-match 앱과 따로 만든다.
- [ ] **카카오 로그인 켜기**: 카카오 로그인 › 사용 설정 ON
- [ ] **리다이렉트 URI** 에 Supabase 콜백 주소를 넣는다:
  `https://dgncyxocvoglinbdppul.supabase.co/auth/v1/callback`
- [ ] **동의항목**
  - 닉네임(`profile_nickname`): 필수 동의 — 운영진이 본인 확인할 때 본다
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

## 4. 첫 운영진 지정

승인할 운영진이 아무도 없으니, 첫 운영진은 손으로 지정한다.

- [ ] 본인이 카카오로 로그인하고 가입 신청(실명·주발·포지션)까지 마친다.
- [ ] SQL Editor 에서 실행한다:

  ```sql
  update public.members
     set role = 'admin', status = 'approved'
   where real_name = '본인 실명';  -- 같은 이름이 있으면 id 로 고른다
  ```

  SQL Editor 는 운영진 검사(트리거)를 통과한다. 앱에서는 아무도 스스로 운영진이 될 수 없다.
- [ ] 같이 운영하는 사람도 가입 신청 후 같은 방법으로, 또는 관리자 화면이 생기면 거기서 지정한다.

## 5. Vercel — 배포

- [ ] GitHub 저장소(`Carl-Lee91/silver-park-rangers`)를 Import 한다. Production 브랜치는 `main`.
- [ ] Environment Variables 에 [.env.example](../.env.example) 의 이름으로 값을 넣는다.
  `SITE_URL` 은 Vercel 주소다.
- [ ] 3단계의 Redirect URLs 에 Vercel 주소의 `/auth/callback` 을 추가한다.
