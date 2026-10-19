# shared — 도메인을 모르는 것들

가장 아래 레이어. **도메인 용어(매치, 쿼터, 멤버…)가 등장하면 여기 있으면 안 된다.**

```
shared/
├── api/      Supabase 클라이언트, 전역 오류 처리
├── config/   환경변수 (zod 스키마로 검증한 뒤 내보낸다)
├── lib/      순수 유틸 (서버 전용은 lib/server.ts)
├── ui/       공용 UI 컴포넌트 (shadcn 은 ui/shadcn/ 에 격리)
└── assets/   코드가 읽는 파일 (서버 이미지용 한글 폰트 등)
```
