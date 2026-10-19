# features — 사용자가 하는 행동 한 단위

`features/<name>/` 안에 필요한 세그먼트만 둔다.

```
features/<name>/
├── ui/       컴포넌트
├── model/    상태, 훅, 비즈니스 로직
├── api/      서버 통신, query/mutation, query key
├── lib/      슬라이스 내부 유틸
└── index.ts  public API — 외부에서 import 가능한 것만 re-export
```

- 외부에서는 `index.ts` 만 import 한다.
  `@/features/attendance-vote` 는 되고 `@/features/attendance-vote/ui/VoteForm` 은 안 된다.
- **같은 레이어의 다른 슬라이스를 import 하지 않는다.** 필요해지면 그것은
  둘의 공통 조상이 될 자리가 있다는 뜻이다.
