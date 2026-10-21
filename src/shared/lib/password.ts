import { z } from "zod";

/**
 * 비밀번호 규칙. 가입 신청과 비밀번호 바꾸기가 같이 쓴다.
 * 공백도 비밀번호의 일부라 다듬지 않는다. 72자는 bcrypt 한계(Supabase 와 같다).
 */
export const passwordField = z.string().min(8, "비밀번호는 8자 이상이에요.").max(72, "비밀번호는 72자까지예요.");
