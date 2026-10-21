import { fetchAuthSettings } from "@/shared/api";
import { signUpAvailability } from "../lib/signUpAvailability";

/** Supabase 가 가입 신청을 받을 수 있게 설정됐는지. 아니면 폼 대신 안내를 띄운다. */
export const fetchSignUpAvailability = async () => signUpAvailability(await fetchAuthSettings());
