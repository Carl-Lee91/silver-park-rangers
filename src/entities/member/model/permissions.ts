import type { Gate } from "./gate";
import type { MemberRole } from "./member";

/**
 * 멤버 관리 권한(PLAN.md §3). 화면에 단추를 보일지 정하는 데 쓴다.
 * 🔴 실제 검사는 DB 의 RPC 가 한다. 여기와 DB 의 규칙이 같아야 누를 수 없는 단추가 안 생긴다.
 */
export const canManageMembers = (viewer: Gate) => viewer === "owner" || viewer === "admin";

/** 관리자 지정·해제 — 어드민만 (`set_member_role`) */
export const canChangeRole = (viewer: Gate) => viewer === "owner";

/** 휴면·복귀 — 관리자는 일반 멤버만, 다른 관리자는 어드민만 (`set_member_status`) */
export const canChangeStatus = (viewer: Gate, target: { role: MemberRole }) =>
  viewer === "owner" || (viewer === "admin" && target.role !== "admin");

/**
 * 임시 비밀번호 — 관리자는 일반 멤버 것만, 관리자의 것은 어드민만 (`reset_member_password`).
 * 관리자끼리 서로의 계정에 들어가지 못하게 휴면과 같은 선을 긋는다.
 */
export const canResetPassword = (viewer: Gate, target: { role: MemberRole }) => canChangeStatus(viewer, target);
