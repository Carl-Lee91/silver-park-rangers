import { fetchAuthSettings } from "@/shared/api";
import { isKakaoEnabled } from "../lib/providerAvailability";

/** Supabase 에 카카오 제공자가 켜져 있는지. 켜기 전에는 로그인 단추 대신 안내를 띄운다. */
export const isKakaoLoginReady = async () => isKakaoEnabled(await fetchAuthSettings());
