// 브라우저 전용 진입점(실시간 수신). 기본 진입점(index.ts)에 싣지 않는다 — 서버에서 불리면 안 된다.
export { watchMembers } from "./api/realtime";
