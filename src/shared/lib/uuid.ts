const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 주소에서 온 id·토큰이 uuid 모양인지. 아니면 DB 에 묻기 전에 "없음"으로 끝낸다. */
export const isUuid = (value: string) => UUID.test(value);
